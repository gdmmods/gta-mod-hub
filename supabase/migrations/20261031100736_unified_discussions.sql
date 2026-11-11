-- Discussion storage is deliberately outside the Data API. Public RPC wrappers
-- are invokers; only the narrowly scoped private implementations bypass RLS.
create schema if not exists private;
create table private.discussion_comments (
  id uuid primary key default gen_random_uuid(),
  author_account_id uuid not null references public.profiles(id),
  author_creator_id uuid references public.creators(id),
  target_type text not null check (target_type in ('mod','asset','knowledge','showcase')),
  target_id uuid not null,
  parent_comment_id uuid references private.discussion_comments(id),
  body text not null check (char_length(body) <= 4000),
  status text not null default 'published' check (status in ('published','hidden','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'deleted' or char_length(btrim(body)) > 0)
);
create index discussion_target on private.discussion_comments(target_type,target_id,created_at desc,id desc);
create index discussion_author on private.discussion_comments(author_account_id,created_at desc,id desc);
create index discussion_creator on private.discussion_comments(author_creator_id,created_at desc,id desc);
create index discussion_parent on private.discussion_comments(parent_comment_id,created_at,id);
create table private.discussion_moderators (
  profile_id uuid primary key references public.profiles(id)
);
create table private.discussion_mutations (
  account_id uuid not null references public.profiles(id),
  occurred_at timestamptz not null default now(),
  is_post boolean not null
);
create index discussion_mutation_rate on private.discussion_mutations(account_id,occurred_at desc);
alter table private.discussion_comments enable row level security;
alter table private.discussion_moderators enable row level security;
alter table private.discussion_mutations enable row level security;
revoke all on private.discussion_comments,private.discussion_moderators,private.discussion_mutations from public,anon,authenticated;

create function private.guard_discussion_identity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if row(new.id,new.author_account_id,new.author_creator_id,new.target_type,new.target_id,new.parent_comment_id,new.created_at)
    is distinct from row(old.id,old.author_account_id,old.author_creator_id,old.target_type,old.target_id,old.parent_comment_id,old.created_at) then
    raise exception 'Discussion ownership, publishing identity and context are immutable.' using errcode='42501';
  end if;
  return new;
end $$;
revoke all on function private.guard_discussion_identity() from public,anon,authenticated;
create trigger guard_discussion_identity before update on private.discussion_comments
for each row execute function private.guard_discussion_identity();

create function private.discussion_owner(p_creator uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select case when c.owner_type = 'user' then c.owner_id
    when c.owner_type = 'team' then leader.owner_id end
  from public.creators c
  left join public.teams t on t.id=c.team_id and t.creator_id=c.id
  left join public.creators leader on leader.id=t.owner_id and leader.owner_type='user'
  where c.id=p_creator
$$;
revoke all on function private.discussion_owner(uuid) from public,anon,authenticated;

-- One entry point for all changes: account and identity cannot be supplied on edits.
create function private.write_discussion(
  p_action text, p_comment_id uuid default null, p_target_id uuid default null,
  p_creator_id uuid default null, p_parent_id uuid default null,
  p_body text default null, p_target_type text default 'mod'
) returns uuid language plpgsql security definer set search_path = '' as $$
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
    insert into private.discussion_comments(author_account_id,author_creator_id,target_type,target_id,parent_comment_id,body)
      values(account,p_creator_id,p_target_type,p_target_id,p_parent_id,btrim(p_body)) returning * into item;
    owner_account := private.discussion_owner(mod_row.creator_id);
    -- DISTINCT ON collapses mod-owner + reply-recipient overlap. Prefer the reply identity.
    for recipient in
      select distinct on (account_id) account_id, creator_id from (
        select parent.author_account_id account_id,parent.author_creator_id creator_id,0 priority where p_parent_id is not null
        union all select owner_account,mod_row.creator_id,1
      ) candidates where account_id is not null and account_id <> account order by account_id,priority
    loop
      insert into public.activity_events(event_type,actor_type,actor_id,target_type,target_id,parent_type,parent_id,visibility,title,metadata)
      values(case when p_parent_id is null then 'comment_created' else 'comment_reply_created' end,
        case when p_creator_id is null then 'user'::public.activity_actor_type else 'creator'::public.activity_actor_type end,
        coalesce(p_creator_id,account),'comment',item.id,'mod',p_target_id,'private',
        case when p_parent_id is null then 'New mod comment' else 'New discussion reply' end,
        jsonb_build_object('discussionCommentId',item.id,'modId',p_target_id,'targetCategory','mod',
          'recipientCreatorId',recipient.creator_id,'recipientProfileId',recipient.account_id)) returning id into event_id;
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
    else
      if not moderator then raise exception 'You cannot moderate this discussion.' using errcode='42501'; end if;
      if item.status='deleted' then raise exception 'Deleted comments cannot be restored.' using errcode='22023'; end if;
      update private.discussion_comments set status=case when p_action='hide' then 'hidden' else 'published' end,updated_at=now() where id=item.id;
    end if;
    -- Never retain the removed body in event/notification copies (events store IDs only).
  end if;
  insert into private.discussion_mutations(account_id,is_post) values(account,p_action='create');
  return item.id;
end $$;
revoke all on function private.write_discussion(text,uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant usage on schema private to anon,authenticated;
grant execute on function private.write_discussion(text,uuid,uuid,uuid,uuid,text,text) to authenticated;
create function public.write_discussion(
  p_action text, p_comment_id uuid default null, p_target_id uuid default null,
  p_creator_id uuid default null, p_parent_id uuid default null,
  p_body text default null, p_target_type text default 'mod'
) returns uuid language sql security invoker set search_path = '' as $$
 select private.write_discussion(p_action,p_comment_id,p_target_id,p_creator_id,p_parent_id,p_body,p_target_type)
$$;
revoke all on function public.write_discussion(text,uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.write_discussion(text,uuid,uuid,uuid,uuid,text,text) to authenticated;

create function private.read_discussions(
  p_mode text, p_identity_type text default null, p_identity_id uuid default null,
  p_target_id uuid default null, p_direction text default 'written',
  p_category text default null, p_page integer default 1, p_limit integer default 20,
  p_comment_id uuid default null
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  account uuid := auth.uid();
  root_id uuid;
  result jsonb;
begin
  if p_mode is null or p_mode not in ('target','identity','account','thread','moderation')
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
  if p_mode='thread' then
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
      case when p_mode='thread' and id=p_comment_id then 1 else 0 end desc,created_at desc,id desc
    limit p_limit+1 offset (p_page-1)*p_limit
  ), rows as (
    select * from page
    order by case when p_mode='thread' then (parent_comment_id is null)::int end desc,case when p_mode='thread' and id=p_comment_id then 1 else 0 end desc,created_at desc,id desc
    limit p_limit
  )
  select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object(
    'id',id,'target_type',target_type,'target_id',target_id,'target_title',target_title,
    'parent_comment_id',parent_comment_id,'body',body,'status',status,'created_at',created_at,'updated_at',updated_at,
    'author_name',author_name,'author_href',author_href,'author_creator_id',author_creator_id,
    'can_edit',coalesce(can_edit,false),'can_moderate',coalesce(can_moderate,false),
    'reply_count',(select count(*) from private.discussion_comments r where r.parent_comment_id=rows.id and r.status='published')
  ) order by case when p_mode='thread' then (parent_comment_id is null)::int end desc,case when p_mode='thread' and id=p_comment_id then 1 else 0 end desc,created_at desc,id desc) from rows),'[]'::jsonb),
  'hasMore',(select count(*) > p_limit from page),'rootId',root_id,
  'canModerate',coalesce((select private.discussion_owner(m.creator_id)=account
    or exists(select 1 from private.discussion_moderators where profile_id=account)
    from public.mods m where m.id=p_target_id and m.status='published'),false)) into result;
  return result;
end $$;
revoke all on function private.read_discussions(text,text,uuid,uuid,text,text,integer,integer,uuid) from public,anon,authenticated;
grant execute on function private.read_discussions(text,text,uuid,uuid,text,text,integer,integer,uuid) to anon,authenticated;
create function public.read_discussions(
  p_mode text, p_identity_type text default null, p_identity_id uuid default null,
  p_target_id uuid default null, p_direction text default 'written',
  p_category text default null, p_page integer default 1, p_limit integer default 20,
  p_comment_id uuid default null
) returns jsonb language sql security invoker set search_path = '' as $$
 select private.read_discussions(p_mode,p_identity_type,p_identity_id,p_target_id,p_direction,p_category,p_page,p_limit,p_comment_id)
$$;
revoke all on function public.read_discussions(text,text,uuid,uuid,text,text,integer,integer,uuid) from public,anon,authenticated;
grant execute on function public.read_discussions(text,text,uuid,uuid,text,text,integer,integer,uuid) to anon,authenticated;

-- Existing clients must not impersonate discussion-generated events through the
-- legacy activity insert path. Other activity/team behavior is preserved.
create function private.guard_discussion_events() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') and (
    new.event_type in ('comment_created','comment_reply_created')
    or new.metadata ? 'discussionCommentId'
  ) then raise exception 'Discussion events must be generated by a comment.' using errcode='42501'; end if;
  return new;
end $$;
revoke all on function private.guard_discussion_events() from public,anon,authenticated;
create trigger guard_discussion_events before insert or update on public.activity_events
for each row execute function private.guard_discussion_events();
notify pgrst, 'reload schema';
