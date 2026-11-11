-- Incremental only: requires the applied unified_discussions + team_archive_lifecycle.
create table private.mod_ratings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles(id),
  mod_id uuid not null references public.mods(id),
  value smallint not null check(value between 1 and 5),
  is_valid boolean not null default true,
  moderation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id,mod_id)
);
create index mod_ratings_target on private.mod_ratings(mod_id,created_at,id);
create table private.mod_rating_totals (
  mod_id uuid primary key references public.mods(id),
  rating_sum bigint not null default 0 check(rating_sum>=0),
  rating_count bigint not null default 0 check(rating_count>=0),
  check(rating_sum between rating_count and 5*rating_count)
);
create table private.mod_rating_history (
  id bigint generated always as identity primary key,
  rating_id uuid not null references private.mod_ratings(id),
  actor_account_id uuid references public.profiles(id),
  old_value smallint,
  new_value smallint not null,
  old_valid boolean,
  new_valid boolean not null,
  reason text,
  changed_at timestamptz not null default now()
);
create index mod_rating_history_rating on private.mod_rating_history(rating_id,id);
-- A submission snapshot, never a second vote. Later rating edits do not rewrite it.
create table private.discussion_rating_submissions (
  comment_id uuid primary key references private.discussion_comments(id),
  rating_id uuid not null references private.mod_ratings(id),
  value smallint not null check(value between 1 and 5)
);
alter table private.mod_ratings enable row level security;
alter table private.mod_rating_totals enable row level security;
alter table private.mod_rating_history enable row level security;
alter table private.discussion_rating_submissions enable row level security;
revoke all on private.mod_ratings,private.mod_rating_totals,private.mod_rating_history,private.discussion_rating_submissions from public,anon,authenticated;

create function private.record_mod_rating() returns trigger
language plpgsql security definer set search_path='' as $$
declare previous_sum integer:=0; previous_count integer:=0;
begin
  if tg_op='UPDATE' then
    if row(new.id,new.account_id,new.mod_id,new.created_at) is distinct from row(old.id,old.account_id,old.mod_id,old.created_at) then
      raise exception 'Rating ownership is permanent.' using errcode='42501';
    end if;
    if row(new.value,new.is_valid,new.moderation_reason) is not distinct from row(old.value,old.is_valid,old.moderation_reason) then return new; end if;
    if old.is_valid then previous_sum:=old.value; previous_count:=1; end if;
  end if;
  insert into private.mod_rating_totals(mod_id) values(new.mod_id) on conflict do nothing;
  update private.mod_rating_totals set
    rating_sum=rating_sum-previous_sum+case when new.is_valid then new.value else 0 end,
    rating_count=rating_count-previous_count+case when new.is_valid then 1 else 0 end
    where mod_id=new.mod_id;
  insert into private.mod_rating_history(rating_id,actor_account_id,old_value,new_value,old_valid,new_valid,reason)
    values(new.id,auth.uid(),case when tg_op='UPDATE' then old.value end,new.value,
      case when tg_op='UPDATE' then old.is_valid end,new.is_valid,new.moderation_reason);
  return new;
end $$;
revoke all on function private.record_mod_rating() from public,anon,authenticated;
create trigger record_mod_rating after insert or update on private.mod_ratings
for each row execute function private.record_mod_rating();

create function private.set_mod_rating(p_mod_id uuid,p_creator_id uuid,p_value integer) returns uuid
language plpgsql security definer set search_path='' as $$
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
  select * into m from public.mods where id=p_mod_id and status='published' for share;
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
end $$;
revoke all on function private.set_mod_rating(uuid,uuid,integer) from public,anon,authenticated;

create function private.read_mod_rating(p_mod_id uuid,p_page integer default 1) returns jsonb
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
    'count',coalesce(total.rating_count,0),'ownRating',case when rating.id is not null then jsonb_build_object('value',rating.value,'isValid',rating.is_valid) end,
    'canRate',account is not null and private.discussion_owner(m.creator_id) is distinct from account and not exists(select 1 from public.mod_creators mc where mc.mod_id=m.id and mc.role='owner' and private.discussion_owner(mc.creator_id)=account),
    'canModerate',moderator,'moderation',case when moderator then coalesce((select jsonb_agg(x) from
      (select id,value,is_valid,moderation_reason,created_at from private.mod_ratings where mod_id=p_mod_id order by created_at,id limit 20 offset (p_page-1)*20) x),'[]'::jsonb) else '[]'::jsonb end,
    'hasMore',moderator and exists(select 1 from private.mod_ratings where mod_id=p_mod_id order by created_at,id offset p_page*20 limit 1));
end $$;
revoke all on function private.read_mod_rating(uuid,integer) from public,anon,authenticated;
grant execute on function private.read_mod_rating(uuid,integer) to anon,authenticated;
create function public.read_mod_rating(p_mod_id uuid,p_page integer default 1) returns jsonb
language sql security invoker set search_path='' as $$ select private.read_mod_rating(p_mod_id,p_page) $$;
revoke all on function public.read_mod_rating(uuid,integer) from public,anon,authenticated;
grant execute on function public.read_mod_rating(uuid,integer) to anon,authenticated;

-- Comment and optional rating commit together. A rating-only request never creates a comment.
create function private.submit_mod_feedback(p_mod_id uuid,p_creator_id uuid,p_body text default null,p_rating integer default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare comment uuid; rating uuid; item jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in to submit feedback.' using errcode='42501'; end if;
  if p_rating is null and nullif(btrim(p_body),'') is null then raise exception 'Write a comment or choose a rating.' using errcode='22023'; end if;
  if p_rating is not null then rating:=private.set_mod_rating(p_mod_id,p_creator_id,p_rating); end if;
  if nullif(btrim(p_body),'') is not null then
    comment:=private.write_discussion('create',null,p_mod_id,p_creator_id,null,p_body,'mod');
    if rating is not null then insert into private.discussion_rating_submissions values(comment,rating,p_rating); end if;
    select value into item from jsonb_array_elements(private.read_discussions('thread',null,null,p_mod_id,'written',null,1,20,comment)->'items') where value->>'id'=comment::text;
  end if;
  return jsonb_build_object('id',comment,'item',item,'rating',private.read_mod_rating(p_mod_id));
end $$;
revoke all on function private.submit_mod_feedback(uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function private.submit_mod_feedback(uuid,uuid,text,integer) to authenticated;
create function public.submit_mod_feedback(p_mod_id uuid,p_creator_id uuid,p_body text default null,p_rating integer default null) returns jsonb
language sql security invoker set search_path='' as $$ select private.submit_mod_feedback(p_mod_id,p_creator_id,p_body,p_rating) $$;
revoke all on function public.submit_mod_feedback(uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.submit_mod_feedback(uuid,uuid,text,integer) to authenticated;

-- Rating validity is a site-moderator decision, not a mod owner's score control.
create function private.moderate_mod_rating(p_rating_id uuid,p_valid boolean,p_reason text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not exists(select 1 from private.discussion_moderators where profile_id=auth.uid()) then
    raise exception 'Only a site moderator can review ratings.' using errcode='42501';
  end if;
  if p_valid is null or char_length(btrim(coalesce(p_reason,''))) not between 1 and 1000 then raise exception 'Provide a moderation reason (1–1,000 characters).' using errcode='22023'; end if;
  update private.mod_ratings set is_valid=p_valid,moderation_reason=btrim(p_reason),updated_at=now() where id=p_rating_id;
  if not found then raise exception 'Rating unavailable.' using errcode='22023'; end if;
end $$;
revoke all on function private.moderate_mod_rating(uuid,boolean,text) from public,anon,authenticated;
grant execute on function private.moderate_mod_rating(uuid,boolean,text) to authenticated;
create function public.moderate_mod_rating(p_rating_id uuid,p_valid boolean,p_reason text) returns void
language sql security invoker set search_path='' as $$ select private.moderate_mod_rating(p_rating_id,p_valid,p_reason) $$;
revoke all on function public.moderate_mod_rating(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.moderate_mod_rating(uuid,boolean,text) to authenticated;

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
    'reply_count',(select count(*) from private.discussion_comments r where r.parent_comment_id=rows.id and r.status='published')
  ) order by case when p_mode='thread' then (parent_comment_id is null)::int end desc,case when p_mode='thread' and id=p_comment_id then 1 else 0 end desc,case when p_mode in ('thread','replies') then created_at end asc,case when p_mode not in ('thread','replies') then created_at end desc,case when p_mode in ('thread','replies') then id end asc,case when p_mode not in ('thread','replies') then id end desc) from rows),'[]'::jsonb),
  'hasMore',(select count(*) > p_limit from page),'rootId',root_id,
  'canModerate',coalesce((select private.discussion_owner(m.creator_id)=account
    or exists(select 1 from private.discussion_moderators where profile_id=account)
    from public.mods m where m.id=p_target_id and m.status='published'),false)) into result;
  return result;
end $function$
;

-- Read-time enrichment supports existing notifications without rewriting history.
create function private.discussion_event_details(p_ids uuid[]) returns jsonb
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
    'contentAvailable',coalesce(c.status='published' and (parent.id is null or parent.status<>'hidden') and m.status='published',false)
  )) from public.activity_events e
    join private.discussion_comments c on c.id::text=e.metadata->>'discussionCommentId'
    left join private.discussion_comments parent on parent.id=c.parent_comment_id
    left join public.mods m on m.id=c.target_id
    left join public.creators cr on e.actor_type='creator' and cr.id=e.actor_id
    left join public.profiles pr on e.actor_type='user' and pr.id=e.actor_id
    where e.id=any(p_ids) and e.event_type in ('comment_created','comment_reply_created')
      and exists(select 1 from public.notifications n where n.activity_event_id=e.id and n.profile_id=auth.uid())), '{}'::jsonb);
end $$;
revoke all on function private.discussion_event_details(uuid[]) from public,anon,authenticated;
grant execute on function private.discussion_event_details(uuid[]) to authenticated;
create function public.discussion_event_details(p_ids uuid[]) returns jsonb
language sql security invoker set search_path='' as $$ select private.discussion_event_details(p_ids) $$;
revoke all on function public.discussion_event_details(uuid[]) from public,anon,authenticated;
grant execute on function public.discussion_event_details(uuid[]) to authenticated;

notify pgrst,'reload schema';
