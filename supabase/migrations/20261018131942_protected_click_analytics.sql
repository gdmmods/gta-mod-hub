create table public.mod_click_events (
  event_id uuid primary key,
  mod_id uuid not null references public.mods(id) on delete cascade,
  action_type text not null check (action_type in ('download', 'primary_source', 'creator_backup', 'other_source')),
  target_hash text not null check (target_hash = 'legacy' or target_hash ~ '^[a-f0-9]{64}$'),
  session_hash text not null check (session_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);

create index mod_click_events_session_window_idx
  on public.mod_click_events (session_hash, mod_id, action_type, target_hash, created_at desc);

create schema if not exists analytics_private;
revoke all on schema analytics_private from public, anon, authenticated;

create table analytics_private.mod_click_target_totals (
  mod_id uuid not null references public.mods(id) on delete cascade,
  action_type text not null check (action_type in ('download', 'primary_source', 'creator_backup', 'other_source')),
  target_hash text not null check (target_hash ~ '^[a-f0-9]{64}$'),
  click_count bigint not null default 0 check (click_count >= 0),
  primary key (mod_id, action_type, target_hash)
);

create table public.mod_click_totals (
  mod_id uuid not null references public.mods(id) on delete cascade,
  action_type text not null check (action_type in ('download', 'primary_source', 'creator_backup', 'other_source')),
  click_count bigint not null default 0 check (click_count >= 0),
  primary key (mod_id, action_type)
);

alter table public.mod_click_events enable row level security;
alter table analytics_private.mod_click_target_totals enable row level security;
alter table public.mod_click_totals enable row level security;

revoke all on table public.mod_click_events from public, anon, authenticated;
grant all on table public.mod_click_events to service_role;
revoke all on table analytics_private.mod_click_target_totals from public, anon, authenticated, service_role;

revoke all on table public.mod_click_totals from public, anon, authenticated;
grant select on table public.mod_click_totals to anon, authenticated;

create policy "Public can read published mod click aggregates"
  on public.mod_click_totals
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.mods as m
      where m.id = mod_click_totals.mod_id
        and m.status = 'published'
        and m.visibility in ('public', 'early_access')
    )
  );

insert into public.mod_click_totals (mod_id, action_type, click_count)
select id, 'download', downloads
from public.mods
where downloads > 0
on conflict (mod_id, action_type)
do update set click_count = excluded.click_count;

create or replace function public.record_mod_click(
  p_event_id uuid,
  p_mod_id uuid,
  p_action_type text,
  p_target_hash text,
  p_target_url text,
  p_session_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_visibility text;
  v_download_url text;
  v_source_url text;
  v_creator_backup_url text;
  v_target_matches boolean := false;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Not authorized';
  end if;

  if p_event_id is null
    or p_mod_id is null
    or p_action_type is null
    or p_target_url is null
    or p_target_hash is null
    or p_session_hash is null
    or p_action_type not in ('download', 'primary_source', 'creator_backup', 'other_source')
    or p_target_hash !~ '^[a-f0-9]{64}$'
    or p_session_hash !~ '^[a-f0-9]{64}$'
  then
    raise exception 'Invalid click event';
  end if;

  select m.status, m.visibility, m.download_url, m.source_url, m.creator_backup_url
  into v_status, v_visibility, v_download_url, v_source_url, v_creator_backup_url
  from public.mods as m
  where m.id = p_mod_id;

  if v_status is distinct from 'published'
    or (v_visibility is distinct from 'public' and v_visibility is distinct from 'early_access')
  then
    return false;
  end if;

  if p_action_type = 'download' then v_target_matches := p_target_url = v_download_url; end if;
  if p_action_type = 'primary_source' then v_target_matches := p_target_url = v_source_url; end if;
  if p_action_type = 'creator_backup' then v_target_matches := p_target_url = v_creator_backup_url; end if;
  if p_action_type = 'other_source' then
    select exists (
      select 1 from public.mod_sources as ms
      where ms.mod_id = p_mod_id and ms.canonical_url = p_target_url
    ) into v_target_matches;
  end if;
  if not v_target_matches then return false; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_event_id::text, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_session_hash || p_mod_id::text, 0)
  );

  if exists (select 1 from public.mod_click_events as e where e.event_id = p_event_id) then
    return false;
  end if;

  if exists (
    select 1 from public.mod_click_events as e
    where e.session_hash = p_session_hash
      and e.mod_id = p_mod_id
      and e.action_type = p_action_type
      and e.target_hash = p_target_hash
      and e.created_at > now() - interval '30 minutes'
  ) then
    return false;
  end if;

  if (
    select count(*) from public.mod_click_events as e
    where e.session_hash = p_session_hash
      and e.created_at > now() - interval '1 hour'
  ) >= 60 then
    return false;
  end if;

  delete from public.mod_click_events as e
  where e.created_at < now() - interval '90 days';

  insert into public.mod_click_events (event_id, mod_id, action_type, target_hash, session_hash)
  values (p_event_id, p_mod_id, p_action_type, p_target_hash, p_session_hash);

  insert into analytics_private.mod_click_target_totals (mod_id, action_type, target_hash, click_count)
  values (p_mod_id, p_action_type, p_target_hash, 1)
  on conflict (mod_id, action_type, target_hash)
  do update set click_count = analytics_private.mod_click_target_totals.click_count + 1;

  insert into public.mod_click_totals (mod_id, action_type, click_count)
  values (p_mod_id, p_action_type, 1)
  on conflict (mod_id, action_type)
  do update set click_count = public.mod_click_totals.click_count + 1;

  if p_action_type = 'download' then
    update public.mods as m
    set downloads = coalesce(m.downloads, 0) + 1
    where m.id = p_mod_id;
  end if;

  return true;
end;
$$;

revoke all on function public.record_mod_click(uuid, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_mod_click(uuid, uuid, text, text, text, text) to service_role;

revoke execute on function public.increment_downloads(uuid) from public, anon, authenticated;
