-- Creator and mod subscriptions share one private, account-scoped relation.
create table private.follows (
  account_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid references public.creators(id) on delete cascade,
  mod_id uuid references public.mods(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(creator_id, mod_id) = 1)
);
create unique index follows_creator_account on private.follows(creator_id, account_id) where creator_id is not null;
create unique index follows_mod_account on private.follows(mod_id, account_id) where mod_id is not null;
create index follows_account_date on private.follows(account_id, created_at desc);
alter table private.follows enable row level security;

create table private.announcements (
  id uuid primary key,
  author_account_id uuid references public.profiles(id) on delete set null,
  creator_id uuid not null references public.creators(id) on delete cascade,
  mod_id uuid references public.mods(id) on delete cascade,
  kind text not null check (kind in ('announcement','version')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 5000),
  version text check (char_length(version) between 1 and 40),
  notified boolean not null,
  published_at timestamptz not null default now(),
  edited_at timestamptz,
  archived_at timestamptz,
  check ((kind <> 'version' or mod_id is not null) and (version is null or kind = 'version'))
);
create index announcements_creator_date on private.announcements(creator_id,published_at desc,id) where mod_id is null and archived_at is null;
create index announcements_mod_date on private.announcements(mod_id,published_at desc,id) where archived_at is null;
alter table private.announcements enable row level security;
revoke all on private.follows, private.announcements from public,anon,authenticated;

create function private.follow_public_mod(m public.mods) returns boolean
language sql stable set search_path='' as $$
  select coalesce(m.status='published' and m.visibility='public'
    and m.release_state='public',false)
$$;

create function private.follow_owns_mod(p_mod uuid, p_account uuid) returns boolean
language sql stable set search_path='' as $$
  select exists (
    select 1 from public.mods m where m.id=p_mod and (
      private.discussion_owner(m.creator_id)=p_account or exists (
        select 1 from public.mod_creators mc where mc.mod_id=m.id and mc.role='owner'
          and private.discussion_owner(mc.creator_id)=p_account
      )
    )
  )
$$;

create function private.follow_target(p_kind text,p_id uuid,p_account uuid) returns boolean
language sql stable set search_path='' as $$
  select case p_kind
    when 'creator' then public.is_creator_operational(p_id) and (p_account is null or private.discussion_owner(p_id) is distinct from p_account)
    when 'mod' then exists (select 1 from public.mods m where m.id=p_id
      and private.follow_public_mod(m) and (m.creator_id is null or public.is_creator_operational(m.creator_id)))
      and not private.follow_owns_mod(p_id,p_account)
    else false end
$$;

create function public.follow_state(p_kind text,p_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'following',coalesce(bool_or(f.account_id=auth.uid()),false),
    'count',count(*),
    'canFollow',private.follow_target(p_kind,p_id,auth.uid()),
    'signedIn',auth.uid() is not null
  )
  from private.follows f
  where (p_kind='creator' and f.creator_id=p_id and private.discussion_owner(p_id) is distinct from f.account_id)
     or (p_kind='mod' and f.mod_id=p_id and not private.follow_owns_mod(p_id,f.account_id)
       and exists(select 1 from public.mods m where m.id=p_id and private.follow_public_mod(m)))
$$;

create function public.set_follow(p_kind text,p_id uuid,p_follow boolean) returns boolean
language plpgsql security definer set search_path='' as $$
declare account uuid := auth.uid();
begin
  if account is null or not exists(select 1 from public.profiles where id=account) then
    raise exception 'Sign in to manage your follows.' using errcode='42501';
  end if;
  if p_kind is null or p_kind not in ('creator','mod') or p_id is null or p_follow is null then
    raise exception 'Invalid follow target.' using errcode='22023';
  end if;
  if not p_follow then
    delete from private.follows f where f.account_id=account
      and (case p_kind when 'creator' then f.creator_id else f.mod_id end)=p_id;
    return false;
  end if;
  if not private.follow_target(p_kind,p_id,account) then
    raise exception 'You cannot follow this profile or mod.' using errcode='42501';
  end if;
  insert into private.follows(account_id,creator_id,mod_id)
  values(account,case when p_kind='creator' then p_id end,case when p_kind='mod' then p_id end)
  on conflict do nothing;
  return true;
end $$;

create function public.list_following(p_kind text,p_limit int default 24,p_offset int default 0)
returns table(id uuid,name text,image text,attribution text,available boolean)
language sql stable security definer set search_path='' as $$
  select coalesce(f.creator_id,f.mod_id),coalesce(c.name,m.title),
    coalesce(c.avatar,m.image),coalesce(mc.name,m.creator),c.id is not null or m.id is not null
  from private.follows f
  left join public.creators c on c.id=f.creator_id
  left join public.mods m on m.id=f.mod_id and private.follow_public_mod(m)
  left join public.creators mc on mc.id=m.creator_id
  where f.account_id=auth.uid() and ((p_kind='creator' and f.creator_id is not null)
    or (p_kind='mod' and f.mod_id is not null))
  order by f.created_at desc,coalesce(f.creator_id,f.mod_id)
  limit least(greatest(p_limit,1),100) offset greatest(p_offset,0)
$$;

-- Existing team ownership and approved owner membership determine publishing rights.
create function private.announcement_owner(p_creator uuid,p_account uuid) returns boolean
language sql stable set search_path='' as $$
  select p_account is not null and exists (
    select 1 from public.creators c
    left join public.teams t on t.id=c.team_id and t.creator_id=c.id and t.status='active'
    join public.creators owner on owner.id=case when c.owner_type='team' then t.owner_id else c.id end
    join public.creator_members cm on cm.creator_id=owner.id and cm.profile_id=p_account
    where c.id=p_creator and owner.owner_type='user' and owner.owner_id=p_account
      and cm.role='owner' and cm.status='approved'
      and (c.owner_type='user' or (c.owner_type='team' and c.owner_id=t.id))
  )
$$;

create function private.announcement_creator(p_target uuid,p_mod boolean,p_account uuid) returns uuid
language sql stable set search_path='' as $$
  select case when not p_mod then
    case when private.announcement_owner(p_target,p_account) then p_target end
  else (
    select owner.creator_id from public.mods m cross join lateral (
      select m.creator_id,0 priority
      union all select mc.creator_id,1 from public.mod_creators mc where mc.mod_id=m.id and mc.role='owner'
    ) owner
    where m.id=p_target and private.follow_public_mod(m)
      and (m.creator_id is null or public.is_creator_operational(m.creator_id))
      and private.announcement_owner(owner.creator_id,p_account)
    order by owner.priority,owner.creator_id limit 1
  ) end
$$;

create function public.list_announcements(p_target uuid,p_mod boolean,p_limit int default 12,p_offset int default 0,p_focus uuid default null)
returns jsonb language sql stable security definer set search_path='' as $$
  with access as (
    select private.announcement_creator(p_target,p_mod,auth.uid()) creator_id
  ), items as (
    select a.id,a.kind,a.title,a.body,a.version,c.name author,a.published_at,a.edited_at,
      case when access.creator_id is not null then a.notified end notified
    from private.announcements a
    join public.creators c on c.id=a.creator_id
    cross join access
    where a.archived_at is null and (
      (not p_mod and a.creator_id=p_target and a.mod_id is null) or
      (p_mod and a.mod_id=p_target and exists(select 1 from public.mods m where m.id=p_target and private.follow_public_mod(m)))
    ) and (p_focus is null or a.id=p_focus)
    order by a.published_at desc,a.id desc
    limit least(greatest(p_limit,1),51) offset greatest(p_offset,0)
  )
  select jsonb_build_object('canPublish',access.creator_id is not null,
    'items',coalesce((select jsonb_agg(to_jsonb(items) order by published_at desc,id desc) from items),'[]'::jsonb))
  from access
$$;

-- The canonical event is keyed by its underlying publication, independent of recipients.
create unique index following_activity_event_key on public.activity_events(event_type,(metadata->>'followingEventId'))
where metadata ? 'followingEventId';

create function private.guard_following_activity() returns trigger
language plpgsql set search_path='' as $$
begin
  if current_user not in ('postgres','supabase_admin') and
    (new.event_type in ('creator_announcement','mod_version_update','mod_announcement')
      or new.metadata ? 'followingEventId'
      or (tg_op='UPDATE' and old.metadata ? 'followingEventId')) then
    raise exception 'Follower activity is generated by publication only.' using errcode='42501';
  end if;
  return new;
end $$;
create trigger guard_following_activity before insert or update on public.activity_events
for each row execute function private.guard_following_activity();

create function private.notify_followers(p_event text,p_key uuid,p_actor uuid,p_creator uuid,p_mod uuid,p_title text)
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
  select distinct f.account_id,event_id from private.follows f
  where ((creator_audience and f.creator_id=p_creator) or (not creator_audience and f.mod_id=p_mod))
    and f.account_id is distinct from p_actor
    and f.account_id is distinct from private.discussion_owner(p_creator)
    and (p_mod is null or not private.follow_owns_mod(p_mod,f.account_id));
end $$;

create function public.write_announcement(p_action text,p_target uuid,p_mod boolean,p_id uuid,
  p_kind text default null,p_title text default null,p_body text default null,p_version text default null,p_notify boolean default false)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  account uuid := auth.uid();
  creator uuid;
  primary_creator uuid;
  saved uuid;
begin
  if account is null or p_mod is null or p_target is null or p_id is null then
    raise exception 'Invalid announcement request.' using errcode='42501';
  end if;
  if p_mod then
    select m.creator_id into primary_creator from public.mods m
    where m.id=p_target and private.follow_public_mod(m) for share;
    if not found then raise exception 'This mod is unavailable.' using errcode='42501'; end if;
  end if;
  creator := private.announcement_creator(p_target,p_mod,account);
  if creator is null then
    raise exception 'You do not have permission to manage these announcements.' using errcode='42501';
  end if;
  if primary_creator is not null and primary_creator<>creator then
    perform private.require_operational_creator(primary_creator);
  end if;
  perform private.require_operational_creator(creator);

  if p_action='publish' then
    insert into private.announcements(id,author_account_id,creator_id,mod_id,kind,title,body,version,notified)
    values(p_id,account,creator,case when p_mod then p_target end,p_kind,btrim(p_title),btrim(p_body),
      nullif(btrim(p_version),''),coalesce(p_notify,false))
    on conflict(id) do nothing returning id into saved;
    if saved is null then
      select id into saved from private.announcements where id=p_id and author_account_id=account
        and creator_id=creator and mod_id is not distinct from (case when p_mod then p_target end);
      if saved is null then raise exception 'Publication identifier unavailable.' using errcode='42501'; end if;
    elsif p_notify then
      perform private.notify_followers(case when not p_mod then 'creator_announcement'
        when p_kind='version' then 'mod_version_update' else 'mod_announcement' end,
        saved,account,creator,case when p_mod then p_target end,btrim(p_title));
    end if;
  elsif p_action in ('edit','archive') then
    update private.announcements a set
      title=case when p_action='edit' then btrim(p_title) else a.title end,
      body=case when p_action='edit' then btrim(p_body) else a.body end,
      version=case when p_action='edit' then nullif(btrim(p_version),'') else a.version end,
      edited_at=case when p_action='edit' then now() else a.edited_at end,
      archived_at=case when p_action='archive' then now() else a.archived_at end
    where a.id=p_id and a.archived_at is null
      and ((p_mod and a.mod_id=p_target) or (not p_mod and a.creator_id=p_target and a.mod_id is null))
    returning a.id into saved;
    if saved is null then raise exception 'Announcement unavailable.' using errcode='42501'; end if;
  else
    raise exception 'Invalid announcement action.' using errcode='22023';
  end if;
  return saved;
end $$;

-- New drafts, including Discovery imports, can opt in on their first public save.
-- Existing rows start with no pending publication and cannot be enrolled retroactively.
alter table public.mods
  add column notify_followers_on_publication boolean,
  add column first_publication_pending boolean not null default false;

create function private.guard_publication_choice() returns trigger
language plpgsql set search_path='' as $$
declare is_public boolean := coalesce(new.status='published' and new.visibility='public'
  and new.release_state='public',false);
begin
  if tg_op='INSERT' then
    if new.notify_followers_on_publication is not null and current_user <> 'service_role' then
      raise exception 'Initial follower notification choice is set during upload.' using errcode='42501';
    end if;
    new.first_publication_pending := not is_public;
  else
    if new.notify_followers_on_publication is distinct from old.notify_followers_on_publication
      and not (old.first_publication_pending and is_public and auth.uid() is not null
        and new.creator_id is not distinct from old.creator_id) then
      raise exception 'Follower notification choice may only change on first publication.' using errcode='42501';
    end if;
    new.first_publication_pending := old.first_publication_pending and not is_public;
  end if;
  return new;
end $$;
create trigger guard_publication_choice before insert or update on public.mods
for each row execute function private.guard_publication_choice();

create function private.notify_mod_publication() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.notify_followers_on_publication is true and private.follow_public_mod(new)
    and new.creator_id is not null and public.is_creator_operational(new.creator_id)
    and (tg_op='INSERT' or old.first_publication_pending) then
    perform private.notify_followers('mod_published',new.id,coalesce(auth.uid(),new.created_by),
      new.creator_id,new.id,new.title);
  end if;
  return new;
end $$;
create trigger notify_mod_publication after insert or update of status,visibility,release_state on public.mods
for each row execute function private.notify_mod_publication();

revoke all on function private.follow_public_mod(public.mods), private.follow_owns_mod(uuid,uuid),
  private.follow_target(text,uuid,uuid), private.announcement_owner(uuid,uuid),
  private.announcement_creator(uuid,boolean,uuid), private.guard_following_activity(),
  private.notify_followers(text,uuid,uuid,uuid,uuid,text), private.guard_publication_choice(),
  private.notify_mod_publication() from public,anon,authenticated;
revoke all on function public.follow_state(text,uuid),public.set_follow(text,uuid,boolean),
  public.list_following(text,int,int),public.list_announcements(uuid,boolean,int,int,uuid),
  public.write_announcement(text,uuid,boolean,uuid,text,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.follow_state(text,uuid),public.list_announcements(uuid,boolean,int,int,uuid) to anon,authenticated;
grant execute on function public.set_follow(text,uuid,boolean),public.list_following(text,int,int),
  public.write_announcement(text,uuid,boolean,uuid,text,text,text,text,boolean) to authenticated;

-- The authenticated server upload route supplies an allowlisted payload and the
-- verified publishing account. Attribution and notification commit with the mod.
create function public.publish_uploaded_mod(p_id uuid,p_payload jsonb,p_collaborators uuid[])
returns uuid language plpgsql set search_path='' as $$
declare
  m public.mods := jsonb_populate_record(null::public.mods,p_payload);
  saved uuid;
begin
  insert into public.mods(id,title,
    category,
    description,
    creator,
    image,
    images,
    source_url,
    download_url,
    creator_backup_url,
    features,
    requirements,
    notes,
    credits,
    visibility,
    delivery_mode,
    support_url,
    external_purchase_url,
    ownership_required,
    release_state,
    is_paid,
    price,
    creator_id,
    created_by,
    downloads,
    likes,
    verified,
    status,
    notify_followers_on_publication)
  values(p_id,m.title,
    m.category,
    m.description,
    m.creator,
    m.image,
    m.images,
    m.source_url,
    m.download_url,
    m.creator_backup_url,
    m.features,
    m.requirements,
    m.notes,
    m.credits,
    coalesce(m.visibility,'public'),
    coalesce(m.delivery_mode,'external'),
    m.support_url,
    m.external_purchase_url,
    coalesce(m.ownership_required,false),
    coalesce(m.release_state,'public'),
    coalesce(m.is_paid,false),
    coalesce(m.price,0),
    m.creator_id,
    m.created_by,
    m.downloads,
    m.likes,
    m.verified,
    coalesce(m.status,'published'),
    m.notify_followers_on_publication)
  on conflict(id) do nothing returning id into saved;
  if saved is null then
    select id into saved from public.mods
    where id=p_id and created_by=m.created_by and creator_id=m.creator_id;
    if saved is null then raise exception 'Upload identifier unavailable.' using errcode='42501'; end if;
    return saved;
  end if;

  insert into public.mod_creators(mod_id,creator_id,role)
  values(saved,m.creator_id,'owner');
  insert into public.mod_creators(mod_id,creator_id,role)
  select saved,c,'collaborator' from (select distinct unnest(p_collaborators) c) collaborators
  where c<>m.creator_id;
  return saved;
end $$;
revoke all on function public.publish_uploaded_mod(uuid,jsonb,uuid[]) from public,anon,authenticated;
grant execute on function public.publish_uploaded_mod(uuid,jsonb,uuid[]) to service_role;

notify pgrst, 'reload schema';
