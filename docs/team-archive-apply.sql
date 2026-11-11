-- PREPARED ONLY. Requires explicit approval and verified project zormnoamfexwnhhajzmx.
-- Review docs/team-archiving-rollout.md and verify a recoverable backup first.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
do $preflight$ begin
  if to_regclass('private.discussion_comments') is not null
    or exists(select 1 from information_schema.columns where table_schema='public' and table_name='teams' and column_name='archived_at')
    or to_regprocedure('public.set_team_archived(uuid,boolean)') is not null
    or exists(select 1 from supabase_migrations.schema_migrations where version in ('20261031103144','20261031100736')) then
    raise exception 'Lifecycle/discussion state differs from the reviewed unapplied baseline. Stop and inspect.';
  end if;
end $preflight$;

-- SOURCE: 20261031103144_team_archive_lifecycle.sql
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


-- SOURCE: 20261031100736_unified_discussions.sql
-- Discussion storage is deliberately outside the Data API. Public RPC wrappers
-- are invokers; only the narrowly scoped private implementations bypass RLS.
create schema if not exists private;
create table private.discussion_comments (
  id uuid primary key default gen_random_uuid(),
  author_account_id uuid not null references public.profiles(id),
  author_creator_id uuid references public.creators(id),
  target_type text not null check (target_type in ('mod','asset','knowledge','showcase')),
  target_id uuid not null,
  parent_comment_id uuid references private.discussion_comments(id),
  body text not null check (char_length(body) <= 4000),
  status text not null default 'published' check (status in ('published','hidden','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'deleted' or char_length(btrim(body)) > 0)
);
create index discussion_target on private.discussion_comments(target_type,target_id,created_at desc,id desc);
create index discussion_author on private.discussion_comments(author_account_id,created_at desc,id desc);
create index discussion_creator on private.discussion_comments(author_creator_id,created_at desc,id desc);
create index discussion_parent on private.discussion_comments(parent_comment_id,created_at,id);
create table private.discussion_moderators (
  profile_id uuid primary key references public.profiles(id)
);
create table private.discussion_mutations (
  account_id uuid not null references public.profiles(id),
  occurred_at timestamptz not null default now(),
  is_post boolean not null
);
create index discussion_mutation_rate on private.discussion_mutations(account_id,occurred_at desc);
alter table private.discussion_comments enable row level security;
alter table private.discussion_moderators enable row level security;
alter table private.discussion_mutations enable row level security;
revoke all on private.discussion_comments,private.discussion_moderators,private.discussion_mutations from public,anon,authenticated;

create function private.guard_discussion_identity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if row(new.id,new.author_account_id,new.author_creator_id,new.target_type,new.target_id,new.parent_comment_id,new.created_at)
    is distinct from row(old.id,old.author_account_id,old.author_creator_id,old.target_type,old.target_id,old.parent_comment_id,old.created_at) then
    raise exception 'Discussion ownership, publishing identity and context are immutable.' using errcode='42501';
  end if;
  return new;
end $$;
revoke all on function private.guard_discussion_identity() from public,anon,authenticated;
create trigger guard_discussion_identity before update on private.discussion_comments
for each row execute function private.guard_discussion_identity();

create function private.discussion_owner(p_creator uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select case when c.owner_type = 'user' then c.owner_id
    when c.owner_type = 'team' then leader.owner_id end
  from public.creators c
  left join public.teams t on t.id=c.team_id and t.creator_id=c.id
  left join public.creators leader on leader.id=t.owner_id and leader.owner_type='user'
  where c.id=p_creator
$$;
revoke all on function private.discussion_owner(uuid) from public,anon,authenticated;

-- One entry point for all changes: account and identity cannot be supplied on edits.
create function private.write_discussion(
  p_action text, p_comment_id uuid default null, p_target_id uuid default null,
  p_creator_id uuid default null, p_parent_id uuid default null,
  p_body text default null, p_target_type text default 'mod'
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  account uuid := auth.uid();
  item private.discussion_comments;
  parent private.discussion_comments;
  mod_row public.mods;
  recipient record;
  event_id uuid;
  owner_account uuid;
  moderator boolean;
  selected_creator uuid;
begin
  if account is null then raise exception 'Sign in to join the discussion.' using errcode='42501'; end if;
  if p_action is null or p_action not in ('create','edit','delete','hide','restore') then
    raise exception 'Unknown discussion action.' using errcode='22023';
  end if;
  -- Serializes concurrent writes by this account, across identities and targets.
  perform pg_advisory_xact_lock(hashtextextended(account::text, 821));
  if (select count(*) from private.discussion_mutations where account_id=account and occurred_at > now()-interval '1 minute') >= 30 then
    raise exception 'Too many changes. Please wait a minute.' using errcode='P0001';
  end if;
  if p_action in ('create','edit') and (p_body is null or char_length(btrim(p_body)) not between 1 and 4000) then
    raise exception 'Write between 1 and 4,000 characters.' using errcode='22023';
  end if;
  if p_action='create' then
    if p_target_type is distinct from 'mod' then raise exception 'This discussion category is not available yet.' using errcode='22023'; end if;
    select * into mod_row from public.mods where id=p_target_id and status='published';
    if not found then raise exception 'This mod is unavailable.' using errcode='22023'; end if;
    select default_creator_id into selected_creator from public.profiles where id=account for share;
    if not found then raise exception 'Your account profile is unavailable.' using errcode='42501'; end if;
    if selected_creator is distinct from p_creator_id then
      raise exception 'Your selected identity changed. Refresh and try again.' using errcode='42501';
    end if;
    if p_creator_id is not null then
      -- Lock lifecycle state so a concurrent archive cannot race publishing.
      perform 1 from public.teams t join public.creators c on c.team_id=t.id and t.creator_id=c.id
        where c.id=p_creator_id and c.owner_type='team' and t.status='active' for share of t;
      if exists(select 1 from public.creators where id=p_creator_id and owner_type='team') and not found then
        raise exception 'Archived team identities cannot publish.' using errcode='42501';
      end if;
      perform 1 from public.creator_members where profile_id=account and creator_id=p_creator_id and status='approved' for share;
      if not found then raise exception 'You no longer have access to this creator identity.' using errcode='42501'; end if;
    end if;
    if (select count(*) from private.discussion_mutations where account_id=account and is_post and occurred_at > now()-interval '1 minute') >= 5
      or (select count(*) from private.discussion_mutations where account_id=account and is_post and occurred_at > now()-interval '1 hour') >= 50 then
      raise exception 'Posting limit reached. Please wait before posting again.' using errcode='P0001';
    end if;
    if p_parent_id is not null then
      select * into parent from private.discussion_comments where id=p_parent_id for share;
      if not found or parent.status <> 'published' or parent.parent_comment_id is not null
        or parent.target_type <> p_target_type or parent.target_id <> p_target_id then
        raise exception 'Reply to a visible top-level comment on this mod.' using errcode='22023';
      end if;
    end if;
    insert into private.discussion_comments(author_account_id,author_creator_id,target_type,target_id,parent_comment_id,body)
      values(account,p_creator_id,p_target_type,p_target_id,p_parent_id,btrim(p_body)) returning * into item;
    owner_account := private.discussion_owner(mod_row.creator_id);
    -- DISTINCT ON collapses mod-owner + reply-recipient overlap. Prefer the reply identity.
    for recipient in
      select distinct on (account_id) account_id, creator_id from (
        select parent.author_account_id account_id,parent.author_creator_id creator_id,0 priority where p_parent_id is not null
        union all select owner_account,mod_row.creator_id,1
      ) candidates where account_id is not null and account_id <> account order by account_id,priority
    loop
      insert into public.activity_events(event_type,actor_type,actor_id,target_type,target_id,parent_type,parent_id,visibility,title,metadata)
      values(case when p_parent_id is null then 'comment_created' else 'comment_reply_created' end,
        case when p_creator_id is null then 'user'::public.activity_actor_type else 'creator'::public.activity_actor_type end,
        coalesce(p_creator_id,account),'comment',item.id,'mod',p_target_id,'private',
        case when p_parent_id is null then 'New mod comment' else 'New discussion reply' end,
        jsonb_build_object('discussionCommentId',item.id,'modId',p_target_id,'targetCategory','mod',
          'recipientCreatorId',recipient.creator_id,'recipientProfileId',recipient.account_id)) returning id into event_id;
      insert into public.notifications(profile_id,activity_event_id) values(recipient.account_id,event_id);
    end loop;
  else
    select * into item from private.discussion_comments where id=p_comment_id for update;
    if not found then raise exception 'Comment unavailable.' using errcode='22023'; end if;
    select exists(select 1 from private.discussion_moderators where profile_id=account)
      or exists(select 1 from public.mods m where m.id=item.target_id and private.discussion_owner(m.creator_id)=account) into moderator;
    if p_action in ('edit','delete') then
      perform 1 from public.teams t join public.creators c on c.team_id=t.id and t.creator_id=c.id
        where c.id=item.author_creator_id and c.owner_type='team' and t.status='active' for share of t;
      if exists(select 1 from public.creators where id=item.author_creator_id and owner_type='team') and not found then
        raise exception 'Archived team comments are read-only.' using errcode='42501';
      end if;
      if item.author_account_id <> account then raise exception 'Only the author can change this comment.' using errcode='42501'; end if;
      if item.status <> 'published' then raise exception 'This comment cannot be changed.' using errcode='22023'; end if;
      update private.discussion_comments set body=case when p_action='delete' then '' else btrim(p_body) end,
        status=case when p_action='delete' then 'deleted' else status end,updated_at=now() where id=item.id;
    else
      if not moderator then raise exception 'You cannot moderate this discussion.' using errcode='42501'; end if;
      if item.status='deleted' then raise exception 'Deleted comments cannot be restored.' using errcode='22023'; end if;
      update private.discussion_comments set status=case when p_action='hide' then 'hidden' else 'published' end,updated_at=now() where id=item.id;
    end if;
    -- Never retain the removed body in event/notification copies (events store IDs only).
  end if;
  insert into private.discussion_mutations(account_id,is_post) values(account,p_action='create');
  return item.id;
end $$;
revoke all on function private.write_discussion(text,uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant usage on schema private to anon,authenticated;
grant execute on function private.write_discussion(text,uuid,uuid,uuid,uuid,text,text) to authenticated;
create function public.write_discussion(
  p_action text, p_comment_id uuid default null, p_target_id uuid default null,
  p_creator_id uuid default null, p_parent_id uuid default null,
  p_body text default null, p_target_type text default 'mod'
) returns uuid language sql security invoker set search_path = '' as $$
 select private.write_discussion(p_action,p_comment_id,p_target_id,p_creator_id,p_parent_id,p_body,p_target_type)
$$;
revoke all on function public.write_discussion(text,uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.write_discussion(text,uuid,uuid,uuid,uuid,text,text) to authenticated;

create function private.read_discussions(
  p_mode text, p_identity_type text default null, p_identity_id uuid default null,
  p_target_id uuid default null, p_direction text default 'written',
  p_category text default null, p_page integer default 1, p_limit integer default 20,
  p_comment_id uuid default null
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  account uuid := auth.uid();
  root_id uuid;
  result jsonb;
begin
  if p_mode is null or p_mode not in ('target','identity','account','thread','moderation')
    or p_page is null or p_page < 1 or p_page > 100000
    or p_limit is null or p_limit not between 1 and 20
    or p_direction is null or p_direction not in ('written','received')
    or (p_category is not null and p_category not in ('mod','asset','knowledge','showcase')) then
    raise exception 'Invalid discussion filters.' using errcode='22023';
  end if;
  if p_mode in ('account','moderation') and account is null then raise exception 'Sign in to view your discussions.' using errcode='42501'; end if;
  if p_mode='identity' and (p_identity_type is null or p_identity_type not in ('user','creator') or p_identity_id is null) then
    raise exception 'Choose a public identity.' using errcode='22023';
  end if;
  if p_mode='account' and p_identity_type is not null then
    if p_identity_type='user' then
      if p_identity_id is distinct from account then raise exception 'Identity unavailable.' using errcode='42501'; end if;
    elsif p_identity_type='creator' then
      if not exists(select 1 from public.creator_members where profile_id=account and creator_id=p_identity_id and status='approved') then
        raise exception 'Identity unavailable.' using errcode='42501';
      end if;
    else raise exception 'Invalid identity.' using errcode='22023'; end if;
  end if;
  if p_mode='thread' then
    select coalesce(parent_comment_id,id) into root_id from private.discussion_comments where id=p_comment_id and target_id=p_target_id;
  end if;
  with visible as (
    select c.*,m.title target_title,
      (c.author_account_id=account and (c.author_creator_id is null or not exists(
        select 1 from public.creators ac where ac.id=c.author_creator_id and ac.owner_type='team'
          and not exists(select 1 from public.teams at where at.id=ac.team_id and at.creator_id=ac.id and at.status='active')))) can_edit,
      (private.discussion_owner(m.creator_id)=account or exists(select 1 from private.discussion_moderators where profile_id=account)) can_moderate,
      case when c.author_creator_id is null then coalesce(pr.display_name,pr.username,'User') else cr.name end author_name,
      case when c.author_creator_id is null then '/profile/' || pr.username else '/creator/' || cr.id::text end author_href
    from private.discussion_comments c
    join public.mods m on m.id=c.target_id and c.target_type='mod' and m.status='published'
    join public.profiles pr on pr.id=c.author_account_id
    left join public.creators cr on cr.id=c.author_creator_id
    left join private.discussion_comments parent on parent.id=c.parent_comment_id
    where (p_category is null or c.target_type=p_category)
      and (
        (c.status='published' and (parent.id is null or parent.status <> 'hidden'))
        or (c.status='deleted' and c.parent_comment_id is null and p_mode in ('target','thread')
          and exists(select 1 from private.discussion_comments r where r.parent_comment_id=c.id and r.status='published'))
        or (c.status='hidden' and p_mode='moderation' and (private.discussion_owner(m.creator_id)=account
          or exists(select 1 from private.discussion_moderators where profile_id=account)))
      )
      and case p_mode
        when 'target' then c.target_id=p_target_id and c.parent_comment_id is null
        when 'thread' then c.target_id=p_target_id and (c.id=root_id or c.parent_comment_id=root_id)
        when 'moderation' then c.target_id=p_target_id and c.status='hidden'
        when 'identity' then case p_identity_type when 'creator' then c.author_creator_id=p_identity_id
          else c.author_account_id=p_identity_id and c.author_creator_id is null end
        when 'account' then case p_direction when 'written' then c.author_account_id=account
          and (p_identity_type is null or (p_identity_type='creator' and c.author_creator_id=p_identity_id)
            or (p_identity_type='user' and c.author_creator_id is null))
          else parent.author_account_id=account and c.author_account_id<>account
            and (p_identity_type is null or (p_identity_type='creator' and parent.author_creator_id=p_identity_id)
              or (p_identity_type='user' and parent.author_creator_id is null)) end
      end
  ), page as (
    select * from visible
    order by case when p_mode='thread' then (parent_comment_id is null)::int end desc,
      case when p_mode='thread' and id=p_comment_id then 1 else 0 end desc,created_at desc,id desc
    limit p_limit+1 offset (p_page-1)*p_limit
  ), rows as (
    select * from page
    order by case when p_mode='thread' then (parent_comment_id is null)::int end desc,case when p_mode='thread' and id=p_comment_id then 1 else 0 end desc,created_at desc,id desc
    limit p_limit
  )
  select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object(
    'id',id,'target_type',target_type,'target_id',target_id,'target_title',target_title,
    'parent_comment_id',parent_comment_id,'body',body,'status',status,'created_at',created_at,'updated_at',updated_at,
    'author_name',author_name,'author_href',author_href,'author_creator_id',author_creator_id,
    'can_edit',coalesce(can_edit,false),'can_moderate',coalesce(can_moderate,false),
    'reply_count',(select count(*) from private.discussion_comments r where r.parent_comment_id=rows.id and r.status='published')
  ) order by case when p_mode='thread' then (parent_comment_id is null)::int end desc,case when p_mode='thread' and id=p_comment_id then 1 else 0 end desc,created_at desc,id desc) from rows),'[]'::jsonb),
  'hasMore',(select count(*) > p_limit from page),'rootId',root_id,
  'canModerate',coalesce((select private.discussion_owner(m.creator_id)=account
    or exists(select 1 from private.discussion_moderators where profile_id=account)
    from public.mods m where m.id=p_target_id and m.status='published'),false)) into result;
  return result;
end $$;
revoke all on function private.read_discussions(text,text,uuid,uuid,text,text,integer,integer,uuid) from public,anon,authenticated;
grant execute on function private.read_discussions(text,text,uuid,uuid,text,text,integer,integer,uuid) to anon,authenticated;
create function public.read_discussions(
  p_mode text, p_identity_type text default null, p_identity_id uuid default null,
  p_target_id uuid default null, p_direction text default 'written',
  p_category text default null, p_page integer default 1, p_limit integer default 20,
  p_comment_id uuid default null
) returns jsonb language sql security invoker set search_path = '' as $$
 select private.read_discussions(p_mode,p_identity_type,p_identity_id,p_target_id,p_direction,p_category,p_page,p_limit,p_comment_id)
$$;
revoke all on function public.read_discussions(text,text,uuid,uuid,text,text,integer,integer,uuid) from public,anon,authenticated;
grant execute on function public.read_discussions(text,text,uuid,uuid,text,text,integer,integer,uuid) to anon,authenticated;

-- Existing clients must not impersonate discussion-generated events through the
-- legacy activity insert path. Other activity/team behavior is preserved.
create function private.guard_discussion_events() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') and (
    new.event_type in ('comment_created','comment_reply_created')
    or new.metadata ? 'discussionCommentId'
  ) then raise exception 'Discussion events must be generated by a comment.' using errcode='42501'; end if;
  return new;
end $$;
revoke all on function private.guard_discussion_events() from public,anon,authenticated;
create trigger guard_discussion_events before insert or update on public.activity_events
for each row execute function private.guard_discussion_events();
notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,statements) values ('20261031103144','team_archive_lifecycle',array[$modvault_team_archive_lifecycle$-- Additive lifecycle. No team/creator/member/activity rows are deleted.
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
$modvault_team_archive_lifecycle$]);
insert into supabase_migrations.schema_migrations(version,name,statements) values ('20261031100736','unified_discussions',array[$modvault_unified_discussions$-- Discussion storage is deliberately outside the Data API. Public RPC wrappers
-- are invokers; only the narrowly scoped private implementations bypass RLS.
create schema if not exists private;
create table private.discussion_comments (
  id uuid primary key default gen_random_uuid(),
  author_account_id uuid not null references public.profiles(id),
  author_creator_id uuid references public.creators(id),
  target_type text not null check (target_type in ('mod','asset','knowledge','showcase')),
  target_id uuid not null,
  parent_comment_id uuid references private.discussion_comments(id),
  body text not null check (char_length(body) <= 4000),
  status text not null default 'published' check (status in ('published','hidden','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'deleted' or char_length(btrim(body)) > 0)
);
create index discussion_target on private.discussion_comments(target_type,target_id,created_at desc,id desc);
create index discussion_author on private.discussion_comments(author_account_id,created_at desc,id desc);
create index discussion_creator on private.discussion_comments(author_creator_id,created_at desc,id desc);
create index discussion_parent on private.discussion_comments(parent_comment_id,created_at,id);
create table private.discussion_moderators (
  profile_id uuid primary key references public.profiles(id)
);
create table private.discussion_mutations (
  account_id uuid not null references public.profiles(id),
  occurred_at timestamptz not null default now(),
  is_post boolean not null
);
create index discussion_mutation_rate on private.discussion_mutations(account_id,occurred_at desc);
alter table private.discussion_comments enable row level security;
alter table private.discussion_moderators enable row level security;
alter table private.discussion_mutations enable row level security;
revoke all on private.discussion_comments,private.discussion_moderators,private.discussion_mutations from public,anon,authenticated;

create function private.guard_discussion_identity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if row(new.id,new.author_account_id,new.author_creator_id,new.target_type,new.target_id,new.parent_comment_id,new.created_at)
    is distinct from row(old.id,old.author_account_id,old.author_creator_id,old.target_type,old.target_id,old.parent_comment_id,old.created_at) then
    raise exception 'Discussion ownership, publishing identity and context are immutable.' using errcode='42501';
  end if;
  return new;
end $$;
revoke all on function private.guard_discussion_identity() from public,anon,authenticated;
create trigger guard_discussion_identity before update on private.discussion_comments
for each row execute function private.guard_discussion_identity();

create function private.discussion_owner(p_creator uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select case when c.owner_type = 'user' then c.owner_id
    when c.owner_type = 'team' then leader.owner_id end
  from public.creators c
  left join public.teams t on t.id=c.team_id and t.creator_id=c.id
  left join public.creators leader on leader.id=t.owner_id and leader.owner_type='user'
  where c.id=p_creator
$$;
revoke all on function private.discussion_owner(uuid) from public,anon,authenticated;

-- One entry point for all changes: account and identity cannot be supplied on edits.
create function private.write_discussion(
  p_action text, p_comment_id uuid default null, p_target_id uuid default null,
  p_creator_id uuid default null, p_parent_id uuid default null,
  p_body text default null, p_target_type text default 'mod'
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  account uuid := auth.uid();
  item private.discussion_comments;
  parent private.discussion_comments;
  mod_row public.mods;
  recipient record;
  event_id uuid;
  owner_account uuid;
  moderator boolean;
  selected_creator uuid;
begin
  if account is null then raise exception 'Sign in to join the discussion.' using errcode='42501'; end if;
  if p_action is null or p_action not in ('create','edit','delete','hide','restore') then
    raise exception 'Unknown discussion action.' using errcode='22023';
  end if;
  -- Serializes concurrent writes by this account, across identities and targets.
  perform pg_advisory_xact_lock(hashtextextended(account::text, 821));
  if (select count(*) from private.discussion_mutations where account_id=account and occurred_at > now()-interval '1 minute') >= 30 then
    raise exception 'Too many changes. Please wait a minute.' using errcode='P0001';
  end if;
  if p_action in ('create','edit') and (p_body is null or char_length(btrim(p_body)) not between 1 and 4000) then
    raise exception 'Write between 1 and 4,000 characters.' using errcode='22023';
  end if;
  if p_action='create' then
    if p_target_type is distinct from 'mod' then raise exception 'This discussion category is not available yet.' using errcode='22023'; end if;
    select * into mod_row from public.mods where id=p_target_id and status='published';
    if not found then raise exception 'This mod is unavailable.' using errcode='22023'; end if;
    select default_creator_id into selected_creator from public.profiles where id=account for share;
    if not found then raise exception 'Your account profile is unavailable.' using errcode='42501'; end if;
    if selected_creator is distinct from p_creator_id then
      raise exception 'Your selected identity changed. Refresh and try again.' using errcode='42501';
    end if;
    if p_creator_id is not null then
      -- Lock lifecycle state so a concurrent archive cannot race publishing.
      perform 1 from public.teams t join public.creators c on c.team_id=t.id and t.creator_id=c.id
        where c.id=p_creator_id and c.owner_type='team' and t.status='active' for share of t;
      if exists(select 1 from public.creators where id=p_creator_id and owner_type='team') and not found then
        raise exception 'Archived team identities cannot publish.' using errcode='42501';
      end if;
      perform 1 from public.creator_members where profile_id=account and creator_id=p_creator_id and status='approved' for share;
      if not found then raise exception 'You no longer have access to this creator identity.' using errcode='42501'; end if;
    end if;
    if (select count(*) from private.discussion_mutations where account_id=account and is_post and occurred_at > now()-interval '1 minute') >= 5
      or (select count(*) from private.discussion_mutations where account_id=account and is_post and occurred_at > now()-interval '1 hour') >= 50 then
      raise exception 'Posting limit reached. Please wait before posting again.' using errcode='P0001';
    end if;
    if p_parent_id is not null then
      select * into parent from private.discussion_comments where id=p_parent_id for share;
      if not found or parent.status <> 'published' or parent.parent_comment_id is not null
        or parent.target_type <> p_target_type or parent.target_id <> p_target_id then
        raise exception 'Reply to a visible top-level comment on this mod.' using errcode='22023';
      end if;
    end if;
    insert into private.discussion_comments(author_account_id,author_creator_id,target_type,target_id,parent_comment_id,body)
      values(account,p_creator_id,p_target_type,p_target_id,p_parent_id,btrim(p_body)) returning * into item;
    owner_account := private.discussion_owner(mod_row.creator_id);
    -- DISTINCT ON collapses mod-owner + reply-recipient overlap. Prefer the reply identity.
    for recipient in
      select distinct on (account_id) account_id, creator_id from (
        select parent.author_account_id account_id,parent.author_creator_id creator_id,0 priority where p_parent_id is not null
        union all select owner_account,mod_row.creator_id,1
      ) candidates where account_id is not null and account_id <> account order by account_id,priority
    loop
      insert into public.activity_events(event_type,actor_type,actor_id,target_type,target_id,parent_type,parent_id,visibility,title,metadata)
      values(case when p_parent_id is null then 'comment_created' else 'comment_reply_created' end,
        case when p_creator_id is null then 'user'::public.activity_actor_type else 'creator'::public.activity_actor_type end,
        coalesce(p_creator_id,account),'comment',item.id,'mod',p_target_id,'private',
        case when p_parent_id is null then 'New mod comment' else 'New discussion reply' end,
        jsonb_build_object('discussionCommentId',item.id,'modId',p_target_id,'targetCategory','mod',
          'recipientCreatorId',recipient.creator_id,'recipientProfileId',recipient.account_id)) returning id into event_id;
      insert into public.notifications(profile_id,activity_event_id) values(recipient.account_id,event_id);
    end loop;
  else
    select * into item from private.discussion_comments where id=p_comment_id for update;
    if not found then raise exception 'Comment unavailable.' using errcode='22023'; end if;
    select exists(select 1 from private.discussion_moderators where profile_id=account)
      or exists(select 1 from public.mods m where m.id=item.target_id and private.discussion_owner(m.creator_id)=account) into moderator;
    if p_action in ('edit','delete') then
      perform 1 from public.teams t join public.creators c on c.team_id=t.id and t.creator_id=c.id
        where c.id=item.author_creator_id and c.owner_type='team' and t.status='active' for share of t;
      if exists(select 1 from public.creators where id=item.author_creator_id and owner_type='team') and not found then
        raise exception 'Archived team comments are read-only.' using errcode='42501';
      end if;
      if item.author_account_id <> account then raise exception 'Only the author can change this comment.' using errcode='42501'; end if;
      if item.status <> 'published' then raise exception 'This comment cannot be changed.' using errcode='22023'; end if;
      update private.discussion_comments set body=case when p_action='delete' then '' else btrim(p_body) end,
        status=case when p_action='delete' then 'deleted' else status end,updated_at=now() where id=item.id;
    else
      if not moderator then raise exception 'You cannot moderate this discussion.' using errcode='42501'; end if;
      if item.status='deleted' then raise exception 'Deleted comments cannot be restored.' using errcode='22023'; end if;
      update private.discussion_comments set status=case when p_action='hide' then 'hidden' else 'published' end,updated_at=now() where id=item.id;
    end if;
    -- Never retain the removed body in event/notification copies (events store IDs only).
  end if;
  insert into private.discussion_mutations(account_id,is_post) values(account,p_action='create');
  return item.id;
end $$;
revoke all on function private.write_discussion(text,uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant usage on schema private to anon,authenticated;
grant execute on function private.write_discussion(text,uuid,uuid,uuid,uuid,text,text) to authenticated;
create function public.write_discussion(
  p_action text, p_comment_id uuid default null, p_target_id uuid default null,
  p_creator_id uuid default null, p_parent_id uuid default null,
  p_body text default null, p_target_type text default 'mod'
) returns uuid language sql security invoker set search_path = '' as $$
 select private.write_discussion(p_action,p_comment_id,p_target_id,p_creator_id,p_parent_id,p_body,p_target_type)
$$;
revoke all on function public.write_discussion(text,uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.write_discussion(text,uuid,uuid,uuid,uuid,text,text) to authenticated;

create function private.read_discussions(
  p_mode text, p_identity_type text default null, p_identity_id uuid default null,
  p_target_id uuid default null, p_direction text default 'written',
  p_category text default null, p_page integer default 1, p_limit integer default 20,
  p_comment_id uuid default null
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  account uuid := auth.uid();
  root_id uuid;
  result jsonb;
begin
  if p_mode is null or p_mode not in ('target','identity','account','thread','moderation')
    or p_page is null or p_page < 1 or p_page > 100000
    or p_limit is null or p_limit not between 1 and 20
    or p_direction is null or p_direction not in ('written','received')
    or (p_category is not null and p_category not in ('mod','asset','knowledge','showcase')) then
    raise exception 'Invalid discussion filters.' using errcode='22023';
  end if;
  if p_mode in ('account','moderation') and account is null then raise exception 'Sign in to view your discussions.' using errcode='42501'; end if;
  if p_mode='identity' and (p_identity_type is null or p_identity_type not in ('user','creator') or p_identity_id is null) then
    raise exception 'Choose a public identity.' using errcode='22023';
  end if;
  if p_mode='account' and p_identity_type is not null then
    if p_identity_type='user' then
      if p_identity_id is distinct from account then raise exception 'Identity unavailable.' using errcode='42501'; end if;
    elsif p_identity_type='creator' then
      if not exists(select 1 from public.creator_members where profile_id=account and creator_id=p_identity_id and status='approved') then
        raise exception 'Identity unavailable.' using errcode='42501';
      end if;
    else raise exception 'Invalid identity.' using errcode='22023'; end if;
  end if;
  if p_mode='thread' then
    select coalesce(parent_comment_id,id) into root_id from private.discussion_comments where id=p_comment_id and target_id=p_target_id;
  end if;
  with visible as (
    select c.*,m.title target_title,
      (c.author_account_id=account and (c.author_creator_id is null or not exists(
        select 1 from public.creators ac where ac.id=c.author_creator_id and ac.owner_type='team'
          and not exists(select 1 from public.teams at where at.id=ac.team_id and at.creator_id=ac.id and at.status='active')))) can_edit,
      (private.discussion_owner(m.creator_id)=account or exists(select 1 from private.discussion_moderators where profile_id=account)) can_moderate,
      case when c.author_creator_id is null then coalesce(pr.display_name,pr.username,'User') else cr.name end author_name,
      case when c.author_creator_id is null then '/profile/' || pr.username else '/creator/' || cr.id::text end author_href
    from private.discussion_comments c
    join public.mods m on m.id=c.target_id and c.target_type='mod' and m.status='published'
    join public.profiles pr on pr.id=c.author_account_id
    left join public.creators cr on cr.id=c.author_creator_id
    left join private.discussion_comments parent on parent.id=c.parent_comment_id
    where (p_category is null or c.target_type=p_category)
      and (
        (c.status='published' and (parent.id is null or parent.status <> 'hidden'))
        or (c.status='deleted' and c.parent_comment_id is null and p_mode in ('target','thread')
          and exists(select 1 from private.discussion_comments r where r.parent_comment_id=c.id and r.status='published'))
        or (c.status='hidden' and p_mode='moderation' and (private.discussion_owner(m.creator_id)=account
          or exists(select 1 from private.discussion_moderators where profile_id=account)))
      )
      and case p_mode
        when 'target' then c.target_id=p_target_id and c.parent_comment_id is null
        when 'thread' then c.target_id=p_target_id and (c.id=root_id or c.parent_comment_id=root_id)
        when 'moderation' then c.target_id=p_target_id and c.status='hidden'
        when 'identity' then case p_identity_type when 'creator' then c.author_creator_id=p_identity_id
          else c.author_account_id=p_identity_id and c.author_creator_id is null end
        when 'account' then case p_direction when 'written' then c.author_account_id=account
          and (p_identity_type is null or (p_identity_type='creator' and c.author_creator_id=p_identity_id)
            or (p_identity_type='user' and c.author_creator_id is null))
          else parent.author_account_id=account and c.author_account_id<>account
            and (p_identity_type is null or (p_identity_type='creator' and parent.author_creator_id=p_identity_id)
              or (p_identity_type='user' and parent.author_creator_id is null)) end
      end
  ), page as (
    select * from visible
    order by case when p_mode='thread' then (parent_comment_id is null)::int end desc,
      case when p_mode='thread' and id=p_comment_id then 1 else 0 end desc,created_at desc,id desc
    limit p_limit+1 offset (p_page-1)*p_limit
  ), rows as (
    select * from page
    order by case when p_mode='thread' then (parent_comment_id is null)::int end desc,case when p_mode='thread' and id=p_comment_id then 1 else 0 end desc,created_at desc,id desc
    limit p_limit
  )
  select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object(
    'id',id,'target_type',target_type,'target_id',target_id,'target_title',target_title,
    'parent_comment_id',parent_comment_id,'body',body,'status',status,'created_at',created_at,'updated_at',updated_at,
    'author_name',author_name,'author_href',author_href,'author_creator_id',author_creator_id,
    'can_edit',coalesce(can_edit,false),'can_moderate',coalesce(can_moderate,false),
    'reply_count',(select count(*) from private.discussion_comments r where r.parent_comment_id=rows.id and r.status='published')
  ) order by case when p_mode='thread' then (parent_comment_id is null)::int end desc,case when p_mode='thread' and id=p_comment_id then 1 else 0 end desc,created_at desc,id desc) from rows),'[]'::jsonb),
  'hasMore',(select count(*) > p_limit from page),'rootId',root_id,
  'canModerate',coalesce((select private.discussion_owner(m.creator_id)=account
    or exists(select 1 from private.discussion_moderators where profile_id=account)
    from public.mods m where m.id=p_target_id and m.status='published'),false)) into result;
  return result;
end $$;
revoke all on function private.read_discussions(text,text,uuid,uuid,text,text,integer,integer,uuid) from public,anon,authenticated;
grant execute on function private.read_discussions(text,text,uuid,uuid,text,text,integer,integer,uuid) to anon,authenticated;
create function public.read_discussions(
  p_mode text, p_identity_type text default null, p_identity_id uuid default null,
  p_target_id uuid default null, p_direction text default 'written',
  p_category text default null, p_page integer default 1, p_limit integer default 20,
  p_comment_id uuid default null
) returns jsonb language sql security invoker set search_path = '' as $$
 select private.read_discussions(p_mode,p_identity_type,p_identity_id,p_target_id,p_direction,p_category,p_page,p_limit,p_comment_id)
$$;
revoke all on function public.read_discussions(text,text,uuid,uuid,text,text,integer,integer,uuid) from public,anon,authenticated;
grant execute on function public.read_discussions(text,text,uuid,uuid,text,text,integer,integer,uuid) to anon,authenticated;

-- Existing clients must not impersonate discussion-generated events through the
-- legacy activity insert path. Other activity/team behavior is preserved.
create function private.guard_discussion_events() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') and (
    new.event_type in ('comment_created','comment_reply_created')
    or new.metadata ? 'discussionCommentId'
  ) then raise exception 'Discussion events must be generated by a comment.' using errcode='42501'; end if;
  return new;
end $$;
revoke all on function private.guard_discussion_events() from public,anon,authenticated;
create trigger guard_discussion_events before insert or update on public.activity_events
for each row execute function private.guard_discussion_events();
notify pgrst, 'reload schema';
$modvault_unified_discussions$]);
commit;
