create table private.discussion_references (
  comment_id uuid not null references private.discussion_comments(id) on delete cascade,
  kind text not null check(kind in ('user','creator','team','mod')),
  entity_id uuid not null,
  start_at integer not null,
  end_at integer not null check(end_at>start_at and start_at>=0),
  label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key(comment_id,kind,entity_id)
);
create index discussion_reference_reverse on private.discussion_references(kind,entity_id) where active;
create index discussion_post_cooldown on private.discussion_comments(author_account_id,target_type,target_id,created_at desc);
create index discussion_event_reference_lookup on public.activity_events ((metadata->>'discussionCommentId'))
where event_type in ('comment_created','comment_reply_created');
alter table private.discussion_references enable row level security;
revoke all on private.discussion_references from public,anon,authenticated;

-- Public fields only. Add new entity kinds here and in recipient resolution.
create view private.reference_entities with (security_invoker=true) as
  select 'user'::text kind,p.id,coalesce(nullif(p.display_name,''),p.username) label,
    p.avatar_url avatar,p.username context,'/profile/'||p.username href
  from public.profiles p where p.username ~ '^[A-Za-z0-9_.-]+$'
  union all
  select case when c.owner_type='team' then 'team' else 'creator' end,c.id,c.name,c.avatar,
    null::text,'/creator/'||c.id
  from public.creators c where public.is_creator_operational(c.id) and nullif(btrim(c.name),'') is not null
  union all
  select 'mod',m.id,m.title,m.image,c.name,'/mods/'||m.id
  from public.mods m left join public.creators c on c.id=m.creator_id
  where m.status='published' and m.visibility in ('public','early_access') and nullif(btrim(m.title),'') is not null;
revoke all on private.reference_entities from public,anon,authenticated;

create function private.search_discussion_references(p_trigger text,p_query text) returns jsonb
language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(to_jsonb(r)),'[]') from (
    select kind,id,label,avatar,context from private.reference_entities
    where auth.uid() is not null and p_trigger in ('@','#') and (kind='mod')=(p_trigger='#')
      and char_length(p_query) between 0 and 100
      and (strpos(lower(label),lower(p_query))>0 or strpos(lower(context),lower(p_query))>0)
    order by (lower(label)=lower(p_query)) desc,(strpos(lower(label),lower(p_query))=1) desc,lower(label),kind,id
    limit 10
  ) r
$$;
create function public.search_discussion_references(p_trigger text,p_query text) returns jsonb
language sql stable security invoker set search_path='' as $$ select private.search_discussion_references(p_trigger,p_query) $$;

create function private.discussion_reference_display(p_comment uuid) returns jsonb
language sql stable set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object('kind',r.kind,'id',r.entity_id,'start',r.start_at,'end',r.end_at,
    'label',r.label,'href',e.href) order by r.start_at),'[]')
  from private.discussion_references r left join private.reference_entities e on (e.kind,e.id)=(r.kind,r.entity_id)
  where r.comment_id=p_comment and r.active
$$;

create function private.save_discussion_references(p_comment uuid,p_refs jsonb) returns void
language plpgsql set search_path='' as $$
declare c private.discussion_comments; recipient record; event uuid; fresh jsonb;
begin
  select * into strict c from private.discussion_comments where id=p_comment for update;
  if c.author_account_id is distinct from auth.uid() or c.status<>'published' then
    raise exception 'Only the author can change references.' using errcode='42501';
  end if;
  if jsonb_typeof(p_refs) is distinct from 'array' or jsonb_array_length(p_refs)>char_length(c.body)/2 then
    raise exception 'Invalid discussion references.' using errcode='22023';
  end if;
  if jsonb_array_length(p_refs)>0 and not exists(select 1 from public.mods m
    where m.id=c.target_id and m.status='published' and m.visibility in ('public','early_access')) then
    raise exception 'References are only available in public discussions.' using errcode='22023';
  end if;
  if exists(
    with spans as (
      select x.*,lag(x."end") over(order by x.start,x."end") prior_end,
        count(*) over(partition by x.kind,x.id) occurrences
      from jsonb_to_recordset(p_refs) x(kind text,id uuid,start integer,"end" integer)
    )
    select 1 from spans x
    left join private.reference_entities e on (e.kind,e.id)=(x.kind,x.id)
    left join private.discussion_references old on (old.comment_id,old.kind,old.entity_id)=(p_comment,x.kind,x.id)
    where x.start is null or x."end" is null or x.start<0 or x."end"<=x.start
      or x."end">char_length(c.body) or x.start<x.prior_end or x.occurrences>1
      or (e.id is null and old.entity_id is null)
      or substring(c.body from x.start+1 for greatest(0,x."end"-x.start)) is distinct from
        case when substring(c.body from x.start+1 for greatest(0,x."end"-x.start))=old.label then old.label
          else (case when x.kind='mod' then '#' else '@' end)||e.label end
  ) then raise exception 'A reference is invalid, duplicated, or no longer available.' using errcode='22023'; end if;

  select coalesce(jsonb_agg(jsonb_build_object('kind',x.kind,'id',x.id)),'[]') into fresh
  from jsonb_to_recordset(p_refs) x(kind text,id uuid)
  where not exists(select 1 from private.discussion_references old where (old.comment_id,old.kind,old.entity_id)=(p_comment,x.kind,x.id));

  update private.discussion_references r set active=false where r.comment_id=p_comment and r.active
    and not exists(select 1 from jsonb_to_recordset(p_refs) x(kind text,id uuid) where (x.kind,x.id)=(r.kind,r.entity_id));
  insert into private.discussion_references(comment_id,kind,entity_id,start_at,end_at,label)
  select p_comment,x.kind,x.id,x.start,x."end",substring(c.body from x.start+1 for x."end"-x.start)
    from jsonb_to_recordset(p_refs) x(kind text,id uuid,start integer,"end" integer)
  on conflict(comment_id,kind,entity_id) do update set
    start_at=excluded.start_at,end_at=excluded.end_at,label=excluded.label,active=true;

  for recipient in
    with refs as (
      select r.* from private.discussion_references r join private.reference_entities e on (e.kind,e.id)=(r.kind,r.entity_id)
      where r.comment_id=p_comment and r.active
        and fresh @> jsonb_build_array(jsonb_build_object('kind',r.kind,'id',r.entity_id))
    ), accounts as (
      select kind,entity_id,case when kind='user' then entity_id else private.discussion_owner(entity_id) end account
      from refs where kind<>'mod'
      union
      select r.kind,r.entity_id,private.discussion_owner(m.creator_id) from refs r join public.mods m on m.id=r.entity_id where r.kind='mod'
      union
      select r.kind,r.entity_id,private.discussion_owner(mc.creator_id) from refs r join public.mod_creators mc on mc.mod_id=r.entity_id
        where r.kind='mod' and mc.role='owner'
    )
    select a.account,jsonb_agg(jsonb_build_object('kind',a.kind,'id',a.entity_id) order by a.kind,a.entity_id) refs
    from accounts a join public.profiles p on p.id=a.account
    where a.account<>c.author_account_id group by a.account
  loop
    select e.id into event from public.activity_events e
    where e.event_type in ('comment_created','comment_reply_created') and e.metadata->>'discussionCommentId'=p_comment::text
      and (e.metadata->>'recipientProfileId'=recipient.account::text or exists(
        select 1 from public.notifications n where n.activity_event_id=e.id and n.profile_id=recipient.account))
    order by e.id limit 1;
    if found then
      update public.activity_events e set metadata=e.metadata||jsonb_build_object('referenceKeys',
        (select jsonb_agg(distinct k) from jsonb_array_elements(coalesce(e.metadata->'referenceKeys','[]')||recipient.refs) k))
      where e.id=event;
    else
      insert into public.activity_events(event_type,actor_type,actor_id,target_type,target_id,parent_type,parent_id,visibility,title,metadata)
      values(case when c.parent_comment_id is null then 'comment_created' else 'comment_reply_created' end,
        case when c.author_creator_id is null then 'user'::public.activity_actor_type else 'creator'::public.activity_actor_type end,
        coalesce(c.author_creator_id,c.author_account_id),'comment',c.id,'mod',c.target_id,'private','New discussion reference',
        jsonb_build_object('discussionCommentId',c.id,'modId',c.target_id,'targetCategory','mod',
          'rootCommentId',coalesce(c.parent_comment_id,c.id),'recipientReason','reference',
          'recipientProfileId',recipient.account,'referenceKeys',recipient.refs))
      returning id into event;
      insert into public.notifications(profile_id,activity_event_id) values(recipient.account,event);
    end if;
  end loop;
end $$;

create function private.write_referenced_discussion(p_action text,p_comment uuid,p_mod uuid,p_creator uuid,p_parent uuid,p_body text,p_rating integer,p_refs jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare saved jsonb; comment uuid; item jsonb;
begin
  if p_action not in ('create','edit') or p_action is null or p_body is null or btrim(p_body)='' or
    (p_rating is not null and (p_action<>'create' or p_parent is not null)) then
    raise exception 'Invalid reference submission.' using errcode='22023';
  end if;
  if p_action='edit' and not exists(select 1 from private.discussion_comments where id=p_comment and target_type='mod' and target_id=p_mod) then
    raise exception 'Comment unavailable.' using errcode='22023';
  end if;
  if p_action='create' and p_parent is null then
    saved:=private.submit_mod_feedback(p_mod,p_creator,p_body,p_rating);
    comment:=(saved->>'id')::uuid;
  else
    comment:=private.write_discussion(p_action,p_comment,p_mod,p_creator,p_parent,p_body,'mod');
    saved:=jsonb_build_object('id',comment);
  end if;
  perform private.save_discussion_references(comment,p_refs);
  select value into item from jsonb_array_elements(private.read_discussions('thread',null,null,p_mod,'written',null,1,20,comment)->'items')
    where value->>'id'=comment::text;
  return saved||jsonb_build_object('item',item);
end $$;
create function public.write_referenced_discussion(p_action text,p_comment uuid,p_mod uuid,p_creator uuid,p_parent uuid,p_body text,p_rating integer,p_refs jsonb) returns jsonb
language sql security invoker set search_path='' as $$
  select private.write_referenced_discussion(p_action,p_comment,p_mod,p_creator,p_parent,p_body,p_rating,p_refs)
$$;
revoke all on function private.discussion_reference_display(uuid),private.save_discussion_references(uuid,jsonb),
  private.search_discussion_references(text,text),public.search_discussion_references(text,text),
  private.write_referenced_discussion(text,uuid,uuid,uuid,uuid,text,integer,jsonb),
  public.write_referenced_discussion(text,uuid,uuid,uuid,uuid,text,integer,jsonb) from public,anon,authenticated;
grant execute on function private.search_discussion_references(text,text),public.search_discussion_references(text,text),
  private.write_referenced_discussion(text,uuid,uuid,uuid,uuid,text,integer,jsonb),
  public.write_referenced_discussion(text,uuid,uuid,uuid,uuid,text,integer,jsonb) to authenticated;

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
    select * into mod_row from public.mods where id=p_target_id and status='published';
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
end $function$
;

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
    select coalesce(parent_comment_id,id) into root_id from private.discussion_comments where id=p_comment_id and target_id=p_target_id;
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
    join public.mods m on m.id=c.target_id and c.target_type='mod' and m.status='published'
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
    from public.mods m where m.id=p_target_id and m.status='published'),false)) into result;
  return result;
end $function$
;

create or replace function private.discussion_event_details(p_ids uuid[]) returns jsonb
language plpgsql stable security definer set search_path='' as $$
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
      and m.status='published' and m.visibility in ('public','early_access') then
      (select jsonb_agg((case when entity.kind='mod' then '#' else '@' end)||entity.label order by entity.kind,entity.id)
        from jsonb_to_recordset(coalesce(e.metadata->'referenceKeys','[]')) k(kind text,id uuid)
        join private.reference_entities entity on (entity.kind,entity.id)=(k.kind,k.id)) end,
    'contentAvailable',coalesce(c.status='published' and (parent.id is null or parent.status<>'hidden') and m.status='published' and m.visibility in ('public','early_access'),false)
  )) from public.activity_events e
    join private.discussion_comments c on c.id::text=e.metadata->>'discussionCommentId'
    left join private.discussion_comments parent on parent.id=c.parent_comment_id
    left join public.mods m on m.id=c.target_id
    left join public.creators cr on e.actor_type='creator' and cr.id=e.actor_id
    left join public.profiles pr on e.actor_type='user' and pr.id=e.actor_id
    where e.id=any(p_ids) and e.event_type in ('comment_created','comment_reply_created')
      and exists(select 1 from public.notifications n where n.activity_event_id=e.id and n.profile_id=auth.uid())), '{}'::jsonb);
end $$;

notify pgrst,'reload schema';
