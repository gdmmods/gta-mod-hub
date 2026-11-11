-- One namespace for current and retired handles. Historical names cannot be reused.
lock table public.profiles in share row exclusive mode;

create function private.valid_identity_handle(p_handle text) returns boolean
language sql immutable set search_path='' as $$
  select coalesce(p_handle collate "C" ~ '^[A-Za-z0-9][A-Za-z0-9_.-]{2,31}$',false)
$$;

create function private.reserved_identity_handle(p_handle text) returns boolean
language sql immutable set search_path='' as $$
  select p_handle like 'modvault%' or p_handle in (
    'admin','administrator','api','auth','help','login','logout','moderator','official','root',
    'security','settings','staff','support','system','account','activity','creator','creators',
    'dashboard','discussions','following','mods','profile','register','search','team','teams','upload'
  )
$$;

do $$
begin
  if exists(select 1 from public.profiles where username is not null and
    (not private.valid_identity_handle(username) or private.reserved_identity_handle(lower(username collate "C")))) then
    raise exception 'Existing usernames include an invalid or reserved handle. Resolve explicitly before applying.';
  end if;
  if exists(select 1 from public.profiles where username is not null group by lower(username collate "C") having count(*)>1) then
    raise exception 'Existing usernames collide case-insensitively. Resolve explicitly before applying.';
  end if;
end $$;

create table private.identity_handles (
  handle text not null check (private.valid_identity_handle(handle) and not private.reserved_identity_handle(lower(handle collate "C"))),
  normalized text collate "C" generated always as (lower(handle collate "C")) stored primary key,
  user_id uuid references public.profiles(id) on delete set null,
  creator_id uuid references public.creators(id) on delete set null,
  claimed_at timestamptz not null default now(),
  retired_at timestamptz,
  check (num_nonnulls(user_id,creator_id)=1 or
    (retired_at is not null and num_nonnulls(user_id,creator_id)=0))
);
create unique index identity_handles_active_user on private.identity_handles(user_id)
  where retired_at is null and user_id is not null;
create unique index identity_handles_active_creator on private.identity_handles(creator_id)
  where retired_at is null and creator_id is not null;
create index identity_handles_user_fk on private.identity_handles(user_id) where user_id is not null;
create index identity_handles_creator_fk on private.identity_handles(creator_id) where creator_id is not null;
alter table private.identity_handles enable row level security;
revoke all on private.identity_handles from public,anon,authenticated;

insert into private.identity_handles(handle,user_id)
select username,id from public.profiles where username is not null;

-- The username remains the stable /profile route; the active handle can change independently.
create function private.sync_profile_username_handle() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' and old.username is not null then
    if new.username is distinct from old.username then
      raise exception 'Your profile username is permanent. Change your public handle instead.' using errcode='22023';
    end if;
    return new;
  end if;
  if new.username is null then return new; end if;
  if not private.valid_identity_handle(new.username) or new.username<>lower(new.username collate "C")
    or private.reserved_identity_handle(new.username) then
    raise exception 'Choose a valid, non-reserved username.' using errcode='22023';
  end if;
  insert into private.identity_handles(handle,user_id) values(new.username,new.id);
  return new;
end $$;
create trigger sync_profile_username_handle after insert or update of username on public.profiles
for each row execute function private.sync_profile_username_handle();

create function private.retire_deleted_identity_handles() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='profiles' then
    update private.identity_handles set retired_at=now() where user_id=old.id and retired_at is null;
  else
    update private.identity_handles set retired_at=now() where creator_id=old.id and retired_at is null;
  end if;
  return old;
end $$;
create trigger retire_profile_handles before delete on public.profiles
for each row execute function private.retire_deleted_identity_handles();
create trigger retire_creator_handles before delete on public.creators
for each row execute function private.retire_deleted_identity_handles();

create function public.get_creator_handle(p_creator uuid) returns text
language sql stable security definer set search_path='' as $$
  select h.handle from private.identity_handles h where h.creator_id=p_creator and h.retired_at is null
$$;

create function public.get_personal_handle(p_username text) returns text
language sql stable security definer set search_path='' as $$
  select h.handle from public.profiles p join private.identity_handles h on h.user_id=p.id
  where p.username=p_username and h.retired_at is null
$$;

create function public.identity_handle_availability(p_handle text) returns text
language sql stable security definer set search_path='' as $$
  select case when auth.uid() is null then 'unavailable'
    when not private.valid_identity_handle(p_handle) then 'invalid'
    when private.reserved_identity_handle(lower(p_handle collate "C")) then 'reserved'
    when exists(select 1 from private.identity_handles h where h.normalized=lower(p_handle collate "C")) then 'unavailable'
    else 'available' end
$$;

create function public.set_identity_handle(p_creator uuid,p_handle text) returns text
language plpgsql security definer set search_path='' as $$
declare
  account uuid := auth.uid();
  candidate text := lower(btrim(p_handle) collate "C");
  existing text;
  claimed text;
begin
  if account is null then raise exception 'Sign in to manage a handle.' using errcode='42501'; end if;
  if not private.valid_identity_handle(candidate) then
    raise exception 'Use 3–32 characters, starting with a letter or number.' using errcode='22023';
  end if;
  if private.reserved_identity_handle(candidate) then
    raise exception 'This handle is reserved.' using errcode='22023';
  end if;

  if p_creator is null then
    perform 1 from public.profiles where id=account and username is not null for update;
    if not found then raise exception 'Set your profile username before changing your handle.' using errcode='42501'; end if;
  else
    -- Serialize claims per identity and lock team lifecycle state against archive.
    perform 1 from public.creators where id=p_creator for update;
    if not found then raise exception 'Creator identity unavailable.' using errcode='42501'; end if;
    perform private.require_operational_creator(p_creator);
    perform 1
    from public.creators c
    left join public.teams t on c.owner_type='team' and t.id=c.team_id and t.creator_id=c.id
    join public.creators owner on owner.id=case when c.owner_type='team' then t.owner_id else c.id end
    join public.creator_members cm on cm.creator_id=owner.id and cm.profile_id=account
    where c.id=p_creator and owner.owner_type='user' and owner.owner_id=account
      and cm.role='owner' and cm.status='approved'
    for share of owner,cm;
    if not found or not private.announcement_owner(p_creator,account) then
      raise exception 'Only the verified creator or team owner can manage this handle.' using errcode='42501';
    end if;
  end if;

  select h.handle into existing from private.identity_handles h where h.retired_at is null
    and ((p_creator is null and h.user_id=account) or h.creator_id=p_creator);
  if existing is not null and lower(existing collate "C")=candidate then return existing; end if;

  update private.identity_handles h set retired_at=now() where h.retired_at is null
    and ((p_creator is null and h.user_id=account) or h.creator_id=p_creator);
  insert into private.identity_handles(handle,user_id,creator_id)
  values(candidate,case when p_creator is null then account end,p_creator)
  on conflict (normalized) do nothing returning handle into claimed;
  if claimed is null then raise exception 'This handle is already in use or was previously reserved.' using errcode='23505'; end if;
  return claimed;
end $$;

-- Keep the same entity UUID, legacy display label and destination for stored references.
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
  where m.status='published' and m.visibility in ('public','early_access') and nullif(btrim(m.title),'') is not null;

create or replace function private.search_discussion_references(p_trigger text,p_query text) returns jsonb
language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(to_jsonb(r)),'[]') from (
    select e.kind,e.id,e.label,e.avatar,e.context from private.reference_entities e
    left join public.profiles p on e.kind='user' and p.id=e.id
    where auth.uid() is not null and p_trigger in ('@','#') and (e.kind='mod')=(p_trigger='#')
      and char_length(p_query) between 0 and 100
      and (strpos(lower(e.label),lower(p_query))>0 or strpos(lower(e.context),lower(p_query))>0
        or strpos(lower(p.username),lower(p_query))>0)
    order by coalesce(p_trigger='@' and lower(e.context)=lower(p_query),false) desc,
      (lower(e.label)=lower(p_query)) desc,(strpos(lower(e.label),lower(p_query))=1) desc,
      lower(e.label),e.kind,e.id
    limit 10
  ) r
$$;

revoke all on function private.valid_identity_handle(text),private.reserved_identity_handle(text),
  private.sync_profile_username_handle(),private.retire_deleted_identity_handles() from public,anon,authenticated;
revoke all on function public.get_creator_handle(uuid),public.get_personal_handle(text),
  public.identity_handle_availability(text),public.set_identity_handle(uuid,text) from public,anon,authenticated;
grant execute on function public.get_creator_handle(uuid),public.get_personal_handle(text) to anon,authenticated;
grant execute on function public.identity_handle_availability(text),public.set_identity_handle(uuid,text) to authenticated;
notify pgrst, 'reload schema';
