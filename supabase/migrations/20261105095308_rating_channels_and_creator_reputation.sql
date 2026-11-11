-- Preserve each existing vote and freeze its category across updates.
alter table private.mod_ratings add column channel text not null default 'legacy'
  check (channel in ('legacy','user','creator'));

create function private.classify_mod_rating() returns trigger
language plpgsql set search_path='' as $$
begin
  if tg_op = 'UPDATE' then
    new.channel := old.channel;
    return new;
  end if;

  new.channel := case when (
    with identities as materialized (
      select cm.creator_id from public.creator_members cm
      where cm.profile_id = new.account_id and cm.status = 'approved'
        and public.is_creator_operational(cm.creator_id)
    ), contributions as (
      select m.id from public.mods m join identities i on i.creator_id=m.creator_id
      where m.status='published' and m.visibility in ('public','early_access','supporters')
        and nullif(btrim(m.title),'') is not null
        and (nullif(btrim(m.source_url),'') is not null or nullif(btrim(m.download_url),'') is not null
          or nullif(btrim(m.external_purchase_url),'') is not null or exists(select 1 from public.mod_files f where f.mod_id=m.id))
      union
      select m.id from public.mod_creators mc join identities i on i.creator_id=mc.creator_id
      join public.mods m on m.id=mc.mod_id
      where m.status='published' and m.visibility in ('public','early_access','supporters')
        and nullif(btrim(m.title),'') is not null
        and (nullif(btrim(m.source_url),'') is not null or nullif(btrim(m.download_url),'') is not null
          or nullif(btrim(m.external_purchase_url),'') is not null or exists(select 1 from public.mod_files f where f.mod_id=m.id))
        and mc.role in ('owner','collaborator')
        and (m.creator_id is null or public.is_creator_operational(m.creator_id))
    )
    select count(*) from (select id from contributions limit 3) qualifying
  ) = 3 then 'creator' else 'user' end;
  return new;
end $$;
revoke all on function private.classify_mod_rating() from public,anon,authenticated;
create trigger classify_mod_rating before insert or update on private.mod_ratings
for each row execute function private.classify_mod_rating();

create table private.external_rating_snapshots (
  mod_id uuid not null references public.mods(id) on delete cascade,
  platform_id uuid not null references public.platforms(id),
  source_url text not null,
  primary key (mod_id,platform_id,source_url),
  original_value numeric,
  original_scale numeric check (original_scale > 0),
  rating_count integer check (rating_count >= 0),
  normalized_value numeric check (normalized_value between 0 and 5),
  last_success_at timestamptz,
  retrieval_status text not null check (retrieval_status in ('success','unavailable','failed')),
  check ((last_success_at is null and original_value is null and original_scale is null and normalized_value is null and rating_count is null)
      or (last_success_at is not null and original_value is not null and original_scale is not null and original_value between 0 and original_scale)),
  check (retrieval_status <> 'success' or last_success_at is not null)
);
alter table private.external_rating_snapshots enable row level security;
revoke all on private.external_rating_snapshots from public,anon,authenticated;

-- Record assessments as history; no tier is assigned automatically.
create table private.creator_reputation_assessments (
  id bigint generated always as identity primary key,
  creator_id uuid not null references public.creators(id) on delete cascade,
  tier text check (tier in ('emerging','established','trusted','distinguished','legacy')),
  assessed_at timestamptz not null default now(),
  contribution text,
  reliability text,
  community text,
  recognition text
);
create index creator_reputation_latest on private.creator_reputation_assessments(creator_id,assessed_at desc,id desc);
alter table private.creator_reputation_assessments enable row level security;
revoke all on private.creator_reputation_assessments from public,anon,authenticated;

create function private.read_creator_tier(p_creator_id uuid) returns text
language sql stable security definer set search_path='' as $$
  select tier from private.creator_reputation_assessments
  where creator_id=p_creator_id order by assessed_at desc,id desc limit 1
$$;
create function public.read_creator_tier(p_creator_id uuid) returns text
language sql stable security invoker set search_path='' as $$
  select private.read_creator_tier(p_creator_id)
$$;
revoke all on function private.read_creator_tier(uuid),public.read_creator_tier(uuid) from public,anon,authenticated;
grant execute on function private.read_creator_tier(uuid),public.read_creator_tier(uuid) to anon,authenticated;

create function private.read_mod_rating_channels(p_mod_ids uuid[],p_include_external boolean) returns jsonb
language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_object_agg(m.id, jsonb_build_object(
    'internal', coalesce(v.channels,'{}'::jsonb),
    'external', coalesce(e.sources,'[]'::jsonb)
  )), '{}'::jsonb)
  from public.mods m
  left join lateral (
    select jsonb_object_agg(channel,jsonb_build_object('average',average,'count',votes)) channels
    from (
      select channel,round(avg(value),1) average,count(*) votes
      from private.mod_ratings where mod_id=m.id and is_valid group by channel
    ) totals
  ) v on true
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'platform',p.slug,'url',r.source_url,'value',r.original_value,'scale',r.original_scale,
      'count',r.rating_count,'normalized',r.normalized_value,'updatedAt',r.last_success_at
    ) order by p.slug,r.source_url) sources
    from private.external_rating_snapshots r join public.platforms p on p.id=r.platform_id
    where p_include_external and r.mod_id=m.id and r.last_success_at is not null
      and ((p.slug='gta5mods' and m.source_url=r.source_url) or exists(
        select 1 from public.mod_sources s where s.mod_id=m.id and s.platform_id=r.platform_id and s.canonical_url=r.source_url
      ))
  ) e on true
  where m.id in (select unnest(p_mod_ids[1:100])) and m.status='published'
    and m.visibility in ('public','early_access')
$$;
create function public.read_mod_rating_channels(p_mod_ids uuid[],p_include_external boolean default false) returns jsonb
language sql stable security invoker set search_path='' as $$
  select private.read_mod_rating_channels(p_mod_ids,p_include_external)
$$;
revoke all on function private.read_mod_rating_channels(uuid[],boolean),public.read_mod_rating_channels(uuid[],boolean) from public,anon,authenticated;
grant execute on function private.read_mod_rating_channels(uuid[],boolean),public.read_mod_rating_channels(uuid[],boolean) to anon,authenticated;
-- The operator refresh accepts only an existing GTA5-Mods source with the exact fetched URL.
create function public.record_gta5mods_rating(p_mod_id uuid,p_url text,p_status text,p_value numeric,p_count integer)
returns void language plpgsql security invoker set search_path='' as $$
declare platform uuid;
begin
  select id into strict platform from public.platforms where slug='gta5mods';
  perform 1 from public.mods m where m.id=p_mod_id and m.status='published' and (m.source_url=p_url or exists(
    select 1 from public.mod_sources s where s.mod_id=m.id and s.platform_id=platform and s.canonical_url=p_url
  )) for share of m;
  if not found then raise exception 'GTA5-Mods source does not match.' using errcode='22023'; end if;
  insert into private.external_rating_snapshots(mod_id,platform_id,source_url,original_value,original_scale,rating_count,normalized_value,last_success_at,retrieval_status)
  values (p_mod_id,platform,p_url,case when p_status='success' then p_value end,
    case when p_status='success' then 5 end,case when p_status='success' then p_count end,
    case when p_status='success' then p_value end,case when p_status='success' then now() end,p_status)
  on conflict (mod_id,platform_id,source_url) do update set
    original_value=coalesce(excluded.original_value,external_rating_snapshots.original_value),
    original_scale=coalesce(excluded.original_scale,external_rating_snapshots.original_scale),
    rating_count=case when excluded.last_success_at is not null then excluded.rating_count else external_rating_snapshots.rating_count end,
    normalized_value=coalesce(excluded.normalized_value,external_rating_snapshots.normalized_value),
    last_success_at=coalesce(excluded.last_success_at,external_rating_snapshots.last_success_at),
    retrieval_status=excluded.retrieval_status;
end $$;
revoke all on function public.record_gta5mods_rating(uuid,text,text,numeric,integer) from public,anon,authenticated;
grant usage on schema private to service_role;
grant select,insert,update on private.external_rating_snapshots to service_role;
grant execute on function public.record_gta5mods_rating(uuid,text,text,numeric,integer) to service_role;


