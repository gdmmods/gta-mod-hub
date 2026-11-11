-- Separate creator-specific invitations from existing-member team announcements.
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
  team_activity_id uuid;
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
    'private', 'Team invitation received', 'You have been invited to join ' || coalesce((select name from public.creators where id = team_row.creator_id), team_row.name) || '.',
    jsonb_build_object('invitationId', invitation_row.id, 'teamId', team_row.id,
      'teamCreatorId', team_row.creator_id, 'teamName', (select name from public.creators where id = team_row.creator_id),
      'senderCreatorId', sender_creator_id, 'recipientCreatorId', recipient.id,
      'recipientProfileId', recipient.owner_id, 'recipientCreatorName', recipient.name,
      'senderProfileId', auth.uid(), 'creatorProfileId', recipient.id, 'notificationAudience', 'recipient'))
  returning id into activity_id;

  -- The invitation itself is private to the account controlling the invited creator.
  insert into public.notifications(profile_id, activity_event_id)
  values (recipient.owner_id, activity_id);

  -- A separate event represents team activity, with the team as its creator context.
  insert into public.activity_events(event_type, actor_type, actor_id, target_type, target_id,
    visibility, title, summary, metadata)
  values ('team_member_invited', 'creator', sender_creator_id, 'team', team_row.id,
    'private', 'Creator invited to team', recipient.name || ' was invited to join ' || coalesce((select name from public.creators where id = team_row.creator_id), team_row.name) || '.',
    jsonb_build_object('invitationId', invitation_row.id, 'teamId', team_row.id,
      'teamCreatorId', team_row.creator_id, 'teamName', (select name from public.creators where id = team_row.creator_id),
      'senderCreatorId', sender_creator_id, 'senderProfileId', auth.uid(),
      'recipientCreatorId', recipient.id, 'recipientCreatorName', recipient.name,
      'creatorProfileId', team_row.creator_id, 'notificationAudience', 'team'))
  returning id into team_activity_id;

  -- Existing member accounts only; never send a second, general invitation to the invitee.
  insert into public.notifications(profile_id, activity_event_id)
  select a.profile_id, team_activity_id from private.team_notification_accounts(team_row.id) a
  where a.profile_id <> recipient.owner_id;
  update public.invitations set activity_event_id = activity_id where id = invitation_row.id
  returning * into invitation_row;
  return invitation_row;
end;
$$;

revoke all on function public.create_team_invitation(uuid, uuid, text) from public, anon;
grant execute on function public.create_team_invitation(uuid, uuid, text) to authenticated;
