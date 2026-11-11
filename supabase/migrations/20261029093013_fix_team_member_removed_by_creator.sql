-- removed_by references creators(id), not the account profile ID.
-- Preserve the existing authorization, membership changes, and leave notifications.
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
  activity_id uuid;
  owner_profile_id uuid;
  member_name text;
  team_name text;
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

    select owner_creator.owner_id into owner_profile_id
    from public.creators owner_creator
    where owner_creator.id = team_row.owner_id;
    select member_creator.name into member_name
    from public.creators member_creator
    where member_creator.id = p_creator_id;
    select team_creator.name into team_name
    from public.creators team_creator
    where team_creator.id = team_row.creator_id;

    if owner_profile_id is not null then
      insert into public.activity_events(
        event_type, actor_type, actor_id, target_type, target_id,
        visibility, title, summary, metadata
      )
      values (
        'team_member_left', 'creator', p_creator_id, 'team', p_team_id,
        'private', 'Team member left',
        coalesce(member_name, 'A creator') || ' left ' || coalesce(team_name, 'the team') || '.',
        jsonb_build_object(
          'teamId', p_team_id,
          'teamCreatorId', team_row.creator_id,
          'teamName', team_name,
          'memberCreatorId', p_creator_id,
          'memberCreatorName', member_name,
          'leavingProfileId', auth.uid()
        )
      )
      returning id into activity_id;

      insert into public.notifications(profile_id, activity_event_id)
      values (owner_profile_id, activity_id);
    end if;
    return jsonb_build_object('status', 'left');
  else
    update public.team_members
    set membership_status = 'removed', left_at = now(), removed_at = now(),
        removed_by = team_row.owner_id, leave_reason = null,
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

revoke all on function public.set_team_membership(uuid, uuid, text) from public, anon;
grant execute on function public.set_team_membership(uuid, uuid, text) to authenticated;
