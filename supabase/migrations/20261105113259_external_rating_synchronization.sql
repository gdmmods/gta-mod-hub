-- Private scheduling metadata. No publication or rating rows are rewritten.
alter table private.external_rating_snapshots add column last_checked_at timestamptz;
create table private.external_rating_sync (
  mod_id uuid primary key references public.mods(id) on delete cascade,
  first_published_at timestamptz not null,
  next_check_at timestamptz not null default now(),
  last_manual_at timestamptz,
  last_checked_at timestamptz,
  last_attempt_at timestamptz,
  last_status text,
  last_results jsonb not null default '[]',
  failures integer not null default 0,
  token uuid,
  lease_until timestamptz,
  manual boolean not null default false
);
create index external_rating_sync_due on private.external_rating_sync(next_check_at,mod_id);
alter table private.external_rating_sync enable row level security;
revoke all on private.external_rating_sync from public,anon,authenticated;
grant select,update on private.external_rating_sync to service_role;

create function private.queue_external_rating() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.status='published' then
    insert into private.external_rating_sync(mod_id,first_published_at) values(new.id,now())
    on conflict(mod_id) do nothing;
  end if;
  return new;
end $$;
revoke all on function private.queue_external_rating() from public,anon,authenticated;
create trigger queue_external_rating after insert or update of status on public.mods
for each row execute function private.queue_external_rating();
insert into private.external_rating_sync(mod_id,first_published_at)
select id,least(now(),coalesce(added_at,created_at at time zone 'UTC','epoch'::timestamptz))
from public.mods where status='published' on conflict(mod_id) do nothing;

-- Use the primary creator's owner, matching the existing mod edit authorization.
create function private.can_refresh_external_rating(p_mod uuid,p_account uuid) returns boolean
language sql stable set search_path='' as $$
  select exists(select 1 from public.mods m join public.creators c on c.id=m.creator_id
    where m.id=p_mod and m.status='published' and m.visibility in ('public','early_access')
      and c.owner_id=p_account and c.owner_type is distinct from 'team')
$$;

create function private.external_rating_sources(p_mod uuid)
returns table(platform_id uuid, platform text, url text)
language sql stable set search_path='' as $$
  select p.id,p.slug,s.canonical_url from public.mod_sources s join public.platforms p on p.id=s.platform_id
  where s.mod_id=p_mod
  union
  select p.id,coalesce(p.slug,split_part(m.source_url,'/',3)),m.source_url
  from public.mods m
  left join public.platforms p on p.slug=case
    when m.source_url ~* '^https://(www\.)?gta5-mods\.com/' then 'gta5mods'
    when m.source_url ~* '^https://(www\.)?gtainside\.com/' then 'gtainside'
    when m.source_url ~* '^https://(www\.)?patreon\.com/' then 'patreon'
    end
  where m.id=p_mod and m.source_url ~* '^https?://[^/]+'
$$;

create function private.read_external_rating_sync(p_mod uuid) returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'lastChecked',q.last_attempt_at,'nextCheck',case when exists(
      select 1 from private.external_rating_sources(q.mod_id) s where s.platform='gta5mods'
    ) then q.next_check_at end,'manualAvailable',q.last_manual_at+interval '24 hours',
    'status',case when q.lease_until>now() then 'running' else q.last_status end,'results',q.last_results,
    'sources',(select coalesce(jsonb_agg(s.platform order by s.platform),'[]'::jsonb)
      from (select distinct platform from private.external_rating_sources(q.mod_id)) s))
  from private.external_rating_sync q where q.mod_id=p_mod and private.can_refresh_external_rating(p_mod,auth.uid())
$$;
create function public.read_external_rating_sync(p_mod uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
  select private.read_external_rating_sync(p_mod)
$$;
revoke all on function private.can_refresh_external_rating(uuid,uuid),private.external_rating_sources(uuid),
  private.read_external_rating_sync(uuid),public.read_external_rating_sync(uuid) from public,anon,authenticated;
grant execute on function private.read_external_rating_sync(uuid),public.read_external_rating_sync(uuid) to authenticated;
grant execute on function private.can_refresh_external_rating(uuid,uuid),private.external_rating_sources(uuid) to service_role;

-- Both entry points use the same lease. One worker at a time also bounds provider concurrency.
create function public.claim_external_rating_sync(p_mod uuid default null,p_account uuid default null) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare q private.external_rating_sync; sources jsonb; claimed uuid;
begin
  if p_mod is not null and not private.can_refresh_external_rating(p_mod,p_account) then
    return jsonb_build_object('status','forbidden');
  end if;
  perform pg_advisory_xact_lock(62571,1);
  if exists(select 1 from private.external_rating_sync where lease_until>now()) then
    return jsonb_build_object('status','busy');
  end if;
  if exists(select 1 from private.external_rating_sync where last_status='rate_limited' and last_checked_at>now()-interval '1 hour') then
    return jsonb_build_object('status','rate_limited');
  end if;
  select j.* into q from private.external_rating_sync j join public.mods m on m.id=j.mod_id
  where m.status='published' and m.visibility in ('public','early_access') and
    (case when p_mod is not null then j.mod_id=p_mod
      else j.next_check_at<=now() and exists(select 1 from private.external_rating_sources(j.mod_id) s where s.platform='gta5mods')
    end)
  order by j.next_check_at,j.mod_id limit 1 for update of j;
  if not found then return jsonb_build_object('status','idle'); end if;
  if p_mod is not null and q.last_manual_at>now()-interval '24 hours' then
    return jsonb_build_object('status','cooldown','manualAvailable',q.last_manual_at+interval '24 hours');
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('platform',s.platform,'url',s.url) order by s.platform,s.url),'[]')
    into sources from private.external_rating_sources(q.mod_id) s;
  claimed:=gen_random_uuid();
  update private.external_rating_sync set token=claimed,lease_until=now()+interval '90 seconds',last_attempt_at=now(),
    manual=p_mod is not null,last_manual_at=case when p_mod is not null then now() else last_manual_at end
  where mod_id=q.mod_id;
  return jsonb_build_object('status','claimed','modId',q.mod_id,'token',claimed,'sources',sources);
end $$;

create function private.finish_external_rating_sync(p_mod uuid,p_token uuid,p_results jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q private.external_rating_sync; item jsonb; src record; previous private.external_rating_snapshots;
  result text; overall text; details jsonb:='[]'; any_failure boolean:=false;
  any_rate_limit boolean:=false; any_success boolean:=false; any_change boolean:=false;
  any_unavailable boolean:=false; value numeric; votes integer; due timestamptz;
begin
  select * into q from private.external_rating_sync where mod_id=p_mod and token=p_token and lease_until>now() for update;
  if not found then return jsonb_build_object('status','expired'); end if;
  perform 1 from public.mods where id=p_mod and status='published' and visibility in ('public','early_access') for share;
  if not found then
    update private.external_rating_sync set token=null,lease_until=null where mod_id=p_mod;
    return jsonb_build_object('status','unavailable','results','[]'::jsonb);
  end if;
  for item in select * from jsonb_array_elements(p_results) loop
    select * into src from private.external_rating_sources(p_mod) s
      where s.platform=item->>'platform' and s.url=item->>'url';
    if not found then continue; end if;
    result:=item->>'status';
    if src.platform='gta5mods' and src.platform_id is not null and result in ('success','unavailable','failed','rate_limited','invalid') then
      if result='success' then
        value:=(item->>'value')::numeric;
        votes:=(item->>'count')::integer;
        select * into previous from private.external_rating_snapshots
          where mod_id=p_mod and platform_id=src.platform_id and source_url=src.url;
        any_success:=true;
        if previous.last_success_at is not null and previous.original_value=value and previous.rating_count is not distinct from votes then
          result:='unchanged';
        else any_change:=true;
        end if;
      end if;
      perform public.record_gta5mods_rating(p_mod,src.url,case when result='unchanged' then 'success'
        when result in ('rate_limited','invalid') then 'failed' else result end,
        case when result in ('success','unchanged') then value end,
        case when result in ('success','unchanged') then votes end);
      update private.external_rating_snapshots set last_checked_at=now()
        where mod_id=p_mod and platform_id=src.platform_id and source_url=src.url;
    else result:='unsupported';
    end if;
    any_failure:=any_failure or result in ('failed','invalid','rate_limited');
    any_rate_limit:=any_rate_limit or result='rate_limited';
    any_unavailable:=any_unavailable or result='unavailable';
    details:=details||jsonb_build_array(jsonb_build_object('platform',src.platform,'status',result));
  end loop;
  overall:=case when any_rate_limit then 'rate_limited' when any_failure and any_success then 'partial'
    when any_failure then 'failed' when any_change then 'updated' when any_success then 'unchanged'
    when any_unavailable then 'unavailable' else 'unsupported' end;
  due:=case when now()<q.first_published_at+interval '7 days'
    then now()+interval '24 hours' else now()+interval '7 days' end;
  if any_failure then due:=least(due,now()+interval '1 hour'*power(2,least(q.failures,4))); end if;
  update private.external_rating_sync set token=null,lease_until=null,last_checked_at=now(),
    last_status=overall,last_results=details,next_check_at=case when q.manual then q.next_check_at else due end,
    failures=case when q.manual then q.failures when any_failure then least(q.failures+1,5) else 0 end
  where mod_id=p_mod;
  return jsonb_build_object('status',overall,'results',details);
end $$;
create function public.finish_external_rating_sync(p_mod uuid,p_token uuid,p_results jsonb) returns jsonb
language sql security invoker set search_path='' as $$
  select private.finish_external_rating_sync(p_mod,p_token,p_results)
$$;
revoke execute on function public.record_gta5mods_rating(uuid,text,text,numeric,integer) from service_role;
revoke insert,update on private.external_rating_snapshots from service_role;
revoke all on function private.finish_external_rating_sync(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function private.finish_external_rating_sync(uuid,uuid,jsonb) to service_role;
revoke all on function public.claim_external_rating_sync(uuid,uuid),public.finish_external_rating_sync(uuid,uuid,jsonb)
  from public,anon,authenticated;
grant execute on function public.claim_external_rating_sync(uuid,uuid),public.finish_external_rating_sync(uuid,uuid,jsonb)
  to service_role;

