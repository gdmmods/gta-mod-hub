-- Existing rows retain their original star semantics.
alter table private.external_rating_snapshots
  add column feedback_type text not null default 'stars',
  add column positive_count integer,
  add column negative_count integer,
  add constraint external_rating_native_feedback check (
    (feedback_type='stars' and positive_count is null and negative_count is null)
    or (feedback_type='votes' and original_value is null and original_scale is null
      and normalized_value is null and rating_count is null
      and ((last_success_at is null and positive_count is null and negative_count is null)
        or (last_success_at is not null and positive_count is not null and negative_count is not null
          and positive_count>=0 and negative_count>=0)))
  );

-- Keep existing unnamed checks intact on legacy rows. Replace only the
-- previous star payload completeness check with a type-aware equivalent.
do $$
declare constraint_name text;
begin
  select conname into strict constraint_name from pg_constraint
  where conrelid='private.external_rating_snapshots'::regclass and contype='c'
    and pg_get_constraintdef(oid) like '%last_success_at IS NULL%original_value IS NULL%';
  execute format('alter table private.external_rating_snapshots drop constraint %I',constraint_name);
end $$;
alter table private.external_rating_snapshots add constraint external_rating_star_payload check (
  feedback_type<>'stars' or
  (last_success_at is null and original_value is null and original_scale is null and normalized_value is null and rating_count is null)
  or (last_success_at is not null and original_value is not null and original_scale is not null and original_value between 0 and original_scale)
);
insert into private.external_rating_provider_state(platform) values('gtainside') on conflict do nothing;


create or replace function private.read_mod_rating_channels(p_mod_ids uuid[],p_include_external boolean) returns jsonb
language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_object_agg(m.id, jsonb_build_object(
    'internal', coalesce(v.channels,'{}'::jsonb),
    'external', coalesce(e.sources,'[]'::jsonb),
    'externalPrimary', case when p_include_external then primary_source.source end
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
    select jsonb_build_object('platform',p.slug,'url',m.source_url) source
    from public.platforms p where m.source_url is not null and p.slug=case
      when m.origin not in ('gta5mods','gtainside') or m.origin is null then
        case when m.source_url ~* '^https://(www\.)?gta5-mods\.com/' then 'gta5mods'
          when m.source_url ~* '^https://(www\.)?gtainside\.com/' then 'gtainside' end
      when m.origin='gta5mods' and m.source_url ~* '^https://(www\.)?gta5-mods\.com/' then 'gta5mods'
      when m.origin='gtainside' and m.source_url ~* '^https://(www\.)?gtainside\.com/' then 'gtainside'
      end
  ) primary_source on true
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'platform',p.slug,'url',r.source_url,'value',r.original_value,'scale',r.original_scale,
      'count',r.rating_count,'normalized',r.normalized_value,'updatedAt',r.last_success_at,
      'type',r.feedback_type,'positive',r.positive_count,'negative',r.negative_count
    ) order by p.slug,r.source_url) sources
    from private.external_rating_snapshots r join public.platforms p on p.id=r.platform_id
    where p_include_external and r.mod_id=m.id and r.last_success_at is not null
      and ((p.slug in ('gta5mods','gtainside') and primary_source.source->>'platform'=p.slug and m.source_url=r.source_url) or exists(
        select 1 from public.mod_sources s where s.mod_id=m.id and s.platform_id=r.platform_id and s.canonical_url=r.source_url
      ))
  ) e on true
  where m.id in (select unnest(p_mod_ids[1:100])) and m.status='published'
    and m.visibility in ('public','early_access')
$$;

create or replace function private.read_mod_rating(p_mod_id uuid,p_page integer default 1) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare account uuid:=auth.uid(); m public.mods; rating private.mod_ratings; moderator boolean; total private.mod_rating_totals;
begin
  if p_page is null or p_page<1 or p_page>100000 then raise exception 'Invalid rating page.' using errcode='22023'; end if;
  select * into m from public.mods where id=p_mod_id and status='published';
  if not found then raise exception 'This mod is unavailable.' using errcode='22023'; end if;
  select * into total from private.mod_rating_totals where mod_id=p_mod_id;
  select * into rating from private.mod_ratings where mod_id=p_mod_id and account_id=account;
  moderator:=exists(select 1 from private.discussion_moderators where profile_id=account);
  return jsonb_build_object('average',case when total.rating_count>0 then round(total.rating_sum::numeric/total.rating_count,1) else null end,
    'count',coalesce(total.rating_count,0),'ownRating',case when rating.id is not null then jsonb_build_object('value',rating.value,'isValid',rating.is_valid,'channel',rating.channel) end,
    'canRate',account is not null and private.discussion_owner(m.creator_id) is distinct from account and not exists(select 1 from public.mod_creators mc where mc.mod_id=m.id and mc.role='owner' and private.discussion_owner(mc.creator_id)=account),
    'canModerate',moderator,'moderation',case when moderator then coalesce((select jsonb_agg(x) from
      (select id,value,is_valid,moderation_reason,created_at from private.mod_ratings where mod_id=p_mod_id order by created_at,id limit 20 offset (p_page-1)*20) x),'[]'::jsonb) else '[]'::jsonb end,
    'hasMore',moderator and exists(select 1 from private.mod_ratings where mod_id=p_mod_id order by created_at,id offset p_page*20 limit 1));
end $$;

create or replace function private.read_external_rating_sync(p_mod uuid) returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'lastChecked',q.last_attempt_at,'automaticEnded',q.first_published_at+interval '720 hours'<=now(),
    'pausedUntil',(select paused_until from private.external_rating_provider_state where paused_until>now() and platform in (select s.platform from private.external_rating_sources(q.mod_id) s) and not exists(select 1 from private.external_rating_sources(q.mod_id) x join private.external_rating_provider_state a on a.platform=x.platform where a.paused_until is null or a.paused_until<=now()) limit 1),
    'nextCheck',case when q.next_check_at < q.first_published_at+interval '720 hours' and q.first_published_at+interval '720 hours'>now() and exists(
      select 1 from private.external_rating_sources(q.mod_id) s where s.platform in ('gta5mods','gtainside')
    ) then q.next_check_at end,'manualAvailable',q.last_manual_at+interval '24 hours',
    'status',case when q.lease_until>now() then 'running' else q.last_status end,'results',q.last_results,
    'sources',(select coalesce(jsonb_agg(s.platform order by s.platform),'[]'::jsonb)
      from (select distinct platform from private.external_rating_sources(q.mod_id)) s))
  from private.external_rating_sync q where q.mod_id=p_mod and private.can_refresh_external_rating(p_mod,auth.uid())
$$;

create function private.claim_external_feedback_sync(p_mod uuid,p_account uuid,p_native boolean) returns jsonb
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
      else j.next_check_at<=now() and j.first_published_at+interval '720 hours'>clock_timestamp() and exists(select 1 from private.external_rating_sources(j.mod_id) s join private.external_rating_provider_state a on a.platform=s.platform where (p_native or s.platform='gta5mods') and (a.paused_until is null or a.paused_until<=now()))
    end)
  order by j.next_check_at,j.mod_id limit 1 for update of j;
  if not found then return jsonb_build_object('status','idle'); end if;
  if p_mod is not null and q.last_manual_at>now()-interval '24 hours' then
    return jsonb_build_object('status','cooldown','manualAvailable',q.last_manual_at+interval '24 hours');
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('platform',s.platform,'url',s.url) order by s.platform,s.url),'[]')
    into sources from private.external_rating_sources(q.mod_id) s;
  if exists(select 1 from jsonb_array_elements(sources) s join private.external_rating_provider_state a on a.platform=s->>'platform' where p_native or a.platform='gta5mods')
    and not exists(select 1 from jsonb_array_elements(sources) s join private.external_rating_provider_state a on a.platform=s->>'platform'
      where (p_native or a.platform='gta5mods') and (a.paused_until is null or a.paused_until<=now()))
  then return jsonb_build_object('status','paused'); end if;
  if p_native then
    select coalesce(jsonb_agg(s||jsonb_build_object('paused',coalesce(a.paused_until>now(),false))),'[]')
    into sources from jsonb_array_elements(sources) s left join private.external_rating_provider_state a on a.platform=s->>'platform';
  end if;
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
  any_unavailable boolean:=false; value numeric; votes integer; due timestamptz; cutoff timestamptz; provider_delay integer; provider_blocked boolean:=false; positive integer; negative integer;
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
    if src.platform in ('gta5mods','gtainside') and src.platform_id is not null and result in ('success','unavailable','failed','rate_limited','invalid','denied') then
      if result in ('rate_limited','denied') then
        provider_blocked:=true;
        provider_delay:=greatest(0,coalesce((item->>'retryAfter')::integer,0));
        update private.external_rating_provider_state set strikes=least(strikes+1,8),
          paused_until=greatest(paused_until,now()+make_interval(secs=>provider_delay),
            now()+case when strikes>=2 then interval '24 hours' else interval '1 hour' end)
        where platform=src.platform;
      elsif result in ('success','unavailable') then
        update private.external_rating_provider_state set strikes=0,paused_until=null
          where platform=src.platform and (paused_until is null or paused_until<=now());
      end if;
      if result='success' and src.platform='gtainside' then
        positive:=(item->>'positive')::integer;
        negative:=(item->>'negative')::integer;
        if positive is null or negative is null or positive<0 or negative<0 then
          result:='invalid';
        else
          any_success:=true;
          if exists(select 1 from private.external_rating_snapshots where mod_id=p_mod and platform_id=src.platform_id
            and source_url=src.url and positive_count=positive and negative_count=negative) then result:='unchanged';
          else any_change:=true; end if;
        end if;
      elsif result='success' then
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
      if src.platform='gtainside' then
        insert into private.external_rating_snapshots(mod_id,platform_id,source_url,feedback_type,positive_count,negative_count,last_success_at,last_checked_at,retrieval_status)
        values(p_mod,src.platform_id,src.url,'votes',
          case when result in ('success','unchanged') then positive end,
          case when result in ('success','unchanged') then negative end,
          case when result in ('success','unchanged') then now() end,now(),
          case when result in ('success','unchanged') then 'success' when result='unavailable' then 'unavailable' else 'failed' end)
        on conflict(mod_id,platform_id,source_url) do update set
          positive_count=coalesce(excluded.positive_count,external_rating_snapshots.positive_count),
          negative_count=coalesce(excluded.negative_count,external_rating_snapshots.negative_count),
          last_success_at=coalesce(excluded.last_success_at,external_rating_snapshots.last_success_at),
          last_checked_at=excluded.last_checked_at,retrieval_status=excluded.retrieval_status;
      else
      perform public.record_gta5mods_rating(p_mod,src.url,case when result='unchanged' then 'success'
        when result in ('rate_limited','invalid','denied') then 'failed' else result end,
        case when result in ('success','unchanged') then value end,
        case when result in ('success','unchanged') then votes end);
      update private.external_rating_snapshots set last_checked_at=now()
        where mod_id=p_mod and platform_id=src.platform_id and source_url=src.url;
      end if;
    elsif result is distinct from 'paused' then result:='unsupported';
    end if;
    any_failure:=any_failure or result in ('failed','invalid','rate_limited','denied');
    any_rate_limit:=any_rate_limit or result='rate_limited';
    any_unavailable:=any_unavailable or result='unavailable';
    details:=details||jsonb_build_array(jsonb_build_object('platform',src.platform,'status',result));
  end loop;
  overall:=case when any_rate_limit then 'rate_limited' when provider_blocked then 'denied' when any_failure and any_success then 'partial'
    when any_failure then 'failed' when any_change then 'updated' when any_success then 'unchanged'
    when any_unavailable then 'unavailable' else 'unsupported' end;
  due:=now()+case when now()<q.first_published_at+interval '168 hours' then interval '24 hours' else interval '168 hours' end;
  if any_failure and q.failures<3 then due:=least(due,now()+interval '1 hour'*power(2,q.failures)); end if;
  if overall='unsupported' and not exists(select 1 from jsonb_array_elements(details) x where x->>'status'='paused') or due>=cutoff then due:=null; end if;
  update private.external_rating_sync set token=null,lease_until=null,last_checked_at=now(),
    last_status=overall,last_results=details,next_check_at=case when q.manual then q.next_check_at else due end,
    failures=case when q.manual then q.failures when any_failure then case when q.failures>=3 then 0 else q.failures+1 end else 0 end
  where mod_id=p_mod;
  return jsonb_build_object('status',overall,'results',details);
end $$;


create or replace function public.claim_external_rating_sync(p_mod uuid default null,p_account uuid default null)
returns jsonb language sql security invoker set search_path='' as $$
  select private.claim_external_feedback_sync(p_mod,p_account,false)
$$;
create function public.claim_external_feedback_sync(p_mod uuid,p_account uuid)
returns jsonb language sql security invoker set search_path='' as $$
  select private.claim_external_feedback_sync(p_mod,p_account,true)
$$;
revoke all on function private.claim_external_feedback_sync(uuid,uuid,boolean),public.claim_external_feedback_sync(uuid,uuid)
  from public,anon,authenticated;
grant execute on function private.claim_external_feedback_sync(uuid,uuid,boolean),public.claim_external_feedback_sync(uuid,uuid)
  to service_role;
