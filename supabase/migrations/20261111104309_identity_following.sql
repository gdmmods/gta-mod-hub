-- Preserve existing subscriptions under the authenticated account's personal identity.
alter table private.follows
  add column if not exists follower_user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists follower_creator_id uuid references public.creators(id) on delete cascade;
update private.follows set follower_user_id=account_id
where follower_user_id is null and follower_creator_id is null;
alter table private.follows drop constraint if exists follows_identity_check;
alter table private.follows add constraint follows_identity_check
  check (num_nonnulls(follower_user_id,follower_creator_id)=1);
alter table private.follows alter column account_id drop not null;
alter table private.follows drop constraint follows_account_id_fkey;
alter table private.follows add constraint follows_account_id_fkey
  foreign key(account_id) references public.profiles(id) on delete set null;
drop index if exists private.follows_creator_account;
drop index if exists private.follows_mod_account;
drop index if exists private.follows_account_date;
create unique index if not exists follows_creator_identity
  on private.follows(creator_id,(follower_creator_id is not null),(coalesce(follower_creator_id,follower_user_id)))
  where creator_id is not null;
create unique index if not exists follows_mod_identity
  on private.follows(mod_id,(follower_creator_id is not null),(coalesce(follower_creator_id,follower_user_id)))
  where mod_id is not null;
create index if not exists follows_user_date on private.follows(follower_user_id,created_at desc)
  where follower_user_id is not null;
create index if not exists follows_identity_date on private.follows(follower_creator_id,created_at desc)
  where follower_creator_id is not null;
create index if not exists follows_acting_account on private.follows(account_id);

create or replace function private.follow_identity_allowed(p_account uuid,p_creator uuid) returns boolean
language sql stable set search_path='' as $$
  select p_account is not null and (p_creator is null or exists(
    select 1 from public.creators c join public.creator_members cm on cm.creator_id=c.id
    where c.id=p_creator and cm.profile_id=p_account and cm.status='approved'
      and (c.owner_type is distinct from 'team' or private.announcement_owner(c.id,p_account))
  ))
$$;

create or replace function private.follow_identity_target(p_kind text,p_id uuid,p_creator uuid) returns boolean
language sql stable set search_path='' as $$
  select case p_kind
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

create or replace function private.follow_recipient(f private.follows) returns uuid
language sql stable set search_path='' as $$
  select coalesce(f.follower_user_id,
    case when public.is_creator_operational(f.follower_creator_id) then
      case when c.owner_type='team' then
        case when private.announcement_owner(c.id,private.discussion_owner(c.id)) then private.discussion_owner(c.id) end
      else coalesce(private.discussion_owner(c.id),
        case when private.follow_identity_allowed(f.account_id,c.id) then f.account_id end)
      end
    end)
  from (values(1)) placeholder(n)
  left join public.creators c on c.id=f.follower_creator_id
$$;

create or replace function public.follow_state(p_kind text,p_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
  with identity as (
    select auth.uid() account,(select default_creator_id from public.profiles where id=auth.uid()) creator
  )
  select jsonb_build_object(
    'identityCreatorId',i.creator,
    'following',allowed.manage and exists(select 1 from private.follows f
      where ((p_kind='creator' and f.creator_id=p_id) or (p_kind='mod' and f.mod_id=p_id))
        and ((i.creator is null and f.follower_user_id=i.account) or f.follower_creator_id=i.creator)),
    'count',(select count(*) from private.follows f where (p_kind='creator' and f.creator_id=p_id)
      or (p_kind='mod' and f.mod_id=p_id and exists(select 1 from public.mods m where m.id=p_id and private.follow_public_mod(m)))),
    'canFollow',(i.account is null or allowed.manage) and private.follow_identity_target(p_kind,p_id,i.creator),
    'canManage',allowed.manage,
    'signedIn',i.account is not null
  )
  from identity i
  cross join lateral (select private.follow_identity_allowed(i.account,i.creator)
    and exists(select 1 from public.profiles p where p.id=i.account) manage) allowed
$$;

-- A previous client cannot silently write under a different identity.
drop function if exists public.set_follow(text,uuid,boolean);
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
  if p_kind is null or p_kind not in ('creator','mod') or p_id is null or p_follow is null then
    raise exception 'Invalid follow target.' using errcode='22023';
  end if;
  if not p_follow then
    delete from private.follows f
    where ((selected is null and f.follower_user_id=account) or f.follower_creator_id=selected)
      and (case p_kind when 'creator' then f.creator_id else f.mod_id end)=p_id;
    return false;
  end if;
  if not private.follow_identity_target(p_kind,p_id,selected) then
    raise exception 'This identity cannot follow this profile or mod.' using errcode='42501';
  end if;
  insert into private.follows(account_id,follower_user_id,follower_creator_id,creator_id,mod_id)
  values(account,case when selected is null then account end,selected,
    case when p_kind='creator' then p_id end,case when p_kind='mod' then p_id end)
  on conflict do nothing;
  return true;
end $$;

drop function if exists public.list_following(text,integer,integer);
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
    select coalesce(f.creator_id,f.mod_id),coalesce(c.name,m.title),
      coalesce(c.avatar,m.image),coalesce(mc.name,m.creator),c.id is not null or m.id is not null
    from private.follows f
    left join public.creators c on c.id=f.creator_id
    left join public.mods m on m.id=f.mod_id and private.follow_public_mod(m)
    left join public.creators mc on mc.id=m.creator_id
    where ((selected is null and f.follower_user_id=account) or f.follower_creator_id=selected)
      and ((p_kind='creator' and f.creator_id is not null) or (p_kind='mod' and f.mod_id is not null))
    order by f.created_at desc,coalesce(f.creator_id,f.mod_id)
    limit least(greatest(p_limit,1),100) offset greatest(p_offset,0);
end $$;

-- Announcement and release events retain their existing identity, links, and keys.
-- Collapse recipient accounts after resolving the subscribing identities.
create or replace function private.notify_followers(p_event text,p_key uuid,p_actor uuid,p_creator uuid,p_mod uuid,p_title text)
returns void language plpgsql set search_path='' as $$
declare
  event_id uuid;
  creator_audience boolean := p_event in ('mod_published','creator_announcement');
begin
  insert into public.activity_events(event_type,actor_type,actor_id,target_type,target_id,visibility,title,summary,metadata)
  values(p_event,'creator',p_creator,case when p_mod is null then 'creator'::public.activity_target_type else 'mod'::public.activity_target_type end,
    coalesce(p_mod,p_creator),'private',case p_event
      when 'mod_published' then 'New mod from a creator you follow'
      when 'creator_announcement' then 'Creator announcement'
      when 'mod_version_update' then 'Mod version update'
      else 'Mod announcement' end,p_title,
    jsonb_build_object('followingEventId',p_key,'creatorId',p_creator,'modId',p_mod))
  on conflict (event_type,(metadata->>'followingEventId')) where metadata ? 'followingEventId' do nothing
  returning id into event_id;
  if event_id is null then return; end if;
  insert into public.notifications(profile_id,activity_event_id)
  select p.id,event_id
  from (
    select distinct private.follow_recipient(f) account
    from private.follows f
    where (creator_audience and f.creator_id=p_creator) or (not creator_audience and f.mod_id=p_mod)
  ) recipients join public.profiles p on p.id=recipients.account
  where p.id is distinct from p_actor
    and p.id is distinct from private.discussion_owner(p_creator)
    and (p_mod is null or not private.follow_owns_mod(p_mod,p.id));
end $$;

revoke all on function private.follow_identity_allowed(uuid,uuid),private.follow_identity_target(text,uuid,uuid),
  private.follow_recipient(private.follows) from public,anon,authenticated;
revoke all on function public.set_follow(text,uuid,boolean,uuid),public.list_following(text,int,int,uuid) from public,anon,authenticated;
grant execute on function public.set_follow(text,uuid,boolean,uuid),public.list_following(text,int,int,uuid) to authenticated;
notify pgrst, 'reload schema';
