-- Close the client-callable team authorization helper surface while retaining
-- row-level team discovery. This is a forward migration so applied history is
-- never rewritten.
create schema if not exists team_private;
revoke all on schema team_private from public, anon, authenticated;
grant usage on schema team_private to authenticated;

-- Internal capability check used only by SECURITY DEFINER invitation RPCs.
-- It is deliberately not executable by API roles and accepts no untrusted
-- client invocation through the PostgREST exposed public schema.
create or replace function team_private.has_team_capability(p_team_id uuid, p_capability text default null)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1 from public.teams t
    join public.creators c on c.id = t.owner_id
    where t.id = p_team_id and c.owner_type = 'user' and c.owner_id = auth.uid()
  ) or exists (
    select 1 from public.team_members tm
    join public.creators member_creator on member_creator.id = tm.creator_id
    join public.creator_members cm on cm.creator_id = tm.creator_id
      and cm.profile_id = auth.uid() and cm.status = 'approved' and cm.role = 'owner'
    where tm.team_id = p_team_id
      and tm.left_at is null
      and coalesce(tm.membership_status, 'active') = 'active'
      and member_creator.owner_type = 'user'
      and member_creator.owner_id = auth.uid()
      and (
        tm.role = 'owner'
        or p_capability is null
        or (p_capability = 'manage_members' and coalesce(tm.can_manage_members, false))
        or (p_capability = 'manage_team' and coalesce(tm.can_manage_team, false))
        or (p_capability = 'upload' and coalesce(tm.can_upload, false))
      )
  );
$$;

-- RLS helpers expose only the current caller's authorized team ID sets. They
-- have no caller-controlled team ID or capability arguments, avoiding an
-- arbitrary-ID/capability boolean oracle while remaining usable in policies.
create or replace function team_private.active_team_ids()
returns uuid[]
language sql stable security definer
set search_path = pg_catalog, public, auth
as $$
  select coalesce(array_agg(distinct accessible.team_id), '{}'::uuid[])
  from (
    select t.id as team_id
    from public.teams t
    join public.creators owner_creator on owner_creator.id = t.owner_id
    where owner_creator.owner_type = 'user'
      and owner_creator.owner_id = auth.uid()
    union
    select tm.team_id
    from public.team_members tm
    join public.creators member_creator on member_creator.id = tm.creator_id
    join public.creator_members cm on cm.creator_id = tm.creator_id
      and cm.profile_id = auth.uid() and cm.status = 'approved' and cm.role = 'owner'
    join public.teams t on t.id = tm.team_id
    where tm.left_at is null
      and coalesce(tm.membership_status, 'active') = 'active'
      and member_creator.owner_type = 'user'
      and member_creator.owner_id = auth.uid()
  ) accessible;
$$;

create or replace function team_private.pending_invited_team_ids()
returns uuid[]
language sql stable security definer
set search_path = pg_catalog, public, auth
as $$
  select coalesce(array_agg(distinct t.id), '{}'::uuid[])
  from public.invitations i
  join public.teams t on t.id = i.team_id and t.status = 'active'
  where i.invitation_type = 'team_invite'
    and i.recipient_profile_id = auth.uid()
    and i.status = 'pending'
    and i.expires_at > now();
$$;

create or replace function team_private.manage_members_team_ids()
returns uuid[]
language sql stable security definer
set search_path = pg_catalog, public, auth
as $$
  select coalesce(array_agg(distinct accessible.team_id), '{}'::uuid[])
  from (
    select t.id as team_id
    from public.teams t
    join public.creators owner_creator on owner_creator.id = t.owner_id
    where owner_creator.owner_type = 'user' and owner_creator.owner_id = auth.uid()
    union
    select tm.team_id
    from public.team_members tm
    join public.creators member_creator on member_creator.id = tm.creator_id
    join public.creator_members cm on cm.creator_id = tm.creator_id
      and cm.profile_id = auth.uid() and cm.status = 'approved' and cm.role = 'owner'
    where tm.left_at is null
      and coalesce(tm.membership_status, 'active') = 'active'
      and member_creator.owner_type = 'user'
      and member_creator.owner_id = auth.uid()
      and (tm.role = 'owner' or coalesce(tm.can_manage_members, false))
  ) accessible;
$$;

create or replace function team_private.manage_team_profile_ids()
returns uuid[]
language sql stable security definer
set search_path = pg_catalog, public, auth
as $$
  select coalesce(array_agg(distinct accessible.team_id), '{}'::uuid[])
  from (
    select t.id as team_id
    from public.teams t
    join public.creators owner_creator on owner_creator.id = t.owner_id
    where owner_creator.owner_type = 'user' and owner_creator.owner_id = auth.uid()
    union
    select tm.team_id
    from public.team_members tm
    join public.creators member_creator on member_creator.id = tm.creator_id
    join public.creator_members cm on cm.creator_id = tm.creator_id
      and cm.profile_id = auth.uid() and cm.status = 'approved' and cm.role = 'owner'
    where tm.left_at is null
      and coalesce(tm.membership_status, 'active') = 'active'
      and member_creator.owner_type = 'user'
      and member_creator.owner_id = auth.uid()
      and (tm.role = 'owner' or coalesce(tm.can_manage_team, false))
  ) accessible;
$$;

revoke all on function team_private.has_team_capability(uuid, text) from public, anon, authenticated;
revoke all on function team_private.active_team_ids() from public, anon, authenticated;
revoke all on function team_private.pending_invited_team_ids() from public, anon, authenticated;
revoke all on function team_private.manage_members_team_ids() from public, anon, authenticated;
revoke all on function team_private.manage_team_profile_ids() from public, anon, authenticated;
grant execute on function team_private.active_team_ids(), team_private.pending_invited_team_ids(), team_private.manage_members_team_ids(), team_private.manage_team_profile_ids() to authenticated;

-- Replace SECURITY DEFINER RPCs so only trusted server-side function execution
-- can invoke the arbitrary-team capability predicate.
create or replace function public.create_team_invitation(p_team_id uuid, p_recipient_creator_id uuid, p_message text default null)
returns public.invitations
language plpgsql security definer
set search_path = pg_catalog, public, auth
as $$
declare
  t public.teams%rowtype;
  r public.creators%rowtype;
  i public.invitations%rowtype;
  sender_id uuid;
  activity_id uuid;
  ttl_days integer;
begin
  if auth.uid() is null or not team_private.has_team_capability(p_team_id, 'manage_members') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  ttl_days := greatest(1, least(90, coalesce(nullif(current_setting('app.team_invitation_ttl_days', true), ''), '14')::integer));
  select * into t from public.teams where id = p_team_id and status = 'active';
  select * into r from public.creators where id = p_recipient_creator_id and owner_type = 'user';
  if t.id is null or t.creator_id is null or r.id is null or r.owner_id is null then
    raise exception 'Team or recipient unavailable' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.creator_members cm
    where cm.creator_id = r.id and cm.profile_id = r.owner_id
      and cm.role = 'owner' and cm.status = 'approved'
  ) then
    raise exception 'Recipient must have an approved owner membership for this creator profile' using errcode = '22023';
  end if;
  if r.owner_id = auth.uid() then raise exception 'Cannot invite your own creator' using errcode = '22023'; end if;
  select c.id into sender_id
  from public.creator_members cm join public.creators c on c.id = cm.creator_id
  where cm.profile_id = auth.uid() and cm.status = 'approved' and c.owner_type = 'user'
  order by cm.created_at limit 1;
  if sender_id is null then sender_id := t.creator_id; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_team_id::text || ':' || p_recipient_creator_id::text, 0));
  if exists (
    select 1 from public.team_members tm
    where tm.team_id = p_team_id and tm.creator_id = p_recipient_creator_id
      and tm.left_at is null and coalesce(tm.membership_status, 'active') = 'active'
  ) then raise exception 'Already a member' using errcode = '23505'; end if;
  if exists (
    select 1 from public.invitations x
    where x.team_id = p_team_id and x.recipient_creator_id = p_recipient_creator_id
      and x.invitation_type = 'team_invite' and x.status = 'pending'
      and (x.expires_at is null or x.expires_at > now())
  ) then raise exception 'Pending invitation exists' using errcode = '23505'; end if;
  insert into public.activity_events(event_type, actor_type, actor_id, target_type, target_id, visibility, title, summary, metadata)
  values ('team_member_invited', 'creator', sender_id, 'team', p_team_id, 'private', 'Team invitation sent',
    'An invitation was sent to ' || r.name || '.', jsonb_build_object('teamId', p_team_id, 'recipientCreatorId', r.id))
  returning id into activity_id;
  insert into public.invitations(invitation_type, status, sender_creator_id, recipient_creator_id, recipient_profile_id, team_creator_id, team_id, message, expires_at, activity_event_id)
  values ('team_invite', 'pending', sender_id, r.id, r.owner_id, t.creator_id, p_team_id,
    nullif(btrim(coalesce(p_message, '')), ''), now() + make_interval(days => ttl_days), activity_id)
  returning * into i;
  return i;
end;
$$;

create or replace function public.revoke_team_invitation(p_invitation_id uuid)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public, auth
as $$
declare i public.invitations%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into i from public.invitations where id = p_invitation_id and invitation_type = 'team_invite' for update;
  if i.id is null or not team_private.has_team_capability(i.team_id, 'manage_members') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if i.status = 'pending' then
    update public.invitations set status = 'cancelled', cancelled_at = now() where id = i.id and status = 'pending';
    return jsonb_build_object('status', 'cancelled');
  end if;
  return jsonb_build_object('status', i.status);
end;
$$;

create or replace function public.expire_team_invitation(p_invitation_id uuid)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public, auth
as $$
declare i public.invitations%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into i from public.invitations where id = p_invitation_id and invitation_type = 'team_invite' for update;
  if i.id is null or (i.recipient_profile_id <> auth.uid() and not team_private.has_team_capability(i.team_id, 'manage_members')) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if i.status = 'pending' and (i.expires_at is null or i.expires_at <= now()) then
    update public.invitations set status = 'expired' where id = i.id and status = 'pending';
    return jsonb_build_object('status', 'expired');
  end if;
  return jsonb_build_object('status', i.status);
end;
$$;

-- Remove the parameterized public-schema policy helpers and bind policies to
-- no-argument, caller-scoped helpers instead.
drop policy if exists "Team participants can view teams" on public.teams;
drop policy if exists "Authorized team managers can update team creator profiles" on public.creators;
drop policy if exists "Team members can view roster" on public.team_members;
drop policy if exists "Invitation participants can read invitations" on public.invitations;

create policy "Team participants can view teams" on public.teams
for select to authenticated
using (id = any(team_private.active_team_ids()) or id = any(team_private.pending_invited_team_ids()));

create policy "Authorized team managers can update team creator profiles" on public.creators
for update to authenticated
using (
  owner_type = 'team'
  and team_id = any(team_private.manage_team_profile_ids())
  and exists (select 1 from public.teams t where t.id = creators.team_id and t.creator_id = creators.id)
)
with check (
  owner_type = 'team'
  and team_id = any(team_private.manage_team_profile_ids())
  and exists (select 1 from public.teams t where t.id = creators.team_id and t.creator_id = creators.id)
);

create policy "Team members can view roster" on public.team_members
for select to authenticated
using (team_id = any(team_private.active_team_ids()));

create policy "Invitation participants can read invitations" on public.invitations
for select to authenticated
using (recipient_profile_id = auth.uid() or team_id = any(team_private.manage_members_team_ids()));

-- Delete the old arbitrary-ID public RPCs after policies and trusted RPCs have
-- been moved away from them.
drop function if exists public.has_team_capability(uuid, text);
drop function if exists public.is_active_team_member(uuid);
drop function if exists public.is_team_invitation_recipient(uuid);
