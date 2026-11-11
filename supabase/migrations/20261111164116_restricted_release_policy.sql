-- Release access is separate from publication workflow. Existing rows and values are retained.
create or replace function private.follow_public_mod(m public.mods) returns boolean
language sql stable set search_path='' as $$
  select coalesce(m.status='published' and m.visibility in ('public','early_access')
    and m.release_state in ('public','early_access'),false)
$$;

create function private.can_edit_mod_creator(p_creator uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists(
    select 1 from public.creators c where c.id=p_creator
      and ((c.owner_type='user' and c.owner_id=auth.uid())
        or (c.owner_type='team' and private.announcement_owner(c.id,auth.uid())))
  )
$$;

create function public.can_edit_mod(p_mod uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.mods m where m.id=p_mod and private.can_edit_mod_creator(m.creator_id))
$$;

revoke all on function private.can_edit_mod_creator(uuid),public.can_edit_mod(uuid) from public,anon,authenticated;
grant execute on function private.can_edit_mod_creator(uuid),public.can_edit_mod(uuid) to authenticated;
grant execute on function private.follow_public_mod(public.mods) to anon,authenticated,service_role;

-- Restrictive policies intersect with all existing permissive read policies.
create policy restricted_release_public_read on public.mods as restrictive for select to anon
using (private.follow_public_mod(mods));
create policy restricted_release_authenticated_read on public.mods as restrictive for select to authenticated
using (private.follow_public_mod(mods) or private.can_edit_mod_creator(creator_id));

-- A verified team leader can edit their team's release. Ordinary members retain
-- their existing upload permissions without gaining permission to edit team records.
create policy verified_team_leader_mod_update on public.mods for update to authenticated
using (private.can_edit_mod_creator(creator_id))
with check (private.can_edit_mod_creator(creator_id));

create function private.guard_mod_release_update() returns trigger
language plpgsql set search_path='' as $$
begin
  if current_user in ('anon','authenticated') then
    if new.creator_id is distinct from old.creator_id then
      raise exception 'A release edit cannot change mod ownership.' using errcode='42501';
    end if;
    if new.status is distinct from old.status and coalesce(old.status,'') not in ('draft','published') then
      raise exception 'The current publication status cannot be overridden.' using errcode='42501';
    end if;
  end if;
  return new;
end $$;
revoke all on function private.guard_mod_release_update() from public,anon,authenticated;
create trigger guard_mod_release_update before update on public.mods
for each row execute function private.guard_mod_release_update();

-- Related REST resources must satisfy the same parent visibility rule.
do $$
declare related text;
begin
  foreach related in array array['mod_creators','mod_sources','mod_files','mod_games','mod_click_totals','favorites','likes','mod_entitlements'] loop
    if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=related and c.relkind in ('r','p')) then
      execute format('alter table public.%I enable row level security',related);
      execute format('create policy restricted_release_parent_read on public.%I as restrictive for select to anon,authenticated using (exists(select 1 from public.mods m where m.id=%I.mod_id))',related,related);
    end if;
  end loop;
end $$;
-- File metadata is created only by the checked, service-role upload route.
revoke insert,update,delete on public.mod_files from anon,authenticated;

create function private.is_public_mod_event_target(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.mods m where m.id=p_id and private.follow_public_mod(m))
$$;
revoke all on function private.is_public_mod_event_target(uuid) from public,anon,authenticated;
grant execute on function private.is_public_mod_event_target(uuid) to anon,authenticated;

-- Hide historical mod activity while restricted without deleting events or receipts.
create policy restricted_release_activity_read on public.activity_events as restrictive for select to anon,authenticated
using (
  (target_type::text is distinct from 'mod' or private.is_public_mod_event_target(target_id))
  and (parent_type::text is distinct from 'mod' or private.is_public_mod_event_target(parent_id))
  and case when metadata ? 'modId' then
    case when pg_input_is_valid(metadata->>'modId','uuid')
      then private.is_public_mod_event_target((metadata->>'modId')::uuid) else false end
    else true end
);

create or replace view private.reference_entities with (security_invoker=true) as
  select 'user'::text kind,p.id,coalesce(nullif(p.display_name,''),p.username) label,
    p.avatar_url avatar,coalesce(h.handle,p.username) context,'/profile/'||p.username href
  from public.profiles p left join private.identity_handles h on h.user_id=p.id and h.retired_at is null
  where p.username ~ '^[A-Za-z0-9_.-]+$'
  union all
  select case when c.owner_type='team' then 'team' else 'creator' end,c.id,c.name,c.avatar,
    h.handle,'/creator/'||c.id
  from public.creators c left join private.identity_handles h on h.creator_id=c.id and h.retired_at is null
  where public.is_creator_operational(c.id) and nullif(btrim(c.name),'') is not null
  union all
  select 'mod',m.id,m.title,m.image,c.name,'/mods/'||m.id
  from public.mods m left join public.creators c on c.id=m.creator_id
  where private.follow_public_mod(m) and nullif(btrim(m.title),'') is not null;

CREATE OR REPLACE FUNCTION private.can_refresh_external_rating(p_mod uuid, p_account uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select exists(select 1 from public.mods m join public.creators c on c.id=m.creator_id
    where m.id=p_mod and private.follow_public_mod(m)
      and c.owner_id=p_account and c.owner_type is distinct from 'team')
$function$;

CREATE OR REPLACE FUNCTION private.discussion_event_details(p_ids uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null then raise exception 'Sign in to read notifications.' using errcode='42501'; end if;
  if coalesce(cardinality(p_ids),0)>100 then raise exception 'Too many notification identifiers.' using errcode='22023'; end if;
  return coalesce((select jsonb_object_agg(e.id,jsonb_build_object(
    'publishingName',coalesce(e.metadata->>'publishingName',case when e.actor_type='creator' then cr.name else coalesce(pr.display_name,pr.username) end,
      case when e.actor_type='creator' then 'A former creator' else 'A former user' end),
    'modTitle',coalesce(e.metadata->>'modTitle',m.title,'an unavailable mod'),
    'rootCommentId',coalesce(c.parent_comment_id,c.id)::text,
    'recipientReason',coalesce(e.metadata->>'recipientReason',case when parent.author_account_id=auth.uid() then 'reply' else 'mod_owner' end),
    'referenceLabels',case when c.status='published' and (parent.id is null or parent.status<>'hidden')
      and private.follow_public_mod(m) then
      (select jsonb_agg((case when entity.kind='mod' then '#' else '@' end)||entity.label order by entity.kind,entity.id)
        from jsonb_to_recordset(coalesce(e.metadata->'referenceKeys','[]')) k(kind text,id uuid)
        join private.reference_entities entity on (entity.kind,entity.id)=(k.kind,k.id)) end,
    'contentAvailable',coalesce(c.status='published' and (parent.id is null or parent.status<>'hidden') and private.follow_public_mod(m),false)
  )) from public.activity_events e
    join private.discussion_comments c on c.id::text=e.metadata->>'discussionCommentId'
    left join private.discussion_comments parent on parent.id=c.parent_comment_id
    left join public.mods m on m.id=c.target_id
    left join public.creators cr on e.actor_type='creator' and cr.id=e.actor_id
    left join public.profiles pr on e.actor_type='user' and pr.id=e.actor_id
    where private.follow_public_mod(m) and e.id=any(p_ids) and e.event_type in ('comment_created','comment_reply_created')
      and exists(select 1 from public.notifications n where n.activity_event_id=e.id and n.profile_id=auth.uid())), '{}'::jsonb);
end $function$;

CREATE OR REPLACE FUNCTION private.read_discussions(p_mode text, p_identity_type text DEFAULT NULL::text, p_identity_id uuid DEFAULT NULL::uuid, p_target_id uuid DEFAULT NULL::uuid, p_direction text DEFAULT 'written'::text, p_category text DEFAULT NULL::text, p_page integer DEFAULT 1, p_limit integer DEFAULT 20, p_comment_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  account uuid := auth.uid();
  root_id uuid;
  result jsonb;
begin
  if p_mode is null or p_mode not in ('target','identity','account','thread','replies','moderation')
    or p_page is null or p_page < 1 or p_page > 100000
    or p_limit is null or p_limit not between 1 and 20
    or p_direction is null or p_direction not in ('written','received')
    or (p_category is not null and p_category not in ('mod','asset','knowledge','showcase')) then
    raise exception 'Invalid discussion filters.' using errcode='22023';
  end if;
  if p_mode in ('account','moderation') and account is null then raise exception 'Sign in to view your discussions.' using errcode='42501'; end if;
  if p_mode='identity' and (p_identity_type is null or p_identity_type not in ('user','creator') or p_identity_id is null) then
    raise exception 'Choose a public identity.' using errcode='22023';
  end if;
  if p_mode='account' and p_identity_type is not null then
    if p_identity_type='user' then
      if p_identity_id is distinct from account then raise exception 'Identity unavailable.' using errcode='42501'; end if;
    elsif p_identity_type='creator' then
      if not exists(select 1 from public.creator_members where profile_id=account and creator_id=p_identity_id and status='approved') then
        raise exception 'Identity unavailable.' using errcode='42501';
      end if;
    else raise exception 'Invalid identity.' using errcode='22023'; end if;
  end if;
  if p_mode in ('thread','replies') then
    select coalesce(c.parent_comment_id,c.id) into root_id
    from private.discussion_comments c join public.mods m on m.id=c.target_id
    where c.id=p_comment_id and c.target_id=p_target_id and private.follow_public_mod(m);
  end if;
  with visible as (
    select c.*,m.title target_title,
      (c.author_account_id=account and (c.author_creator_id is null or not exists(
        select 1 from public.creators ac where ac.id=c.author_creator_id and ac.owner_type='team'
          and not exists(select 1 from public.teams at where at.id=ac.team_id and at.creator_id=ac.id and at.status='active')))) can_edit,
      (private.discussion_owner(m.creator_id)=account or exists(select 1 from private.discussion_moderators where profile_id=account)) can_moderate,
      case when c.author_creator_id is null then coalesce(pr.display_name,pr.username,'User') else cr.name end author_name,
      case when c.author_creator_id is null then '/profile/' || pr.username else '/creator/' || cr.id::text end author_href
    from private.discussion_comments c
    join public.mods m on m.id=c.target_id and c.target_type='mod' and private.follow_public_mod(m)
    join public.profiles pr on pr.id=c.author_account_id
    left join public.creators cr on cr.id=c.author_creator_id
    left join private.discussion_comments parent on parent.id=c.parent_comment_id
    where (p_category is null or c.target_type=p_category)
      and (
        (c.status='published' and (parent.id is null or parent.status <> 'hidden'))
        or (c.status='deleted' and c.parent_comment_id is null and p_mode in ('target','thread')
          and exists(select 1 from private.discussion_comments r where r.parent_comment_id=c.id and r.status='published'))
        or (c.status='hidden' and p_mode='moderation' and (private.discussion_owner(m.creator_id)=account
          or exists(select 1 from private.discussion_moderators where profile_id=account)))
      )
      and case p_mode
        when 'target' then c.target_id=p_target_id and c.parent_comment_id is null
        when 'thread' then c.target_id=p_target_id and (c.id=root_id or c.parent_comment_id=root_id)
        when 'replies' then c.target_id=p_target_id and c.parent_comment_id=root_id
        when 'moderation' then c.target_id=p_target_id and c.status='hidden'
        when 'identity' then case p_identity_type when 'creator' then c.author_creator_id=p_identity_id
          else c.author_account_id=p_identity_id and c.author_creator_id is null end
        when 'account' then case p_direction when 'written' then c.author_account_id=account
          and (p_identity_type is null or (p_identity_type='creator' and c.author_creator_id=p_identity_id)
            or (p_identity_type='user' and c.author_creator_id is null))
          else parent.author_account_id=account and c.author_account_id<>account
            and (p_identity_type is null or (p_identity_type='creator' and parent.author_creator_id=p_identity_id)
              or (p_identity_type='user' and parent.author_creator_id is null)) end
      end
  ), page as (
    select * from visible
    order by case when p_mode='thread' then (parent_comment_id is null)::int end desc,
      case when p_mode='thread' and id=p_comment_id then 1 else 0 end desc,case when p_mode in ('thread','replies') then created_at end asc,case when p_mode not in ('thread','replies') then created_at end desc,case when p_mode in ('thread','replies') then id end asc,case when p_mode not in ('thread','replies') then id end desc
    limit p_limit+1 offset (p_page-1)*p_limit
  ), rows as (
    select * from page
    order by case when p_mode='thread' then (parent_comment_id is null)::int end desc,case when p_mode='thread' and id=p_comment_id then 1 else 0 end desc,case when p_mode in ('thread','replies') then created_at end asc,case when p_mode not in ('thread','replies') then created_at end desc,case when p_mode in ('thread','replies') then id end asc,case when p_mode not in ('thread','replies') then id end desc
    limit p_limit
  )
  select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object(
    'id',id,'target_type',target_type,'target_id',target_id,'target_title',target_title,
    'parent_comment_id',parent_comment_id,'body',body,'status',status,'created_at',created_at,'updated_at',updated_at,
    'author_name',author_name,'author_href',author_href,'author_creator_id',author_creator_id,
    'can_edit',coalesce(can_edit,false),'can_moderate',coalesce(can_moderate,false),
    'rating_at_submission',(select s.value from private.discussion_rating_submissions s join private.mod_ratings mr on mr.id=s.rating_id where s.comment_id=rows.id and mr.is_valid),
    'references',case when status='published' then private.discussion_reference_display(rows.id) else '[]'::jsonb end,
    'reply_count',(select count(*) from private.discussion_comments r where r.parent_comment_id=rows.id and r.status='published')
  ) order by case when p_mode='thread' then (parent_comment_id is null)::int end desc,case when p_mode='thread' and id=p_comment_id then 1 else 0 end desc,case when p_mode in ('thread','replies') then created_at end asc,case when p_mode not in ('thread','replies') then created_at end desc,case when p_mode in ('thread','replies') then id end asc,case when p_mode not in ('thread','replies') then id end desc) from rows),'[]'::jsonb),
  'cooldownSeconds',coalesce((select greatest(0,ceil(extract(epoch from max(c.created_at)+interval '30 seconds'-now())))::int
    from private.discussion_comments c where c.author_account_id=account and c.target_type='mod' and c.target_id=p_target_id
      and c.created_at>now()-interval '30 seconds'),0),
  'hasMore',(select count(*) > p_limit from page),'rootId',root_id,
  'canModerate',coalesce((select private.discussion_owner(m.creator_id)=account
    or exists(select 1 from private.discussion_moderators where profile_id=account)
    from public.mods m where m.id=p_target_id and private.follow_public_mod(m)),false)) into result;
  return result;
end $function$;

CREATE OR REPLACE FUNCTION private.read_mod_rating(p_mod_id uuid, p_page integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare account uuid:=auth.uid(); m public.mods; rating private.mod_ratings; moderator boolean; total private.mod_rating_totals;
begin
  if p_page is null or p_page<1 or p_page>100000 then raise exception 'Invalid rating page.' using errcode='22023'; end if;
  select * into m from public.mods candidate where candidate.id=p_mod_id and private.follow_public_mod(candidate);
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
end $function$;

CREATE OR REPLACE FUNCTION private.read_mod_rating_channels(p_mod_ids uuid[], p_include_external boolean)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  where m.id in (select unnest(p_mod_ids[1:100])) and private.follow_public_mod(m)
$function$;

CREATE OR REPLACE FUNCTION private.set_mod_rating(p_mod_id uuid, p_creator_id uuid, p_value integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare account uuid:=auth.uid(); selected uuid; m public.mods; rating private.mod_ratings;
begin
  if account is null then raise exception 'Sign in to rate this mod.' using errcode='42501'; end if;
  if p_value is null or p_value not between 1 and 5 then raise exception 'Choose between one and five stars.' using errcode='22023'; end if;
  -- Same per-account lock/rate ledger as discussion changes, across all identities.
  perform pg_advisory_xact_lock(hashtextextended(account::text,821));
  select default_creator_id into selected from public.profiles where id=account for share;
  if not found or selected is distinct from p_creator_id then raise exception 'Your selected identity changed. Refresh and try again.' using errcode='42501'; end if;
  if p_creator_id is not null then
    perform 1 from public.creator_members where creator_id=p_creator_id and profile_id=account and status='approved' for share;
    if not found then raise exception 'You no longer control this publishing identity.' using errcode='42501'; end if;
    perform private.require_operational_creator(p_creator_id);
  end if;
  select * into m from public.mods candidate where candidate.id=p_mod_id and private.follow_public_mod(candidate) for share;
  if not found then raise exception 'This mod is unavailable.' using errcode='22023'; end if;
  if (private.discussion_owner(m.creator_id)=account or exists(select 1 from public.mod_creators mc where mc.mod_id=m.id and mc.role='owner' and private.discussion_owner(mc.creator_id)=account)) then raise exception 'You cannot rate your own mod.' using errcode='42501'; end if;
  if (select count(*) from private.discussion_mutations where account_id=account and occurred_at>now()-interval '1 minute')>=30 then
    raise exception 'Too many changes. Please wait a minute.' using errcode='P0001';
  end if;
  select * into rating from private.mod_ratings where account_id=account and mod_id=p_mod_id for update;
  if found and not rating.is_valid then raise exception 'Your rating was invalidated. A moderator must review it before it can be updated.' using errcode='42501'; end if;
  insert into private.mod_ratings(account_id,mod_id,value) values(account,p_mod_id,p_value)
    on conflict(account_id,mod_id) do update set value=excluded.value,updated_at=now()
    where private.mod_ratings.value is distinct from excluded.value returning * into rating;
  if not found then select * into rating from private.mod_ratings where account_id=account and mod_id=p_mod_id; end if;
  insert into private.discussion_mutations(account_id,is_post) values(account,false);
  return rating.id;
end $function$;

CREATE OR REPLACE FUNCTION private.write_discussion(p_action text, p_comment_id uuid DEFAULT NULL::uuid, p_target_id uuid DEFAULT NULL::uuid, p_creator_id uuid DEFAULT NULL::uuid, p_parent_id uuid DEFAULT NULL::uuid, p_body text DEFAULT NULL::text, p_target_type text DEFAULT 'mod'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  account uuid := auth.uid();
  item private.discussion_comments;
  parent private.discussion_comments;
  mod_row public.mods;
  recipient record;
  event_id uuid;
  owner_account uuid;
  moderator boolean;
  selected_creator uuid;
  posted_at timestamptz;
  wait_seconds integer;
begin
  if account is null then raise exception 'Sign in to join the discussion.' using errcode='42501'; end if;
  if p_action is null or p_action not in ('create','edit','delete','hide','restore') then
    raise exception 'Unknown discussion action.' using errcode='22023';
  end if;
  -- Serializes concurrent writes by this account, across identities and targets.
  perform pg_advisory_xact_lock(hashtextextended(account::text, 821));
  if (select count(*) from private.discussion_mutations where account_id=account and occurred_at > now()-interval '1 minute') >= 30 then
    raise exception 'Too many changes. Please wait a minute.' using errcode='P0001';
  end if;
  if p_action in ('create','edit') and (p_body is null or char_length(btrim(p_body)) not between 1 and 4000) then
    raise exception 'Write between 1 and 4,000 characters.' using errcode='22023';
  end if;
  if p_action='create' then
    if p_target_type is distinct from 'mod' then raise exception 'This discussion category is not available yet.' using errcode='22023'; end if;
    select * into mod_row from public.mods m where m.id=p_target_id and private.follow_public_mod(m);
    if not found then raise exception 'This mod is unavailable.' using errcode='22023'; end if;
    select default_creator_id into selected_creator from public.profiles where id=account for share;
    if not found then raise exception 'Your account profile is unavailable.' using errcode='42501'; end if;
    if selected_creator is distinct from p_creator_id then
      raise exception 'Your selected identity changed. Refresh and try again.' using errcode='42501';
    end if;
    if p_creator_id is not null then
      -- Lock lifecycle state so a concurrent archive cannot race publishing.
      perform 1 from public.teams t join public.creators c on c.team_id=t.id and t.creator_id=c.id
        where c.id=p_creator_id and c.owner_type='team' and t.status='active' for share of t;
      if exists(select 1 from public.creators where id=p_creator_id and owner_type='team') and not found then
        raise exception 'Archived team identities cannot publish.' using errcode='42501';
      end if;
      perform 1 from public.creator_members where profile_id=account and creator_id=p_creator_id and status='approved' for share;
      if not found then raise exception 'You no longer have access to this creator identity.' using errcode='42501'; end if;
    end if;
    if (select count(*) from private.discussion_mutations where account_id=account and is_post and occurred_at > now()-interval '1 minute') >= 5
      or (select count(*) from private.discussion_mutations where account_id=account and is_post and occurred_at > now()-interval '1 hour') >= 50 then
      raise exception 'Posting limit reached. Please wait before posting again.' using errcode='P0001';
    end if;
    if p_parent_id is not null then
      select * into parent from private.discussion_comments where id=p_parent_id for share;
      if not found or parent.status <> 'published' or parent.parent_comment_id is not null
        or parent.target_type <> p_target_type or parent.target_id <> p_target_id then
        raise exception 'Reply to a visible top-level comment on this mod.' using errcode='22023';
      end if;
    end if;
    posted_at:=clock_timestamp();
    select greatest(0,ceil(extract(epoch from (max(created_at)+interval '30 seconds'-posted_at))))::integer
      into wait_seconds from private.discussion_comments
    where author_account_id=account and target_type=p_target_type and target_id=p_target_id
      and created_at>posted_at-interval '30 seconds';
    if wait_seconds>0 then
      raise exception 'Please wait before posting again.' using errcode='P0001',detail=wait_seconds::text;
    end if;
    insert into private.discussion_comments(author_account_id,author_creator_id,target_type,target_id,parent_comment_id,body,created_at,updated_at)
      values(account,p_creator_id,p_target_type,p_target_id,p_parent_id,btrim(p_body),posted_at,posted_at) returning * into item;
    owner_account := private.discussion_owner(mod_row.creator_id);
    -- DISTINCT ON collapses mod-owner + reply-recipient overlap. Prefer the reply identity.
    for recipient in
      select distinct on (account_id) account_id, creator_id, priority from (
        select parent.author_account_id account_id,parent.author_creator_id creator_id,0 priority where p_parent_id is not null
        union all select owner_account,mod_row.creator_id,1
      ) candidates where account_id is not null and account_id <> account order by account_id,priority
    loop
      insert into public.activity_events(event_type,actor_type,actor_id,target_type,target_id,parent_type,parent_id,visibility,title,metadata)
      values(case when p_parent_id is null then 'comment_created' else 'comment_reply_created' end,
        case when p_creator_id is null then 'user'::public.activity_actor_type else 'creator'::public.activity_actor_type end,
        coalesce(p_creator_id,account),'comment',item.id,'mod',p_target_id,'private',
        case when p_parent_id is not null and recipient.priority=0 then 'New reply to your comment' else 'New comment on your mod' end,
        jsonb_build_object('discussionCommentId',item.id,'modId',p_target_id,'targetCategory','mod',
          'recipientCreatorId',recipient.creator_id,'recipientProfileId',recipient.account_id,
          'rootCommentId',coalesce(p_parent_id,item.id),'recipientReason',case when recipient.priority=0 then 'reply' else 'mod_owner' end,
          'publishingIdentityId',coalesce(p_creator_id,account),'publishingIdentityType',case when p_creator_id is null then 'user' else 'creator' end,
          'publishingName',case when p_creator_id is null then (select coalesce(display_name,username,'User') from public.profiles where id=account)
            else (select name from public.creators where id=p_creator_id) end,'modTitle',mod_row.title)) returning id into event_id;
      insert into public.notifications(profile_id,activity_event_id) values(recipient.account_id,event_id);
    end loop;
  else
    select * into item from private.discussion_comments where id=p_comment_id for update;
    if not found then raise exception 'Comment unavailable.' using errcode='22023'; end if;
    select exists(select 1 from private.discussion_moderators where profile_id=account)
      or exists(select 1 from public.mods m where m.id=item.target_id and private.discussion_owner(m.creator_id)=account) into moderator;
    if p_action in ('edit','delete') then
      perform 1 from public.teams t join public.creators c on c.team_id=t.id and t.creator_id=c.id
        where c.id=item.author_creator_id and c.owner_type='team' and t.status='active' for share of t;
      if exists(select 1 from public.creators where id=item.author_creator_id and owner_type='team') and not found then
        raise exception 'Archived team comments are read-only.' using errcode='42501';
      end if;
      if item.author_account_id <> account then raise exception 'Only the author can change this comment.' using errcode='42501'; end if;
      if item.status <> 'published' then raise exception 'This comment cannot be changed.' using errcode='22023'; end if;
      update private.discussion_comments set body=case when p_action='delete' then '' else btrim(p_body) end,
        status=case when p_action='delete' then 'deleted' else status end,updated_at=now() where id=item.id;
      -- Plain clients can edit text safely without leaving dangling spans.
      update private.discussion_references r set active=false where r.comment_id=item.id and r.active
        and (p_action='delete' or substring(btrim(p_body) from r.start_at+1 for r.end_at-r.start_at) is distinct from r.label);
    else
      if not moderator then raise exception 'You cannot moderate this discussion.' using errcode='42501'; end if;
      if item.status='deleted' then raise exception 'Deleted comments cannot be restored.' using errcode='22023'; end if;
      update private.discussion_comments set status=case when p_action='hide' then 'hidden' else 'published' end,updated_at=now() where id=item.id;
    end if;
    -- Never retain the removed body in event/notification copies (events store IDs only).
  end if;
  insert into private.discussion_mutations(account_id,is_post) values(account,p_action='create');
  return item.id;
end $function$;

create or replace function private.guard_publication_choice() returns trigger
language plpgsql set search_path='' as $$
declare
  is_public boolean := coalesce(new.status='published' and new.visibility in ('public','early_access')
    and new.release_state in ('public','early_access'),false);
  was_public boolean;
begin
  if tg_op='INSERT' then
    if new.notify_followers_on_publication is not null and current_user <> 'service_role' then
      raise exception 'Initial follower notification choice is set during upload.' using errcode='42501';
    end if;
    new.first_publication_pending := not is_public;
  else
    was_public := coalesce(old.status='published' and old.visibility in ('public','early_access')
      and old.release_state in ('public','early_access'),false);
    if new.notify_followers_on_publication is distinct from old.notify_followers_on_publication
      and not (old.first_publication_pending and not was_public
        and is_public and auth.uid() is not null and new.creator_id is not distinct from old.creator_id) then
      raise exception 'Follower notification choice may only change on first publication.' using errcode='42501';
    end if;
    new.first_publication_pending := old.first_publication_pending and not is_public;
  end if;
  return new;
end $$;

create or replace function private.notify_mod_publication() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.notify_followers_on_publication is true and private.follow_public_mod(new)
    and new.creator_id is not null and public.is_creator_operational(new.creator_id)
    and (tg_op='INSERT' or (old.first_publication_pending and not private.follow_public_mod(old))) then
    perform private.notify_followers('mod_published',new.id,coalesce(auth.uid(),new.created_by),
      new.creator_id,new.id,new.title);
  end if;
  return new;
end $$;

drop trigger notify_mod_publication on public.mods;
create trigger notify_mod_publication_on_insert after insert on public.mods
for each row execute function private.notify_mod_publication();
-- Only a statement that explicitly supplies the opt-in can notify on update.
create trigger notify_mod_publication_on_opt_in after update of notify_followers_on_publication on public.mods
for each row execute function private.notify_mod_publication();

notify pgrst, 'reload schema';
