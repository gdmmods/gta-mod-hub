-- Existing identities are grandfathered. New identities claim their handle in
-- the same transaction that creates the profile.
create function public.signup_handle_availability(p_handle text) returns text
language sql stable security definer set search_path='' as $$
  select case when not private.valid_identity_handle(p_handle) then 'invalid'
    when private.reserved_identity_handle(lower(p_handle collate "C")) then 'reserved'
    when exists(select 1 from private.identity_handles h where h.normalized=lower(p_handle collate "C")) then 'unavailable'
    else 'available' end
$$;
revoke all on function public.signup_handle_availability(text) from public,anon,authenticated;
grant execute on function public.signup_handle_availability(text) to anon,authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,username)
  values(new.id,lower(btrim(new.raw_user_meta_data->>'handle') collate "C"));
  return new;
end $$;

create function private.require_new_identity_handle() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='profiles' then
    if new.username is null then
      raise exception 'A public handle is required to create a user profile.' using errcode='22023';
    end if;
  elsif tg_table_name='creators' then
    if exists(select 1 from public.creators c where c.id=new.id)
      and not exists(select 1 from private.identity_handles h where h.creator_id=new.id and h.retired_at is null) then
      raise exception 'A public handle is required to create a creator profile.' using errcode='22023';
    end if;
  elsif exists(select 1 from public.teams t where t.id=new.id)
    and not exists(
      select 1 from public.teams t
      join public.creators c on c.id=t.creator_id and c.team_id=t.id and c.owner_id=t.id and c.owner_type='team'
      join private.identity_handles h on h.creator_id=c.id and h.retired_at is null
      where t.id=new.id
    ) then
    raise exception 'A new team requires a team creator profile with a public handle.' using errcode='22023';
  end if;
  return new;
end $$;
revoke all on function private.require_new_identity_handle() from public,anon,authenticated;
create trigger require_new_profile_handle before insert on public.profiles
for each row execute function private.require_new_identity_handle();
create constraint trigger require_new_creator_handle after insert on public.creators
deferrable initially deferred for each row execute function private.require_new_identity_handle();
create constraint trigger require_new_team_handle after insert on public.teams
deferrable initially deferred for each row execute function private.require_new_identity_handle();

create function public.create_identity_with_handle(
  p_handle text,p_name text,p_tagline text,p_bio text,p_games uuid[],p_expected_founder uuid
) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  account uuid := auth.uid();
  candidate text := lower(btrim(p_handle) collate "C");
  creator_name text := btrim(p_name);
  founder uuid;
  team uuid;
  creator uuid;
  slug text;
begin
  if account is null then raise exception 'Sign in to create an identity.' using errcode='42501'; end if;
  select p.default_creator_id into founder from public.profiles p where p.id=account for share;
  if not found then raise exception 'Your personal profile is unavailable.' using errcode='42501'; end if;

  if creator_name is null or creator_name='' then raise exception 'Enter a name.' using errcode='22023'; end if;
  if not private.valid_identity_handle(candidate) or private.reserved_identity_handle(candidate) then
    raise exception 'Choose a valid, non-reserved handle.' using errcode='22023';
  end if;

  if p_expected_founder is not null then
    if founder is distinct from p_expected_founder then
      raise exception 'Your selected identity changed. Choose your personal creator and try again.' using errcode='42501';
    end if;
    perform 1 from public.creators c join public.creator_members cm on cm.creator_id=c.id
    where c.id=founder and c.owner_type='user' and c.owner_id=account and cm.profile_id=account
      and cm.status='approved' and cm.role='owner'
    for share of c,cm;
    if not found then raise exception 'Choose an approved personal creator you own.' using errcode='42501'; end if;
    slug := regexp_replace(lower(creator_name),'[^a-z0-9]+','-','g');
    insert into public.teams(name,slug,owner_id) values(creator_name,slug,founder) returning id into team;
  end if;

  insert into public.creators(name,tagline,bio,status,owner_type,owner_id,creator_type,team_id,games)
  values(creator_name,p_tagline,p_bio,'active',case when team is null then 'user' else 'team' end,
    coalesce(team,account),case when team is null then 'creator' else 'team' end,team,coalesce(p_games,'{}'))
  returning id into creator;

  if team is not null then update public.teams set creator_id=creator where id=team; end if;
  insert into public.creator_members(creator_id,profile_id,role,status,verified)
  values(creator,account,'owner','approved',true);
  insert into private.identity_handles(handle,creator_id)
  values(candidate,creator) on conflict (normalized) do nothing;
  if not found then raise exception 'This handle is already in use or was previously reserved.' using errcode='23505'; end if;

  if team is null then
    insert into public.creator_aliases(creator_id,alias) values(creator,creator_name) on conflict do nothing;
  else
    insert into public.activity_events(event_type,actor_type,actor_id,target_type,target_id,visibility,title,summary,metadata)
    values('team_created','creator',creator,'team',team,'public','Team created',
      creator_name || ' created the team ' || creator_name || '.',
      jsonb_build_object('creatorName',creator_name,'teamName',creator_name));
  end if;
  return creator;
end $$;

revoke all on function public.create_identity_with_handle(text,text,text,text,uuid[],uuid) from public,anon,authenticated;
grant execute on function public.create_identity_with_handle(text,text,text,text,uuid[],uuid) to authenticated;
notify pgrst, 'reload schema';
