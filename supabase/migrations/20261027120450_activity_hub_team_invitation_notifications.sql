-- Keep invitation and acceptance events/notifications in the same transaction as their mutations.
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
  activity_id uuid;
  sender_creator_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into team_row from public.teams t where t.id = p_team_id and t.status = 'active'
    and exists (select 1 from public.creators c join public.creator_members cm on cm.creator_id = c.id
      where c.id = t.owner_id and c.owner_type = 'user' and c.owner_id = auth.uid()
        and cm.profile_id = auth.uid() and cm.role = 'owner' and cm.status = 'approved')
    for update;
  if team_row.id is null then raise exception 'Only the owner of an active team can invite creators' using errcode = '42501'; end if;
  select * into recipient from public.creators where id = p_recipient_creator_id
    and owner_type = 'user' and status = 'active' and owner_id is not null;
  if team_row.id is null or team_row.creator_id is null or recipient.id is null then
    raise exception 'Team or recipient unavailable' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.creator_members cm where cm.creator_id = recipient.id
      and cm.profile_id = recipient.owner_id and cm.role = 'owner' and cm.status = 'approved'
  ) then
    raise exception 'Recipient must have an approved owner membership for this creator profile' using errcode = '22023';
  end if;
  if recipient.owner_id = auth.uid() then raise exception 'Cannot invite your own creator' using errcode = '22023'; end if;

  sender_creator_id := team_row.owner_id;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_team_id::text || ':' || recipient.id::text, 0));
  if exists (
    select 1 from public.team_members tm where tm.team_id = p_team_id and tm.creator_id = recipient.id
      and tm.left_at is null and coalesce(tm.membership_status, 'active') = 'active'
  ) then raise exception 'Already a member' using errcode = '23505'; end if;
  if exists (
    select 1 from public.invitations i where i.team_id = p_team_id and i.recipient_creator_id = recipient.id
      and i.invitation_type = 'team_invite' and i.status = 'pending' and (i.expires_at is null or i.expires_at > now())
  ) then raise exception 'Pending invitation exists' using errcode = '23505'; end if;

  insert into public.invitations(invitation_type, status, sender_creator_id, recipient_creator_id,
    recipient_profile_id, team_creator_id, team_id, message, expires_at)
  values ('team_invite', 'pending', sender_creator_id, recipient.id, recipient.owner_id,
    team_row.creator_id, team_row.id, nullif(btrim(coalesce(p_message, '')), ''), now() + interval '14 days')
  returning * into invitation_row;

  insert into public.activity_events(event_type, actor_type, actor_id, target_type, target_id,
    visibility, title, summary, metadata)
  values ('team_member_invited', 'creator', sender_creator_id, 'team', team_row.id,
    'private', 'Team invitation received', 'You were invited to join ' || coalesce((select name from public.creators where id = team_row.creator_id), 'a team') || '.',
    jsonb_build_object('invitationId', invitation_row.id, 'teamId', team_row.id,
      'teamCreatorId', team_row.creator_id, 'teamName', (select name from public.creators where id = team_row.creator_id),
      'senderCreatorId', sender_creator_id, 'recipientCreatorId', recipient.id,
      'recipientProfileId', recipient.owner_id, 'recipientCreatorName', recipient.name,
      'senderProfileId', auth.uid(), 'creatorProfileId', recipient.id))
  returning id into activity_id;

  insert into public.notifications(profile_id, activity_event_id)
  values (recipient.owner_id, activity_id), (auth.uid(), activity_id);
  update public.invitations set activity_event_id = activity_id where id = invitation_row.id
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
  owner_profile_id uuid;
  activity_id uuid;
  accepting_creator_name text;
  team_name text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_accept is null then raise exception 'An accept or decline response is required' using errcode = '22023'; end if;
  select * into invitation_row from public.invitations i
    where i.id = p_invitation_id and i.invitation_type = 'team_invite' for update;
  if invitation_row.id is null or invitation_row.recipient_profile_id <> auth.uid() then
    raise exception 'Invitation not found' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.creators c join public.creator_members cm on cm.creator_id = c.id
    where c.id = invitation_row.recipient_creator_id and c.owner_type = 'user' and c.owner_id = auth.uid()
      and cm.profile_id = auth.uid() and cm.role = 'owner' and cm.status = 'approved'
  ) then raise exception 'You no longer control the invited creator profile' using errcode = '42501'; end if;
  if invitation_row.status <> 'pending' then return jsonb_build_object('status', invitation_row.status); end if;
  if invitation_row.expires_at is null or invitation_row.expires_at <= now() then
    update public.invitations set status = 'expired' where id = invitation_row.id and status = 'pending';
    return jsonb_build_object('status', 'expired');
  end if;
  if not p_accept then
    update public.invitations set status = 'declined', rejected_at = now()
      where id = invitation_row.id and status = 'pending';
    return jsonb_build_object('status', 'declined');
  end if;
  select * into team_row from public.teams t where t.id = invitation_row.team_id for update;
  if team_row.id is null or team_row.status <> 'active' then
    return jsonb_build_object('status', 'team_unavailable');
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    team_row.id::text || ':' || invitation_row.recipient_creator_id::text, 0));
  select count(*) into active_count from public.team_members tm
    where tm.team_id = team_row.id and tm.creator_id = invitation_row.recipient_creator_id
      and tm.left_at is null and coalesce(tm.membership_status, 'active') = 'active';
  if active_count > 1 then raise exception 'Duplicate active memberships require owner review' using errcode = '23505'; end if;
  if active_count = 0 then
    select tm.id into membership_row_id from public.team_members tm
      where tm.team_id = team_row.id and tm.creator_id = invitation_row.recipient_creator_id
      order by tm.joined_at desc limit 1 for update;
    if membership_row_id is null then
      insert into public.team_members(team_id, creator_id, role, membership_status, can_upload, can_manage_members, can_manage_team)
      values (team_row.id, invitation_row.recipient_creator_id, 'member', 'active', false, false, false);
    else
      update public.team_members set role = 'member', membership_status = 'active', joined_at = now(), left_at = null,
        removed_at = null, removed_by = null, leave_reason = null, can_upload = false, can_manage_members = false, can_manage_team = false
      where id = membership_row_id;
    end if;
  end if;
  update public.invitations set status = 'accepted', accepted_at = now(),
    accepted_by_creator_id = invitation_row.recipient_creator_id
    where id = invitation_row.id and status = 'pending';

  select c.owner_id into owner_profile_id from public.creators c where c.id = team_row.owner_id;
  select name into team_name from public.creators where id = team_row.creator_id;
  select name into accepting_creator_name from public.creators where id = invitation_row.recipient_creator_id;
  if owner_profile_id is not null then
    insert into public.activity_events(event_type, actor_type, actor_id, target_type, target_id,
      visibility, title, summary, metadata)
    values ('team_member_joined', 'creator', invitation_row.recipient_creator_id, 'team', team_row.id,
      'private', 'Team invitation accepted', coalesce(accepting_creator_name, 'A creator') || ' accepted the invitation to join ' || coalesce(team_name, 'the team') || '.',
      jsonb_build_object('invitationId', invitation_row.id, 'teamId', team_row.id,
        'teamCreatorId', team_row.creator_id, 'teamName', team_name,
        'senderCreatorId', invitation_row.sender_creator_id,
        'recipientCreatorId', invitation_row.recipient_creator_id,
        'acceptingCreatorId', invitation_row.recipient_creator_id,
        'recipientProfileId', invitation_row.recipient_profile_id,
        'creatorProfileId', invitation_row.recipient_creator_id))
    returning id into activity_id;
    insert into public.notifications(profile_id, activity_event_id) values (owner_profile_id, activity_id);
  end if;
  return jsonb_build_object('status', case when active_count = 0 then 'accepted' else 'already_member' end);
end;
$$;

revoke all on function public.create_team_invitation(uuid, uuid, text) from public, anon;
grant execute on function public.create_team_invitation(uuid, uuid, text) to authenticated;
revoke all on function public.respond_to_team_invitation(uuid, boolean) from public, anon;
grant execute on function public.respond_to_team_invitation(uuid, boolean) to authenticated;
