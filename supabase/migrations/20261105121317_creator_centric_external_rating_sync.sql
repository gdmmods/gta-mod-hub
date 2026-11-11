-- Expired jobs remain as manual-only history.
alter table private.external_rating_sync alter column next_check_at drop not null;
update private.external_rating_sync set next_check_at=null
where next_check_at>=first_published_at+interval '720 hours'
   or first_published_at+interval '720 hours'<=now();

create table private.external_rating_provider_state (
  platform text primary key, strikes integer not null default 0, paused_until timestamptz
);
alter table private.external_rating_provider_state enable row level security;
revoke all on private.external_rating_provider_state from public,anon,authenticated;
grant select on private.external_rating_provider_state to service_role;
insert into private.external_rating_provider_state(platform) values('gta5mods');



create or replace function private.read_external_rating_sync(p_mod uuid) returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'lastChecked',q.last_attempt_at,'automaticEnded',q.first_published_at+interval '720 hours'<=now(),
    'pausedUntil',(select paused_until from private.external_rating_provider_state where platform='gta5mods' and paused_until>now()),
    'nextCheck',case when q.next_check_at < q.first_published_at+interval '720 hours' and q.first_published_at+interval '720 hours'>now() and exists(
      select 1 from private.external_rating_sources(q.mod_id) s where s.platform='gta5mods'
    ) then q.next_check_at end,'manualAvailable',q.last_manual_at+interval '24 hours',
    'status',case when q.lease_until>now() then 'running' else q.last_status end,'results',q.last_results,
    'sources',(select coalesce(jsonb_agg(s.platform order by s.platform),'[]'::jsonb)
      from (select distinct platform from private.external_rating_sources(q.mod_id)) s))
  from private.external_rating_sync q where q.mod_id=p_mod and private.can_refresh_external_rating(p_mod,auth.uid())
$$;

create or replace function public.claim_external_rating_sync(p_mod uuid default null,p_account uuid default null) returns jsonb
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
  select j.* into q from private.external_rating_sync j join public.mods m on m.id=j.mod_id
  where m.status='published' and m.visibility in ('public','early_access') and
    (case when p_mod is not null then j.mod_id=p_mod
      else j.next_check_at<=now() and j.first_published_at+interval '720 hours'>clock_timestamp() and exists(select 1 from private.external_rating_sources(j.mod_id) s where s.platform='gta5mods')
    end)
  order by j.next_check_at,j.mod_id limit 1 for update of j;
  if not found then return jsonb_build_object('status','idle'); end if;
  if p_mod is not null and q.last_manual_at>now()-interval '24 hours' then
    return jsonb_build_object('status','cooldown','manualAvailable',q.last_manual_at+interval '24 hours');
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('platform',s.platform,'url',s.url) order by s.platform,s.url),'[]')
    into sources from private.external_rating_sources(q.mod_id) s;
  if exists(select 1 from jsonb_array_elements(sources) s where s->>'platform'='gta5mods') and exists(
    select 1 from private.external_rating_provider_state where platform='gta5mods' and paused_until>now()
  ) then return jsonb_build_object('status','paused'); end if;
  if p_mod is null and q.first_published_at+interval '720 hours'<=clock_timestamp() then
    return jsonb_build_object('status','idle');
  end if;
  claimed:=gen_random_uuid();
  update private.external_rating_sync set token=claimed,lease_until=now()+interval '90 seconds',last_attempt_at=now(),
    manual=p_mod is not null,last_manual_at=case when p_mod is not null then now() else last_manual_at end
  where mod_id=q.mod_id;
  return jsonb_build_object('status','claimed','modId',q.mod_id,'token',claimed,'sources',sources,'automaticUntil',case when p_mod is null then q.first_published_at+interval '720 hours' end);
end $$;

create or replace function private.finish_external_rating_sync(p_mod uuid,p_token uuid,p_results jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q private.external_rating_sync; item jsonb; src record; previous private.external_rating_snapshots;
  result text; overall text; details jsonb:='[]'; any_failure boolean:=false;
  any_rate_limit boolean:=false; any_success boolean:=false; any_change boolean:=false;
  any_unavailable boolean:=false; value numeric; votes integer; due timestamptz; cutoff timestamptz; provider_delay integer:=0; provider_blocked boolean:=false; provider_contact boolean:=false;
begin
  select * into q from private.external_rating_sync where mod_id=p_mod and token=p_token and lease_until>now() for update;
  if not found then return jsonb_build_object('status','expired'); end if;
  cutoff:=q.first_published_at+interval '720 hours';
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
    if src.platform='gta5mods' and src.platform_id is not null and result in ('success','unavailable','failed','rate_limited','invalid','denied') then
      provider_contact:=true;
      if result in ('rate_limited','denied') then
        provider_blocked:=true;
        provider_delay:=greatest(provider_delay,coalesce((item->>'retryAfter')::integer,0));
      end if;
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
        when result in ('rate_limited','invalid','denied') then 'failed' else result end,
        case when result in ('success','unchanged') then value end,
        case when result in ('success','unchanged') then votes end);
      update private.external_rating_snapshots set last_checked_at=now()
        where mod_id=p_mod and platform_id=src.platform_id and source_url=src.url;
    else result:='unsupported';
    end if;
    any_failure:=any_failure or result in ('failed','invalid','rate_limited','denied');
    any_rate_limit:=any_rate_limit or result='rate_limited';
    any_unavailable:=any_unavailable or result='unavailable';
    details:=details||jsonb_build_array(jsonb_build_object('platform',src.platform,'status',result));
  end loop;
  overall:=case when any_rate_limit then 'rate_limited' when provider_blocked then 'denied' when any_failure and any_success then 'partial'
    when any_failure then 'failed' when any_change then 'updated' when any_success then 'unchanged'
    when any_unavailable then 'unavailable' else 'unsupported' end;
  if provider_blocked then
    update private.external_rating_provider_state set
      strikes=least(strikes+1,8),
      paused_until=greatest(now()+make_interval(secs=>provider_delay),
        now()+case when strikes>=2 then interval '24 hours' else interval '1 hour' end)
    where platform='gta5mods';
  elsif provider_contact and not any_failure then
    update private.external_rating_provider_state set strikes=0,paused_until=null where platform='gta5mods';
  end if;
  due:=now()+case when now()<q.first_published_at+interval '168 hours' then interval '24 hours' else interval '168 hours' end;
  if any_failure and q.failures<3 then due:=least(due,now()+interval '1 hour'*power(2,q.failures)); end if;
  if overall='unsupported' or due>=cutoff then due:=null; end if;
  update private.external_rating_sync set token=null,lease_until=null,last_checked_at=now(),
    last_status=overall,last_results=details,next_check_at=case when q.manual then q.next_check_at else due end,
    failures=case when q.manual then q.failures when any_failure then case when q.failures>=3 then 0 else q.failures+1 end else 0 end
  where mod_id=p_mod;
  return jsonb_build_object('status',overall,'results',details);
end $$;


-- The same dedicated token lives only in Vault and the HTTPS request.
create function private.authorize_external_rating_cron(p_token text) returns boolean
language sql stable security definer set search_path='' as $$
  select length(p_token)=64 and exists(select 1 from vault.decrypted_secrets
    where name='modvault_external_rating_cron' and decrypted_secret=p_token)
$$;
create function public.authorize_external_rating_cron(p_token text) returns boolean
language sql stable security invoker set search_path='' as $$
  select private.authorize_external_rating_cron(p_token)
$$;
revoke all on function private.authorize_external_rating_cron(text),public.authorize_external_rating_cron(text) from public,anon,authenticated;
grant execute on function private.authorize_external_rating_cron(text),public.authorize_external_rating_cron(text) to service_role;
