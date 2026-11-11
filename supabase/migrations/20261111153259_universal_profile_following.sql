-- Extend existing identity-based subscriptions without changing any existing rows.
alter table private.follows
  add column followed_user_id uuid references public.profiles(id) on delete cascade,
  drop constraint follows_check,
  add constraint follows_one_target check (num_nonnulls(creator_id,mod_id,followed_user_id)=1),
  add constraint follows_not_same_user check (followed_user_id is distinct from follower_user_id or followed_user_id is null);

create unique index follows_user_target_identity on private.follows
  (followed_user_id,(follower_creator_id is not null),(coalesce(follower_creator_id,follower_user_id)))
  where followed_user_id is not null;
create index follows_user_target_recent on private.follows (followed_user_id,created_at desc)
  where followed_user_id is not null;

create view private.follow_public_identities with (security_invoker=true) as
  select 'user'::text kind,p.id,coalesce(nullif(p.display_name,''),p.username) name,
    p.avatar_url avatar,null::text[] specialization,coalesce(h.handle,p.username) handle,
    '/profile/'||p.username href
  from public.profiles p left join private.identity_handles h on h.user_id=p.id and h.retired_at is null
  where p.username ~ '^[A-Za-z0-9_.-]+$' and p.username not in ('.','..')
  union all
  select 'creator',c.id,c.name,c.avatar,c.specialization,h.handle,'/creator/'||c.id
  from public.creators c left join private.identity_handles h on h.creator_id=c.id and h.retired_at is null;
revoke all on private.follow_public_identities from public,anon,authenticated;

create or replace function private.follow_identity_target(p_kind text,p_id uuid,p_creator uuid) returns boolean
language sql stable set search_path='' as $$
  select case p_kind
    when 'user' then exists(select 1 from private.follow_public_identities i where i.kind='user' and i.id=p_id)
    when 'creator' then public.is_creator_operational(p_id) and p_id is distinct from p_creator
    when 'mod' then exists(
      select 1 from public.mods m where m.id=p_id and private.follow_public_mod(m)
        and (m.creator_id is null or public.is_creator_operational(m.creator_id))
        and (p_creator is null or (m.creator_id is distinct from p_creator and not exists(
          select 1 from public.mod_creators mc where mc.mod_id=m.id
            and mc.creator_id=p_creator and mc.role='owner')))
    )
    else false end
$$;

create function private.follow_target_allowed(p_kind text,p_id uuid,p_account uuid,p_creator uuid)
returns boolean language sql stable set search_path='' as $$
  select private.follow_identity_target(p_kind,p_id,p_creator)
    and (p_kind='mod' or (
      (p_account is null or p_creator is not null or exists(
        select 1 from private.follow_public_identities i where i.kind='user' and i.id=p_account
      ))
      and (p_account is null or (case p_kind when 'user' then p_id else private.discussion_owner(p_id) end)
        is distinct from p_account)
      and (p_creator is null or private.discussion_owner(p_creator) is null or
        (case p_kind when 'user' then p_id else private.discussion_owner(p_id) end)
          is distinct from private.discussion_owner(p_creator))
    ))
$$;
revoke all on function private.follow_target_allowed(text,uuid,uuid,uuid) from public,anon,authenticated;

create or replace function public.follow_state(p_kind text,p_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
  with identity as (
    select auth.uid() account,(select default_creator_id from public.profiles where id=auth.uid()) creator
  )
  select jsonb_build_object(
    'identityCreatorId',i.creator,
    'following',allowed.manage and exists(select 1 from private.follows f
      where ((p_kind='user' and f.followed_user_id=p_id) or (p_kind='creator' and f.creator_id=p_id) or (p_kind='mod' and f.mod_id=p_id))
        and ((i.creator is null and f.follower_user_id=i.account) or f.follower_creator_id=i.creator)),
    'count',(select count(*) from private.follows f where (p_kind='user' and f.followed_user_id=p_id) or (p_kind='creator' and f.creator_id=p_id)
      or (p_kind='mod' and f.mod_id=p_id and exists(select 1 from public.mods m where m.id=p_id and private.follow_public_mod(m)))),
    'canFollow',(i.account is null or allowed.manage) and private.follow_target_allowed(p_kind,p_id,i.account,i.creator),
    'canManage',allowed.manage,
    'signedIn',i.account is not null
  )
  from identity i
  cross join lateral (select private.follow_identity_allowed(i.account,i.creator)
    and (i.creator is null or public.is_creator_operational(i.creator))
    and exists(select 1 from public.profiles p where p.id=i.account) manage) allowed
$$;

create or replace function public.set_follow(p_kind text,p_id uuid,p_follow boolean,p_expected_creator uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare
  account uuid := auth.uid();
  selected uuid;
begin
  select default_creator_id into selected from public.profiles where id=account for share;
  if not found then raise exception 'Sign in to manage your follows.' using errcode='42501'; end if;
  if selected is distinct from p_expected_creator then
    raise exception 'Your selected identity changed. Refresh and try again.' using errcode='42501';
  end if;
  if selected is not null then
    perform private.require_operational_creator(selected);
    perform 1 from public.creator_members where profile_id=account and creator_id=selected and status='approved' for share;
    if not found or not private.follow_identity_allowed(account,selected) then
      raise exception 'Only the team leader can manage team follows, and creator access must be approved.' using errcode='42501';
    end if;
  end if;
  if p_kind is null or p_kind not in ('user','creator','mod') or p_id is null or p_follow is null then
    raise exception 'Invalid follow target.' using errcode='22023';
  end if;
  if not p_follow then
    delete from private.follows f
    where ((selected is null and f.follower_user_id=account) or f.follower_creator_id=selected)
      and (case p_kind when 'creator' then f.creator_id when 'user' then f.followed_user_id else f.mod_id end)=p_id;
    return false;
  end if;
  if not private.follow_target_allowed(p_kind,p_id,account,selected) then
    raise exception 'This identity cannot follow this profile or mod.' using errcode='42501';
  end if;
  if p_kind='creator' then perform private.require_operational_creator(p_id); end if;
  insert into private.follows(account_id,follower_user_id,follower_creator_id,creator_id,mod_id,followed_user_id)
  values(account,case when selected is null then account end,selected,
    case when p_kind='creator' then p_id end,case when p_kind='mod' then p_id end,case when p_kind='user' then p_id end)
  on conflict do nothing;
  return true;
end $$;

create or replace function public.list_following(p_kind text,p_limit int,p_offset int,p_expected_creator uuid)
returns table(id uuid,name text,image text,attribution text,available boolean)
language plpgsql stable security definer set search_path='' as $$
declare
  account uuid := auth.uid();
  selected uuid;
begin
  select p.default_creator_id into selected from public.profiles p where p.id=account;
  if not found or selected is distinct from p_expected_creator or not private.follow_identity_allowed(account,selected) then
    raise exception 'The selected identity cannot manage follows.' using errcode='42501';
  end if;
  return query
    select coalesce(f.creator_id,f.mod_id,f.followed_user_id),coalesce(c.name,m.title,nullif(p.display_name,''),p.username),
      coalesce(c.avatar,m.image,p.avatar_url),coalesce(mc.name,m.creator,p.username),c.id is not null or m.id is not null or p.username is not null
    from private.follows f
    left join public.profiles p on p.id=f.followed_user_id
    left join public.creators c on c.id=f.creator_id
    left join public.mods m on m.id=f.mod_id and private.follow_public_mod(m)
    left join public.creators mc on mc.id=m.creator_id
    where ((selected is null and f.follower_user_id=account) or f.follower_creator_id=selected)
      and ((p_kind='user' and f.followed_user_id is not null) or (p_kind='creator' and f.creator_id is not null) or (p_kind='mod' and f.mod_id is not null))
    order by f.created_at desc,coalesce(f.creator_id,f.mod_id,f.followed_user_id)
    limit least(greatest(p_limit,1),100) offset greatest(p_offset,0);
end $$;

create or replace function public.list_social_directory(
  p_creator uuid, p_username text, p_section text, p_offset integer default 0
) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare
  account uuid;
  label text;
  entries jsonb := '[]'::jsonb;
  page_offset integer := greatest(p_offset,0);
begin
  if num_nonnulls(p_creator,p_username)<>1 or p_section is null
    or p_section not in ('followers','creators','mods') then return null; end if;

  if p_creator is not null then
    select c.name into label
    from public.creators c
    where c.id=p_creator;
  else
    select coalesce(nullif(p.display_name,''),p.username),p.id into label,account
    from public.profiles p where lower(p.username collate "C")=lower(p_username collate "C") and p.username ~ '^[A-Za-z0-9_.-]+$';
  end if;
  if not found then return null; end if;

  if p_section in ('followers','creators') then
    with relationships as (
      select f.follower_user_id user_id,f.follower_creator_id creator_id,f.created_at
      from private.follows f
      where p_section='followers' and (f.creator_id=p_creator or f.followed_user_id=account)
      union all
      select f.followed_user_id,f.creator_id,f.created_at
      from private.follows f
      where p_section='creators' and (f.follower_user_id=account or f.follower_creator_id=p_creator)
        and f.mod_id is null
    ), page as (
      select i.*,r.created_at
      from relationships r
      join private.follow_public_identities i on
        (i.kind='user' and i.id=r.user_id) or (i.kind='creator' and i.id=r.creator_id)
      order by r.created_at desc,i.kind,i.id limit 25 offset page_offset
    )
    select coalesce(jsonb_agg((to_jsonb(page)-'created_at'-'kind') -
      case when page.kind='user' then array['id'] else array[]::text[] end order by created_at desc,kind,id),'[]'::jsonb)
    into entries from page;
  elsif p_section='mods' then
    with page as (
      select m.id,m.title,m.image,m.description,m.source_url,m.category,m.creator,m.creator_id,
        m.likes,m.downloads,f.created_at followed_at
      from private.follows f join public.mods m on m.id=f.mod_id
      where (f.follower_user_id=account or f.follower_creator_id=p_creator) and private.follow_public_mod(m)
      order by f.created_at desc,m.id limit 25 offset page_offset
    )
    select coalesce(jsonb_agg((to_jsonb(m)-'followed_at'-'creator_id') ||
      jsonb_build_object('mod_creators',attribution.creators) order by m.followed_at desc,m.id),'[]'::jsonb)
    into entries from page m
    cross join lateral (
      select jsonb_agg(jsonb_build_object('creators',jsonb_build_object('id',c.id,'name',c.name))
        order by (c.id=m.creator_id) desc nulls last,c.id) creators
      from (
        select m.creator_id id
        union
        select mc.creator_id from public.mod_creators mc where mc.mod_id=m.id
      ) linked join public.creators c on c.id=linked.id
    ) attribution;
  end if;

  return jsonb_build_object('name',label,'items',entries);
end $$;

create or replace function public.creator_relationship_counts(p_creator uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'followers', (select count(*) from private.follows f join private.follow_public_identities i
      on (i.kind='user' and i.id=f.follower_user_id) or (i.kind='creator' and i.id=f.follower_creator_id)
      where f.creator_id=c.id),
    'following', count(*) filter (where f.mod_id is null and f.follower_creator_id is not null),
    'followedCreations', count(m.id))
  from public.creators c
  left join private.follows f on f.follower_creator_id=c.id
  left join public.mods m on m.id=f.mod_id and private.follow_public_mod(m)
  where c.id=p_creator group by c.id
$$;

create or replace function public.personal_relationship_counts(p_username text)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'followers', (select count(*) from private.follows f join private.follow_public_identities i
      on (i.kind='user' and i.id=f.follower_user_id) or (i.kind='creator' and i.id=f.follower_creator_id)
      where f.followed_user_id=p.id),
    'following', count(*) filter (where f.mod_id is null and f.follower_user_id is not null),
    'followedCreations', count(m.id))
  from public.profiles p
  left join private.follows f on f.follower_user_id=p.id
  left join public.mods m on m.id=f.mod_id and private.follow_public_mod(m)
  where lower(p.username collate "C")=lower(p_username collate "C") group by p.id
$$;

create or replace function private.guard_following_activity() returns trigger
language plpgsql set search_path='' as $$
begin
  if current_user not in ('postgres','supabase_admin') and
    (new.event_type in ('creator_announcement','mod_version_update','mod_announcement','creator_followed','profile_followed')
      or new.metadata ? 'followingEventId'
      or (tg_op='UPDATE' and old.metadata ? 'followingEventId')) then
    raise exception 'Follower activity is generated by publication or a new follow only.' using errcode='42501';
  end if;
  return new;
end $$;

create or replace function private.notify_creator_followed() returns trigger
language plpgsql security definer set search_path='' as $$
declare
  recipient uuid := coalesce(new.followed_user_id,private.discussion_owner(new.creator_id));
  event_id uuid := gen_random_uuid();
  follower_name text;
  follower_username text;
  target_name text;
begin
  if recipient is null or recipient=new.account_id or recipient=private.follow_recipient(new) then return new; end if;
  if new.followed_user_id is not null then
    select coalesce(nullif(p.display_name,''),p.username) into target_name
    from public.profiles p where p.id=new.followed_user_id;
  else
    perform private.require_operational_creator(new.creator_id);
    select c.name into target_name from public.creators c where c.id=new.creator_id
      and (c.owner_type='user' or private.announcement_owner(c.id,recipient));
  end if;
  if not found or not exists(select 1 from public.profiles where id=recipient) then return new; end if;

  if new.follower_creator_id is not null then
    select c.name into follower_name from public.creators c where c.id=new.follower_creator_id;
  else
    select coalesce(nullif(p.display_name,''),p.username,'A ModVault member'),
      case when p.username ~ '^[A-Za-z0-9_.-]+$' and p.username not in ('.','..') then p.username end
    into follower_name,follower_username from public.profiles p where p.id=new.follower_user_id;
  end if;

  insert into public.activity_events(id,event_type,actor_type,actor_id,target_type,target_id,visibility,title,summary,metadata)
  values(event_id,case when new.followed_user_id is null then 'creator_followed' else 'profile_followed' end,
    case when new.follower_creator_id is null then 'user'::public.activity_actor_type else 'creator'::public.activity_actor_type end,
    coalesce(new.follower_creator_id,new.follower_user_id),case when new.followed_user_id is null then 'creator'::public.activity_target_type else 'profile'::public.activity_target_type end,
    coalesce(new.creator_id,new.followed_user_id),'private','New follower',
    coalesce(follower_name,'A ModVault member') || ' followed ' || target_name || '.',
    jsonb_build_object('followingEventId',event_id,'followerUsername',follower_username,'followerCreatorId',new.follower_creator_id));
  insert into public.notifications(profile_id,activity_event_id) values(recipient,event_id);
  return new;
end $$;

drop trigger notify_creator_followed on private.follows;
create trigger notify_creator_followed after insert on private.follows
for each row when (new.creator_id is not null or new.followed_user_id is not null)
execute function private.notify_creator_followed();

notify pgrst, 'reload schema';
