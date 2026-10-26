-- Simplify team membership around teams.owner_id and non-owner team_members.
-- This is a local forward migration only; review and apply through the normal
-- migration workflow after the team data reconciliation has been approved.

create or replace function public.set_team_membership(
  p_team_id uuid,
  p_creator_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  team_row public.teams%rowtype;
  membership_row_id uuid;
  active_rows integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_team_id is null or p_creator_id is null or p_action is null
    or p_action not in ('join', 'leave', 'remove') then
    raise exception 'Unsupported membership action' using errcode = '22023';
  end if;

  select * into team_row from public.teams where id = p_team_id for update;
  if team_row.id is null then
    raise exception 'Team not found' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_team_id::text || ':' || p_creator_id::text, 0)
  );

  if p_action in ('join', 'leave') then
    if not exists (
      select 1
      from public.creators c
      join public.creator_members cm on cm.creator_id = c.id
      where c.id = p_creator_id
        and c.owner_type = 'user'
        and c.owner_id = auth.uid()
        and cm.profile_id = auth.uid()
        and cm.role = 'owner'
        and cm.status = 'approved'
    ) then
      raise exception 'You must control this creator profile' using errcode = '42501';
    end if;
    if team_row.owner_id = p_creator_id then
      raise exception 'The team owner is not a team member' using errcode = '22023';
    end if;
    if exists (select 1 from public.team_members tm where tm.team_id=p_team_id
      and tm.creator_id=p_creator_id and tm.role='owner' and tm.left_at is null
      and coalesce(tm.membership_status,'active')='active') then
      raise exception 'Legacy owner membership must be reconciled before changing membership' using errcode='55000';
    end if;
    if p_action = 'join' and team_row.status is distinct from 'active' then
      raise exception 'Team is not active' using errcode = '22023';
    end if;
  else
    if not exists (
      select 1
      from public.creators c
      join public.creator_members cm on cm.creator_id = c.id
      where c.id = team_row.owner_id
        and c.owner_type = 'user'
        and c.owner_id = auth.uid()
        and cm.profile_id = auth.uid()
        and cm.role = 'owner'
        and cm.status = 'approved'
    ) then
      raise exception 'Only the team owner can remove members' using errcode = '42501';
    end if;
    if p_creator_id = team_row.owner_id then
      raise exception 'The team owner cannot be removed as a member' using errcode = '22023';
    end if;
    if exists (select 1 from public.team_members tm where tm.team_id=p_team_id
      and tm.creator_id=p_creator_id and tm.role='owner' and tm.left_at is null
      and coalesce(tm.membership_status,'active')='active') then
      raise exception 'Legacy owner membership must be reconciled before removal' using errcode='55000';
    end if;
  end if;

  if p_action = 'join' then
    select count(*) into active_rows
    from public.team_members tm
    where tm.team_id = p_team_id and tm.creator_id = p_creator_id
      and tm.left_at is null and coalesce(tm.membership_status, 'active') = 'active';
    if active_rows > 1 then
      raise exception 'Duplicate active memberships require owner review' using errcode = '23505';
    elsif active_rows = 1 then
      return jsonb_build_object('status', 'already_member');
    end if;

    select tm.id into membership_row_id
    from public.team_members tm
    where tm.team_id = p_team_id and tm.creator_id = p_creator_id
    order by tm.joined_at desc
    limit 1
    for update;

    if membership_row_id is null then
      insert into public.team_members (
        team_id, creator_id, role, membership_status,
        can_upload, can_manage_members, can_manage_team
      ) values (p_team_id, p_creator_id, 'member', 'active', false, false, false);
    else
      update public.team_members
      set role = 'member', membership_status = 'active', joined_at = now(), left_at = null,
          removed_at = null, removed_by = null, leave_reason = null,
          can_upload = false, can_manage_members = false, can_manage_team = false
      where id = membership_row_id;
    end if;
    return jsonb_build_object('status', 'joined');
  elsif p_action = 'leave' then
    update public.team_members
    set membership_status = 'left', left_at = now(), removed_at = null,
        removed_by = null, leave_reason = 'member_left',
        can_upload = false, can_manage_members = false, can_manage_team = false
    where team_id = p_team_id and creator_id = p_creator_id
      and left_at is null and coalesce(membership_status, 'active') = 'active';
    if not found then
      return jsonb_build_object('status', 'not_member');
    end if;
    return jsonb_build_object('status', 'left');
  else
    update public.team_members
    set membership_status = 'removed', left_at = now(), removed_at = now(),
        removed_by = auth.uid(), leave_reason = null,
        can_upload = false, can_manage_members = false, can_manage_team = false
    where team_id = p_team_id and creator_id = p_creator_id
      and left_at is null and coalesce(membership_status, 'active') = 'active';
    if not found then
      return jsonb_build_object('status', 'not_member');
    end if;
    return jsonb_build_object('status', 'removed');
  end if;
end;
$$;

create or replace function public.get_team_members_for_owner(p_team_id uuid)
returns table(creator_id uuid, creator_name text, creator_avatar text, joined_at timestamptz)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.teams t
    join public.creators c on c.id = t.owner_id
    join public.creator_members cm on cm.creator_id = c.id
    where t.id = p_team_id
      and c.owner_type = 'user'
      and c.owner_id = auth.uid()
      and cm.profile_id = auth.uid()
      and cm.role = 'owner'
      and cm.status = 'approved'
  ) then
    raise exception 'Only the team owner can view team controls' using errcode = '42501';
  end if;

  return query
  select c.id, c.name, c.avatar, tm.joined_at
  from public.team_members tm
  join public.creators c on c.id = tm.creator_id
  where tm.team_id = p_team_id
    and tm.creator_id <> (select t.owner_id from public.teams t where t.id = p_team_id)
    and tm.left_at is null
    and coalesce(tm.membership_status, 'active') = 'active'
  order by tm.joined_at, c.name;
end;
$$;

-- Public roster exposes only public creator fields. Ownership comes from the
-- team's owner_id; team_members contains only non-owner memberships.
drop function if exists public.get_public_team_members(uuid);
create function public.get_public_team_members(p_team_id uuid)
returns table(creator_id uuid, creator_name text, creator_avatar text, public_role text)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select roster.creator_id, roster.creator_name, roster.creator_avatar, roster.public_role
  from (
    select c.id as creator_id, c.name as creator_name, c.avatar as creator_avatar, 'owner'::text as public_role
    from public.teams t
    join public.creators c on c.id = t.owner_id
    where t.id = p_team_id and t.status = 'active'
    union all
    select c.id as creator_id, c.name as creator_name, c.avatar as creator_avatar, 'member'::text as public_role
    from public.teams t
    join public.team_members tm on tm.team_id = t.id
    join public.creators c on c.id = tm.creator_id
    where t.id = p_team_id and t.status = 'active'
      and tm.creator_id <> t.owner_id
      and tm.left_at is null
      and coalesce(tm.membership_status, 'active') = 'active'
  ) roster
  order by case when roster.public_role = 'owner' then 0 else 1 end, roster.creator_name;
$$;

-- Narrow owner-invite and recipient-response RPCs; no role/capability checks.
create or replace function public.search_team_invite_creators(p_team_id uuid, p_query text)
returns table(creator_id uuid, creator_name text, creator_avatar text, verified boolean)
language plpgsql stable security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.teams t
    join public.creators owner_creator on owner_creator.id=t.owner_id
    join public.creator_members cm on cm.creator_id=owner_creator.id
    where t.id=p_team_id and t.status='active'
      and owner_creator.owner_type='user' and owner_creator.owner_id=auth.uid()
      and cm.profile_id=auth.uid() and cm.role='owner' and cm.status='approved'
  ) then raise exception 'Only the team owner can search invite candidates' using errcode='42501'; end if;
  if length(btrim(coalesce(p_query,''))) < 2 then return; end if;
  return query
  select c.id,c.name,c.avatar,c.verified from public.creators c
  where c.owner_type='user' and c.status='active'
    and c.id <> (select t.owner_id from public.teams t where t.id=p_team_id)
    and c.name ilike '%'||btrim(p_query)||'%'
    and exists (select 1 from public.creator_members cm where cm.creator_id=c.id
      and cm.profile_id=c.owner_id and cm.role='owner' and cm.status='approved')
    and not exists (select 1 from public.team_members tm where tm.team_id=p_team_id
      and tm.creator_id=c.id and tm.left_at is null and coalesce(tm.membership_status,'active')='active')
    and not exists (select 1 from public.invitations i where i.team_id=p_team_id
      and i.recipient_creator_id=c.id and i.invitation_type='team_invite'
      and i.status='pending' and i.expires_at>now())
  order by c.name limit 10;
end;
$$;

create or replace function public.get_team_invitations_for_owner(p_team_id uuid)
returns table(invitation_id uuid, recipient_creator_id uuid, recipient_name text,
  status text, message text, expires_at timestamptz, created_at timestamptz)
language plpgsql stable security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.teams t join public.creators c on c.id=t.owner_id
    join public.creator_members cm on cm.creator_id=c.id
    where t.id=p_team_id and c.owner_type='user' and c.owner_id=auth.uid()
      and cm.profile_id=auth.uid() and cm.role='owner' and cm.status='approved'
  ) then raise exception 'Only the team owner can view invitations' using errcode='42501'; end if;
  return query select i.id,i.recipient_creator_id,c.name,
    case when i.status='pending' and (i.expires_at is null or i.expires_at<=now()) then 'expired'
      when i.status='pending' and t.status<>'active' then 'team_unavailable' else i.status end,
    i.message,i.expires_at,i.created_at
    from public.invitations i join public.teams t on t.id=i.team_id
    left join public.creators c on c.id=i.recipient_creator_id
    where i.team_id=p_team_id and i.invitation_type='team_invite'
    order by i.created_at desc limit 50;
end;
$$;

create or replace function public.get_my_team_invitations()
returns table(invitation_id uuid, team_id uuid, team_name text, team_creator_id uuid,
  sender_name text, message text, status text, expires_at timestamptz, created_at timestamptz)
language plpgsql stable security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  return query select i.id,i.team_id,t.name,t.creator_id,s.name,i.message,
    case when i.status='pending' and (i.expires_at is null or i.expires_at<=now()) then 'expired'
      when i.status='pending' and t.status<>'active' then 'team_unavailable' else i.status end,
    i.expires_at,i.created_at
  from public.invitations i join public.teams t on t.id=i.team_id
  left join public.creators s on s.id=i.sender_creator_id
  where i.invitation_type='team_invite' and i.recipient_profile_id=auth.uid()
    and exists (select 1 from public.creators r join public.creator_members cm on cm.creator_id=r.id
      where r.id=i.recipient_creator_id and r.owner_type='user' and r.owner_id=auth.uid()
        and cm.profile_id=auth.uid() and cm.role='owner' and cm.status='approved')
  order by i.created_at desc limit 50;
end;
$$;

create or replace function public.create_team_invitation(
  p_team_id uuid, p_recipient_creator_id uuid, p_message text default null
)
returns public.invitations
language plpgsql security definer
set search_path = pg_catalog, public, auth
as $$
declare
  team_row public.teams%rowtype;
  recipient public.creators%rowtype;
  invitation_row public.invitations%rowtype;
  active_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into team_row from public.teams t where t.id=p_team_id and t.status='active'
    and exists (select 1 from public.creators c join public.creator_members cm on cm.creator_id=c.id
      where c.id=t.owner_id and c.owner_type='user' and c.owner_id=auth.uid()
        and cm.profile_id=auth.uid() and cm.role='owner' and cm.status='approved')
    for update;
  if team_row.id is null then raise exception 'Only the owner of an active team can invite creators' using errcode='42501'; end if;

  select * into recipient from public.creators c where c.id=p_recipient_creator_id
    and c.owner_type='user' and c.status='active' and c.owner_id is not null
    and exists (select 1 from public.creator_members cm where cm.creator_id=c.id
      and cm.profile_id=c.owner_id and cm.role='owner' and cm.status='approved');
  if recipient.id is null then raise exception 'Eligible creator profile not found' using errcode='22023'; end if;
  if recipient.owner_id=auth.uid() then raise exception 'Cannot invite your own creator profile' using errcode='22023'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_team_id::text||':'||recipient.id::text,0));
  select count(*) into active_count from public.team_members tm where tm.team_id=p_team_id
    and tm.creator_id=recipient.id and tm.left_at is null
    and coalesce(tm.membership_status,'active')='active';
  if active_count>0 then raise exception 'Creator is already a team member' using errcode='23505'; end if;
  if exists (select 1 from public.invitations i where i.team_id=p_team_id
    and i.recipient_creator_id=recipient.id and i.invitation_type='team_invite'
    and i.status='pending' and i.expires_at>now()) then
    raise exception 'A pending invitation already exists' using errcode='23505';
  end if;
  insert into public.invitations(invitation_type,status,sender_creator_id,recipient_creator_id,
    recipient_profile_id,team_creator_id,team_id,message,expires_at)
  values ('team_invite','pending',team_row.owner_id,recipient.id,recipient.owner_id,
    team_row.creator_id,team_row.id,nullif(btrim(coalesce(p_message,'')),''),now()+interval '14 days')
  returning * into invitation_row;
  return invitation_row;
end;
$$;

create or replace function public.respond_to_team_invitation(p_invitation_id uuid, p_accept boolean)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public, auth
as $$
declare
  invitation_row public.invitations%rowtype;
  team_row public.teams%rowtype;
  active_count integer;
  membership_row_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_accept is null then raise exception 'An accept or decline response is required' using errcode='22023'; end if;
  select * into invitation_row from public.invitations i
    where i.id=p_invitation_id and i.invitation_type='team_invite' for update;
  if invitation_row.id is null or invitation_row.recipient_profile_id<>auth.uid() then
    raise exception 'Invitation not found' using errcode='42501';
  end if;
  if not exists (select 1 from public.creators c join public.creator_members cm on cm.creator_id=c.id
    where c.id=invitation_row.recipient_creator_id and c.owner_type='user' and c.owner_id=auth.uid()
      and cm.profile_id=auth.uid() and cm.role='owner' and cm.status='approved') then
    raise exception 'You no longer control the invited creator profile' using errcode='42501';
  end if;
  if invitation_row.status<>'pending' then return jsonb_build_object('status',invitation_row.status); end if;
  if invitation_row.expires_at is null or invitation_row.expires_at<=now() then
    update public.invitations set status='expired' where id=invitation_row.id and status='pending';
    return jsonb_build_object('status','expired');
  end if;
  if not p_accept then
    update public.invitations set status='declined',rejected_at=now()
      where id=invitation_row.id and status='pending';
    return jsonb_build_object('status','declined');
  end if;
  select * into team_row from public.teams t where t.id=invitation_row.team_id for update;
  if team_row.id is null or team_row.status<>'active' then
    return jsonb_build_object('status','team_unavailable');
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    team_row.id::text||':'||invitation_row.recipient_creator_id::text,0));
  select count(*) into active_count from public.team_members tm
    where tm.team_id=team_row.id and tm.creator_id=invitation_row.recipient_creator_id
      and tm.left_at is null and coalesce(tm.membership_status,'active')='active';
  if active_count>1 then raise exception 'Duplicate active memberships require owner review' using errcode='23505'; end if;
  if active_count=0 then
    select tm.id into membership_row_id from public.team_members tm
      where tm.team_id=team_row.id and tm.creator_id=invitation_row.recipient_creator_id
      order by tm.joined_at desc limit 1 for update;
    if membership_row_id is null then
      insert into public.team_members(team_id,creator_id,role,membership_status,can_upload,can_manage_members,can_manage_team)
      values(team_row.id,invitation_row.recipient_creator_id,'member','active',false,false,false);
    else
      update public.team_members set role='member',membership_status='active',joined_at=now(),left_at=null,
        removed_at=null,removed_by=null,leave_reason=null,can_upload=false,can_manage_members=false,can_manage_team=false
      where id=membership_row_id;
    end if;
  end if;
  update public.invitations set status='accepted',accepted_at=now(),
    accepted_by_creator_id=invitation_row.recipient_creator_id
    where id=invitation_row.id and status='pending';
  return jsonb_build_object('status',case when active_count=0 then 'accepted' else 'already_member' end);
end;
$$;

revoke all on function public.set_team_membership(uuid, uuid, text) from public, anon;
grant execute on function public.set_team_membership(uuid, uuid, text) to authenticated;
revoke all on function public.get_team_members_for_owner(uuid) from public, anon;
grant execute on function public.get_team_members_for_owner(uuid) to authenticated;
revoke all on function public.get_public_team_members(uuid) from public;
grant execute on function public.get_public_team_members(uuid) to anon, authenticated;
revoke all on function public.search_team_invite_creators(uuid, text) from public, anon;
grant execute on function public.search_team_invite_creators(uuid, text) to authenticated;
revoke all on function public.get_team_invitations_for_owner(uuid) from public, anon;
grant execute on function public.get_team_invitations_for_owner(uuid) to authenticated;
revoke all on function public.get_my_team_invitations() from public, anon;
grant execute on function public.get_my_team_invitations() to authenticated;
revoke all on function public.create_team_invitation(uuid, uuid, text) from public, anon;
grant execute on function public.create_team_invitation(uuid, uuid, text) to authenticated;
revoke all on function public.respond_to_team_invitation(uuid, boolean) from public, anon;
grant execute on function public.respond_to_team_invitation(uuid, boolean) to authenticated;

-- Keep creator_members as the account-to-creator ownership proof, but remove
-- the live self-approval/update policies that would let a user claim another
-- creator or change their own role/status.
drop policy if exists "Creator members are viewable by everyone" on public.creator_members;
drop policy if exists "Users can create creator claims" on public.creator_members;
drop policy if exists "Users can update own memberships" on public.creator_members;
drop policy if exists "Users can view own creator memberships" on public.creator_members;
drop policy if exists "Users can add ownership membership for their creator" on public.creator_members;
revoke all on table public.creator_members from public, anon, authenticated;
grant select, insert on table public.creator_members to authenticated;
create policy "Users can view own creator memberships" on public.creator_members
  for select to authenticated using (profile_id = auth.uid());
create policy "Users can add verified ownership links" on public.creator_members
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and role = 'owner'
    and status = 'approved'
    and coalesce(verified, false) = true
    and (
      exists (
        select 1 from public.creators c
        where c.id = creator_members.creator_id
          and c.owner_type = 'user' and c.owner_id = auth.uid()
      )
      or exists (
        select 1
        from public.creators team_creator
        join public.teams t on t.creator_id = team_creator.id
        join public.creators owner_creator on owner_creator.id = t.owner_id
        where team_creator.id = creator_members.creator_id
          and team_creator.owner_type = 'team'
          and owner_creator.owner_type = 'user'
          and owner_creator.owner_id = auth.uid()
      )
    )
  );

create or replace function public.is_creator_managed(p_creator_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.creator_members cm
    where cm.creator_id = p_creator_id and cm.role = 'owner' and cm.status = 'approved'
  );
$$;

create or replace function public.get_public_managed_creator_ids()
returns table(creator_id uuid)
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select distinct cm.creator_id
  from public.creator_members cm
  where cm.role = 'owner' and cm.status = 'approved';
$$;
revoke all on function public.is_creator_managed(uuid) from public;
grant execute on function public.is_creator_managed(uuid) to anon, authenticated;
revoke all on function public.get_public_managed_creator_ids() from public;
grant execute on function public.get_public_managed_creator_ids() to anon, authenticated;

-- The simplified product no longer exposes invitation/capability flows.
-- Preserve invitation rows; revoke only the old client entry points.
do $$
declare signature text;
begin
  foreach signature in array array[
    'public.has_team_capability(uuid,text)',
    'public.is_active_team_member(uuid)',
    'public.is_team_invitation_recipient(uuid)',
    'public.get_my_team_access(uuid)',
    'public.revoke_team_invitation(uuid)',
    'public.expire_team_invitation(uuid)'
  ] loop
    if pg_catalog.to_regprocedure(signature) is not null then
      execute format('revoke all on function %s from public, anon, authenticated', signature);
    end if;
  end loop;
  if exists (select 1 from pg_catalog.pg_namespace where nspname = 'team_private') then
    execute 'revoke all on schema team_private from public, anon, authenticated';
  end if;
end;
$$;

drop policy if exists "Users can view team members" on public.team_members;
drop policy if exists "Users can insert team members" on public.team_members;
drop policy if exists "Users can update team members" on public.team_members;
drop policy if exists "Team members can view roster" on public.team_members;
drop policy if exists "Owners can add initial owner membership" on public.team_members;
create policy "Creators can view their own team memberships" on public.team_members
  for select to authenticated
  using (exists (
    select 1 from public.creator_members cm
    join public.creators c on c.id = cm.creator_id
    where cm.creator_id = team_members.creator_id
      and cm.profile_id = auth.uid() and cm.role = 'owner' and cm.status = 'approved'
      and c.owner_type = 'user' and c.owner_id = auth.uid()
  ));
revoke all on table public.team_members from public, anon, authenticated;
grant select on public.team_members to authenticated;

revoke all on table public.invitations from public, anon, authenticated;
drop policy if exists "Authenticated users can access invitations" on public.invitations;
drop policy if exists "Invitation participants can read invitations" on public.invitations;

drop policy if exists "Users can view teams" on public.teams;
drop policy if exists "Team participants can view teams" on public.teams;
drop policy if exists "Users can create teams" on public.teams;
drop policy if exists "Users can update teams" on public.teams;
drop policy if exists "Owners can create teams" on public.teams;
drop policy if exists "Owners can update teams" on public.teams;
create policy "Public can view active teams" on public.teams
  for select to anon, authenticated using (status = 'active');
revoke all on table public.teams from public, anon, authenticated;
grant select on table public.teams to anon, authenticated;
grant insert, update on table public.teams to authenticated;
create policy "Verified creators can create teams" on public.teams
  for insert to authenticated with check (exists (
    select 1 from public.creators c
    join public.creator_members cm on cm.creator_id = c.id
    where c.id = teams.owner_id and c.owner_type = 'user' and c.owner_id = auth.uid()
      and cm.profile_id = auth.uid() and cm.role = 'owner' and cm.status = 'approved'
  ));
create policy "Team owners can update teams" on public.teams
  for update to authenticated using (exists (
    select 1 from public.creators c
    join public.creator_members cm on cm.creator_id = c.id
    where c.id = teams.owner_id and c.owner_type = 'user' and c.owner_id = auth.uid()
      and cm.profile_id = auth.uid() and cm.role = 'owner' and cm.status = 'approved'
  )) with check (exists (
    select 1 from public.creators c
    join public.creator_members cm on cm.creator_id = c.id
    where c.id = teams.owner_id and c.owner_type = 'user' and c.owner_id = auth.uid()
      and cm.profile_id = auth.uid() and cm.role = 'owner' and cm.status = 'approved'
  ));

drop policy if exists "Authorized team managers can update team creator profiles" on public.creators;
drop policy if exists "Users can update own creators" on public.creators;
drop policy if exists "Owners can update personal creator profiles" on public.creators;
create policy "Owners can update personal creator profiles" on public.creators
  for update to authenticated
  using (owner_type = 'user' and owner_id = auth.uid())
  with check (owner_type = 'user' and owner_id = auth.uid());
drop policy if exists "Owners can create team creator profiles" on public.creators;
create policy "Owners can create team creator profiles" on public.creators
  for insert to authenticated
  with check (
    owner_type = 'team'
    and owner_id = team_id
    and exists (
      select 1
      from public.teams t
      join public.creators owner_creator on owner_creator.id = t.owner_id
      join public.creator_members cm on cm.creator_id = owner_creator.id
      where t.id = creators.team_id
        and t.creator_id is null
        and owner_creator.owner_type = 'user'
        and owner_creator.owner_id = auth.uid()
        and cm.profile_id = auth.uid()
        and cm.role = 'owner'
        and cm.status = 'approved'
    )
  );
create policy "Team owners can update team creator profiles" on public.creators
  for update to authenticated
  using (owner_type = 'team' and exists (
    select 1 from public.teams t
    join public.creators c on c.id = t.owner_id
    join public.creator_members cm on cm.creator_id = c.id
    where t.id = creators.team_id and t.creator_id = creators.id
      and c.owner_type = 'user' and c.owner_id = auth.uid()
      and cm.profile_id = auth.uid() and cm.role = 'owner' and cm.status = 'approved'
  ))
  with check (owner_type = 'team' and owner_id = team_id and exists (
    select 1 from public.teams t
    join public.creators c on c.id = t.owner_id
    join public.creator_members cm on cm.creator_id = c.id
    where t.id = creators.team_id and t.creator_id = creators.id
      and c.owner_type = 'user' and c.owner_id = auth.uid()
      and cm.profile_id = auth.uid() and cm.role = 'owner' and cm.status = 'approved'
  ));

-- No uniqueness constraint is added here. The current data audit found no
-- duplicate pairs, but legacy owner rows and two owner mismatches must first
-- be reconciled in a separately reviewed data backfill.
