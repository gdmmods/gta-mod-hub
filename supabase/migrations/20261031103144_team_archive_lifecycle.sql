-- Additive lifecycle. No team/creator/member/activity rows are deleted.
create schema if not exists private;
alter table public.teams add column archived_at timestamptz,
  add column archived_by uuid references public.creators(id),
  add column restored_at timestamptz,
  add column restored_by uuid references public.creators(id);
create index teams_archived_owner on public.teams(owner_id,id) where status='archived';

-- Public boolean contains no private membership/account information.
create function public.is_creator_operational(p_creator_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.creators c where c.id=p_creator_id and
    (c.owner_type is distinct from 'team' or exists(select 1 from public.teams t
      where t.id=c.team_id and t.creator_id=c.id and t.status='active')))
$$;
revoke all on function public.is_creator_operational(uuid) from public,anon,authenticated;
grant execute on function public.is_creator_operational(uuid) to anon,authenticated,service_role;

create function private.require_active_team(p_team uuid) returns void
language plpgsql security definer set search_path='' as $$
declare state text;
begin
  select status into state from public.teams where id=p_team for share;
  if state is distinct from 'active' then
    raise exception 'This team is archived or unavailable. Restore it before making changes.' using errcode='42501';
  end if;
end $$;
revoke all on function private.require_active_team(uuid) from public,anon,authenticated;

create function private.require_operational_creator(p_creator uuid) returns void
language plpgsql security definer set search_path='' as $$
declare c public.creators;
begin
  select * into c from public.creators where id=p_creator;
  if c.owner_type='team' then
    perform private.require_active_team(c.team_id);
    if not exists(select 1 from public.teams t where t.id=c.team_id and t.creator_id=c.id) then
      raise exception 'Team identity is inconsistent.' using errcode='42501';
    end if;
  end if;
end $$;
revoke all on function private.require_operational_creator(uuid) from public,anon,authenticated;

-- Clients cannot bypass the lifecycle RPC by changing status or archive metadata.
create function private.guard_team_lifecycle() returns trigger
language plpgsql set search_path='' as $$
begin
  if tg_op='INSERT' then
    if new.status is distinct from 'active' or new.archived_at is not null or new.archived_by is not null
      or new.restored_at is not null or new.restored_by is not null then
      raise exception 'New teams must be active.' using errcode='42501';
    end if;
  else
    if row(new.id,new.owner_id) is distinct from row(old.id,old.owner_id)
      or (old.creator_id is not null and new.creator_id is distinct from old.creator_id) then
      raise exception 'Team ownership and identity cannot be reassigned.' using errcode='42501';
    end if;
    if old.creator_id is null and new.creator_id is not null and not exists(
      select 1 from public.creators c where c.id=new.creator_id and c.team_id=new.id
        and c.owner_type='team' and c.owner_id=new.id) then
      raise exception 'Invalid team creator identity.' using errcode='42501';
    end if;
    if row(new.status,new.archived_at,new.archived_by,new.restored_at,new.restored_by)
       is distinct from row(old.status,old.archived_at,old.archived_by,old.restored_at,old.restored_by) then
      if current_user not in ('postgres','supabase_admin') then
        raise exception 'Use the team archive or restore action.' using errcode='42501';
      end if;
    elsif old.status is distinct from 'active' then
      raise exception 'Archived teams are read-only.' using errcode='42501';
    end if;
  end if;
  return new;
end $$;
revoke all on function private.guard_team_lifecycle() from public,anon,authenticated;
create trigger guard_team_lifecycle before insert or update on public.teams
for each row execute function private.guard_team_lifecycle();

-- Runs even for service-role content writes; locks serialize against archiving.
create function private.guard_archived_team_writes() returns trigger
language plpgsql security definer set search_path='' as $$
declare old_row jsonb; new_row jsonb; row_data jsonb; creator uuid; mod_id uuid;
begin
  if tg_op<>'INSERT' then old_row:=to_jsonb(old); end if;
  if tg_op<>'DELETE' then new_row:=to_jsonb(new); end if;
  -- Preserve existing FK cascade semantics for personal account/creator removal.
  -- Ordinary archived-team management still cannot delete memberships.
  if tg_op='DELETE' then
    if tg_table_name='creator_members' and (not exists(select 1 from public.profiles p where p.id=(old_row->>'profile_id')::uuid)
      or not exists(select 1 from public.creators c where c.id=(old_row->>'creator_id')::uuid)) then return old; end if;
    if tg_table_name='team_members' and not exists(select 1 from public.creators c where c.id=(old_row->>'creator_id')::uuid) then return old; end if;
  end if;
  if tg_table_name='mods' and tg_op='UPDATE' and
    (old_row - array['downloads','likes','updated_at']) = (new_row - array['downloads','likes','updated_at']) then
    return new; -- Reading preserved mods can still update existing counters.
  end if;
  if tg_table_name='creators' and tg_op='UPDATE' and old_row->>'owner_type'='team' and
     ((new_row->'owner_type',new_row->'team_id') is distinct from (old_row->'owner_type',old_row->'team_id')
       or (new_row->'owner_id' is distinct from old_row->'owner_id' and new_row->'owner_id' is distinct from old_row->'team_id')) then
    raise exception 'Team publishing identity is permanent.' using errcode='42501';
  end if;
  for row_data in select value from jsonb_array_elements(jsonb_build_array(old_row,new_row)) where value<>'null'::jsonb loop
    if tg_table_name in ('team_members','invitations') then
      if row_data->>'team_id' is not null then perform private.require_active_team((row_data->>'team_id')::uuid); end if;
    elsif tg_table_name='creators' then
      if row_data->>'owner_type'='team' then perform private.require_active_team((row_data->>'team_id')::uuid); end if;
    else
      creator:=(row_data->>'creator_id')::uuid;
      if creator is not null then perform private.require_operational_creator(creator); end if;
      mod_id:=(row_data->>'mod_id')::uuid;
      if mod_id is not null then
        select m.creator_id into creator from public.mods m where m.id=mod_id;
        perform private.require_operational_creator(creator);
      end if;
    end if;
  end loop;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function private.guard_archived_team_writes() from public,anon,authenticated;
do $$ declare tbl text; begin
  foreach tbl in array array['creators','team_members','invitations','creator_members','mods',
    'mod_creators','mod_sources','mod_files','creator_aliases','external_identities'] loop
    execute format('create trigger guard_archived_team_writes before insert or update or delete on public.%I for each row execute function private.guard_archived_team_writes()',tbl);
  end loop;
end $$;

create function public.set_team_archived(p_team_id uuid,p_archived boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare t public.teams; account uuid:=auth.uid(); next_status text;
begin
  if account is null then raise exception 'Authentication required.' using errcode='42501'; end if;
  if p_archived is null then raise exception 'Choose archive or restore.' using errcode='22023'; end if;
  select * into t from public.teams where id=p_team_id for update;
  if not found or not exists(select 1 from public.creators c join public.creator_members cm on cm.creator_id=c.id
    where c.id=t.owner_id and c.owner_type='user' and c.owner_id=account
      and cm.profile_id=account and cm.role='owner' and cm.status='approved') then
    raise exception 'Only the verified team owner can archive or restore this team.' using errcode='42501';
  end if;
  if not exists(select 1 from public.creators c where c.id=t.creator_id and c.team_id=t.id
    and c.owner_type='team' and c.owner_id=t.id) then
    raise exception 'Team identity must be repaired before changing its lifecycle.' using errcode='55000';
  end if;
  next_status:=case when p_archived then 'archived' else 'active' end;
  if t.status=next_status then return jsonb_build_object('status',next_status,'changed',false); end if;
  if t.status is distinct from (case when p_archived then 'active' else 'archived' end) then
    raise exception 'Unsupported team lifecycle state.' using errcode='55000';
  end if;
  if not p_archived then
    if not exists(select 1 from public.creator_members cm where cm.creator_id=t.creator_id and cm.profile_id=account
      and cm.status='approved' and cm.role='owner')
      or exists(select 1 from public.team_members tm where tm.team_id=t.id and tm.left_at is null
        and coalesce(tm.membership_status,'active')='active' group by tm.creator_id having count(*)>1)
      or exists(select 1 from public.team_members tm left join public.creators c on c.id=tm.creator_id
        where tm.team_id=t.id and tm.left_at is null and coalesce(tm.membership_status,'active')='active'
          and (tm.role='owner' or tm.creator_id=t.owner_id or c.owner_type is distinct from 'user' or c.owner_id is null
            or not exists(select 1 from public.creator_members cm where cm.creator_id=c.id and cm.profile_id=c.owner_id
              and cm.role='owner' and cm.status='approved'))) then
      raise exception 'Team memberships require review before restoration.' using errcode='55000';
    end if;
  else
    -- Retain invitation records and alerts, but never revive old pending invitations.
    update public.invitations set status='expired',expires_at=least(coalesce(expires_at,now()),now())
      where team_id=t.id and status='pending';
    -- Selection refresh clears a stale saved choice. Do not lock profile rows
    -- here: selection updates already lock profile -> team, in that order.
  end if;
  update public.teams set status=next_status,
    archived_at=case when p_archived then now() else archived_at end,
    archived_by=case when p_archived then t.owner_id else archived_by end,
    restored_at=case when not p_archived then now() else restored_at end,
    restored_by=case when not p_archived then t.owner_id else restored_by end,
    updated_at=now() where id=t.id;
  -- No activity/notification replay on archive, restore, or repeated requests.
  return jsonb_build_object('status',next_status,'changed',true);
end $$;
revoke all on function public.set_team_archived(uuid,boolean) from public,anon,authenticated;
grant execute on function public.set_team_archived(uuid,boolean) to authenticated;

-- Stale clients may still call this name: it must never physically delete a team.
create or replace function public.delete_owned_team(p_team_id uuid,p_team_creator_id uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
  raise exception 'Permanent team deletion is disabled. Use Archive Team.' using errcode='42501';
end $$;
revoke all on function public.delete_owned_team(uuid,uuid) from public,anon,authenticated,service_role;

create function public.get_archived_teams() returns table(id uuid,name text,creator_id uuid,archived_at timestamptz)
language sql stable security definer set search_path='' as $$
  select t.id,t.name,t.creator_id,t.archived_at from public.teams t
  join public.creators c on c.id=t.owner_id and c.owner_type='user' and c.owner_id=auth.uid()
  where t.status='archived' and exists(select 1 from public.creator_members cm
    where cm.creator_id=c.id and cm.profile_id=auth.uid() and cm.role='owner' and cm.status='approved')
  order by t.archived_at desc,t.id
$$;
revoke all on function public.get_archived_teams() from public,anon,authenticated;
grant execute on function public.get_archived_teams() to authenticated;

-- Archived public metadata contains no additional private fields; existing creator
-- profiles are already public. This also preserves roster/profile links.
create policy "Archived teams remain readable" on public.teams for select to anon,authenticated using(status='archived');

create function private.guard_active_selection() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.default_creator_id is not null then perform private.require_operational_creator(new.default_creator_id); end if;
  return new;
end $$;
revoke all on function private.guard_active_selection() from public,anon,authenticated;
create trigger guard_active_selection before insert or update of default_creator_id on public.profiles
for each row execute function private.guard_active_selection();

create function private.guard_archived_team_activity() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.actor_type='creator' then perform private.require_operational_creator(new.actor_id); end if;
  if new.target_type='team' then perform private.require_active_team(new.target_id); end if;
  return new;
end $$;
revoke all on function private.guard_archived_team_activity() from public,anon,authenticated;
create trigger guard_archived_team_activity before insert on public.activity_events
for each row execute function private.guard_archived_team_activity();

notify pgrst,'reload schema';

CREATE OR REPLACE FUNCTION public.set_team_membership(p_team_id uuid, p_creator_id uuid, p_action text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
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

  perform private.require_active_team(p_team_id);

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
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_team_access(p_team_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
declare m public.team_members%rowtype; own boolean;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if not public.is_creator_operational((select creator_id from public.teams where id=p_team_id)) then raise exception 'Team is not active' using errcode='42501'; end if;
 select exists(select 1 from public.teams t join public.creators c on c.id=t.owner_id
   where t.id=p_team_id and c.owner_type='user' and c.owner_id=auth.uid()) into own;
 select tm.* into m from public.team_members tm join public.creators member_creator on member_creator.id=tm.creator_id join public.creator_members cm
   on cm.creator_id=tm.creator_id and cm.profile_id=auth.uid() and cm.status='approved' and cm.role='owner'
   where tm.team_id=p_team_id and tm.left_at is null and coalesce(tm.membership_status,'active')='active'
   and member_creator.owner_type='user' and member_creator.owner_id=auth.uid() limit 1;
 if not own and m.id is null then raise exception 'Not a team member' using errcode='42501'; end if;
 return jsonb_build_object('teamId',p_team_id,'isOwner',own or m.role='owner',
  'role',case when own then 'owner' else m.role end,
  'canManageMembers',own or m.role='owner' or coalesce(m.can_manage_members,false),
  'canManageTeam',own or m.role='owner' or coalesce(m.can_manage_team,false),
  'canUpload',own or m.role='owner' or coalesce(m.can_upload,false));
end; $function$
;

CREATE OR REPLACE FUNCTION public.get_team_members_for_owner(p_team_id uuid)
 RETURNS TABLE(creator_id uuid, creator_name text, creator_avatar text, joined_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.teams t
    join public.creators c on c.id = t.owner_id
    join public.creator_members cm on cm.creator_id = c.id
    where t.id = p_team_id and t.status = 'active'
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_public_team_members(p_team_id uuid)
 RETURNS TABLE(creator_id uuid, creator_name text, creator_avatar text, public_role text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select roster.creator_id, roster.creator_name, roster.creator_avatar, roster.public_role
  from (
    select c.id as creator_id, c.name as creator_name, c.avatar as creator_avatar, 'owner'::text as public_role
    from public.teams t
    join public.creators c on c.id = t.owner_id
    where t.id = p_team_id and t.status in ('active','archived')
    union all
    select c.id as creator_id, c.name as creator_name, c.avatar as creator_avatar, 'member'::text as public_role
    from public.teams t
    join public.team_members tm on tm.team_id = t.id
    join public.creators c on c.id = tm.creator_id
    where t.id = p_team_id and t.status in ('active','archived')
      and tm.creator_id <> t.owner_id
      and tm.left_at is null
      and coalesce(tm.membership_status, 'active') = 'active'
  ) roster
  order by case when roster.public_role = 'owner' then 0 else 1 end, roster.creator_name;
$function$
;

CREATE OR REPLACE FUNCTION public.respond_to_team_invitation(p_invitation_id uuid, p_accept boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
declare
  invitation_row public.invitations%rowtype;
  team_row public.teams%rowtype;
  active_count integer;
  membership_row_id uuid;
  activity_id uuid;
  accepting_creator_name text;
  team_name text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_accept is null then raise exception 'An accept or decline response is required' using errcode = '22023'; end if;
  -- Same lock order as archive/create: team, then invitation.
  perform 1 from public.teams t join public.invitations i on i.team_id=t.id
    where i.id=p_invitation_id and i.recipient_profile_id=auth.uid() for update of t;
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

  select name into team_name from public.creators where id = team_row.creator_id;
  select name into accepting_creator_name from public.creators where id = invitation_row.recipient_creator_id;
  if active_count = 0 then
    insert into public.activity_events(event_type, actor_type, actor_id, target_type, target_id,
      visibility, title, summary, metadata)
    values ('team_member_joined', 'creator', invitation_row.recipient_creator_id, 'team', team_row.id,
      'private', 'New team member', coalesce(accepting_creator_name, 'A creator') || ' joined ' || coalesce(team_name, 'the team') || '.',
      jsonb_build_object('invitationId', invitation_row.id, 'teamId', team_row.id,
        'teamCreatorId', team_row.creator_id, 'teamName', team_name,
        'senderCreatorId', invitation_row.sender_creator_id,
        'recipientCreatorId', invitation_row.recipient_creator_id,
        'acceptingCreatorId', invitation_row.recipient_creator_id,
        'recipientProfileId', invitation_row.recipient_profile_id,
        'creatorProfileId', invitation_row.recipient_creator_id))
    returning id into activity_id;
    insert into public.notifications(profile_id, activity_event_id)
    select a.profile_id, activity_id from private.team_notification_accounts(team_row.id) a;
  end if;
  return jsonb_build_object('status', case when active_count = 0 then 'accepted' else 'already_member' end);
end;
$function$
;
