-- Prepared locally; do not apply to the live database without separate approval.
-- Invitation TTL defaults to 14 days; deployments may set app.team_invitation_ttl_days (clamped to 1..90).
create or replace function public.has_team_capability(p_team_id uuid, p_capability text default null)
returns boolean language sql stable security definer
set search_path=pg_catalog,public,auth as $$
 select exists(select 1 from public.teams t join public.creators c on c.id=t.owner_id
   where t.id=p_team_id and c.owner_type='user' and c.owner_id=auth.uid())
 or exists(select 1 from public.team_members tm join public.creators member_creator on member_creator.id=tm.creator_id join public.creator_members cm
   on cm.creator_id=tm.creator_id and cm.profile_id=auth.uid() and cm.status='approved' and cm.role='owner'
   where tm.team_id=p_team_id and tm.left_at is null and coalesce(tm.membership_status,'active')='active'
   and member_creator.owner_type='user' and member_creator.owner_id=auth.uid()
   and (tm.role='owner' or p_capability is null
    or (p_capability='manage_members' and coalesce(tm.can_manage_members,false))
    or (p_capability='manage_team' and coalesce(tm.can_manage_team,false))
    or (p_capability='upload' and coalesce(tm.can_upload,false))));
$$;
create or replace function public.is_active_team_member(p_team_id uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth as $$
 select exists(select 1 from public.team_members tm join public.creators member_creator on member_creator.id=tm.creator_id join public.creator_members cm
   on cm.creator_id=tm.creator_id and cm.profile_id=auth.uid() and cm.status='approved' and cm.role='owner'
   where tm.team_id=p_team_id and tm.left_at is null and coalesce(tm.membership_status,'active')='active'
   and member_creator.owner_type='user' and member_creator.owner_id=auth.uid());
$$;
create or replace function public.is_team_invitation_recipient(p_team_id uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth as $$
 select exists(
   select 1 from public.invitations i
   join public.teams t on t.id=i.team_id
   where i.team_id=p_team_id
     and i.invitation_type='team_invite'
     and i.recipient_profile_id=auth.uid()
     and i.status='pending'
     and i.expires_at>now()
     and t.status='active'
 );
$$;
create or replace function public.is_creator_managed(p_creator_id uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select exists(
   select 1 from public.creator_members cm
   where cm.creator_id=p_creator_id and cm.status='approved'
 );
$$;
create or replace function public.get_public_managed_creator_ids()
returns table(creator_id uuid)
language sql stable security definer set search_path=pg_catalog,public as $$
 select distinct cm.creator_id
 from public.creator_members cm
 where cm.role='owner' and cm.status='approved';
$$;
create or replace function public.get_public_team_members(p_team_id uuid)
returns table(creator_id uuid,creator_name text,creator_avatar text,public_role text)
language sql stable security definer set search_path=pg_catalog,public as $$
 select c.id,c.name,c.avatar,
   case when tm.role='owner' then 'owner' else 'member' end
 from public.teams t
 join public.creators team_profile on team_profile.id=t.creator_id and team_profile.owner_type='team' and team_profile.team_id=t.id
 join public.team_members tm on tm.team_id=t.id
 join public.creators c on c.id=tm.creator_id
 where t.id=p_team_id
   and t.status='active'
   and tm.left_at is null
   and coalesce(tm.membership_status,'active')='active'
 order by case when tm.role='owner' then 0 else 1 end,c.name;
$$;
create or replace function public.get_my_team_access(p_team_id uuid) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public,auth as $$
declare m public.team_members%rowtype; own boolean;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
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
end; $$;
create or replace function public.create_team_invitation(p_team_id uuid,p_recipient_creator_id uuid,p_message text default null)
returns public.invitations language plpgsql security definer set search_path=pg_catalog,public,auth as $$
declare t public.teams%rowtype; r public.creators%rowtype; i public.invitations%rowtype; sender_id uuid; activity_id uuid; ttl_days integer;
begin
 if auth.uid() is null or not public.has_team_capability(p_team_id,'manage_members') then raise exception 'Not authorized' using errcode='42501'; end if;
 ttl_days:=greatest(1,least(90,coalesce(nullif(current_setting('app.team_invitation_ttl_days',true),''),'14')::integer));
 select * into t from public.teams where id=p_team_id and status='active';
 select * into r from public.creators where id=p_recipient_creator_id and owner_type='user';
 if t.id is null or t.creator_id is null or r.id is null or r.owner_id is null then raise exception 'Team or recipient unavailable' using errcode='22023'; end if;
 if not exists(select 1 from public.creator_members cm where cm.creator_id=r.id and cm.profile_id=r.owner_id and cm.role='owner' and cm.status='approved') then
  raise exception 'Recipient must have an approved owner membership for this creator profile' using errcode='22023';
 end if;
 if r.owner_id=auth.uid() then raise exception 'Cannot invite your own creator' using errcode='22023'; end if;
 select c.id into sender_id from public.creator_members cm join public.creators c on c.id=cm.creator_id
   where cm.profile_id=auth.uid() and cm.status='approved' and c.owner_type='user' order by cm.created_at limit 1;
 if sender_id is null then sender_id:=t.creator_id; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_team_id::text||':'||p_recipient_creator_id::text,0));
 if exists(select 1 from public.team_members tm where tm.team_id=p_team_id and tm.creator_id=p_recipient_creator_id and tm.left_at is null and coalesce(tm.membership_status,'active')='active') then raise exception 'Already a member' using errcode='23505'; end if;
 if exists(select 1 from public.invitations x where x.team_id=p_team_id and x.recipient_creator_id=p_recipient_creator_id and x.invitation_type='team_invite' and x.status='pending' and (x.expires_at is null or x.expires_at>now())) then raise exception 'Pending invitation exists' using errcode='23505'; end if;
 insert into public.activity_events(event_type,actor_type,actor_id,target_type,target_id,visibility,title,summary,metadata)
 values('team_member_invited','creator',sender_id,'team',p_team_id,'private','Team invitation sent',
   'An invitation was sent to '||r.name||'.',jsonb_build_object('teamId',p_team_id,'recipientCreatorId',r.id)) returning id into activity_id;
 insert into public.invitations(invitation_type,status,sender_creator_id,recipient_creator_id,recipient_profile_id,team_creator_id,team_id,message,expires_at,activity_event_id)
 values('team_invite','pending',sender_id,r.id,r.owner_id,t.creator_id,p_team_id,nullif(btrim(coalesce(p_message,'')),''),now()+make_interval(days=>ttl_days),activity_id) returning * into i;
 return i;
end; $$;
create or replace function public.respond_to_team_invitation(p_invitation_id uuid,p_accept boolean) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public,auth as $$
declare i public.invitations%rowtype;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 select * into i from public.invitations where id=p_invitation_id and invitation_type='team_invite' for update;
 if i.id is null or i.recipient_profile_id<>auth.uid() then raise exception 'Invitation not found for this account' using errcode='42501'; end if;
 if i.status<>'pending' then return jsonb_build_object('status',i.status); end if;
 if i.expires_at is null or i.expires_at<=now() then update public.invitations set status='expired' where id=i.id and status='pending'; return jsonb_build_object('status','expired'); end if;
 if p_accept then
  perform 1 from public.teams t where t.id=i.team_id and t.status='active' for share;
  if not found then raise exception 'This team is no longer active' using errcode='22023'; end if;
 end if;
 if p_accept then
  if not exists(select 1 from public.creators c join public.creator_members cm on cm.creator_id=c.id and cm.profile_id=auth.uid() and cm.role='owner' and cm.status='approved' where c.id=i.recipient_creator_id and c.owner_type='user' and c.owner_id=auth.uid()) then
   raise exception 'The invited creator profile is no longer owned by this account' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(i.team_id::text||':'||i.recipient_creator_id::text,0));
  if exists(select 1 from public.team_members tm where tm.team_id=i.team_id and tm.creator_id=i.recipient_creator_id and tm.left_at is null and coalesce(tm.membership_status,'active')='active') then raise exception 'Already a member' using errcode='23505'; end if;
  insert into public.team_members(team_id,creator_id,role,membership_status,can_upload,can_manage_members,can_manage_team) values(i.team_id,i.recipient_creator_id,'member','active',false,false,false);
  update public.invitations set status='accepted',accepted_at=now(),accepted_by_creator_id=i.recipient_creator_id where id=i.id and status='pending';
  return jsonb_build_object('status','accepted');
 end if;
 update public.invitations set status='rejected',rejected_at=now() where id=i.id and status='pending';
 return jsonb_build_object('status','rejected');
end; $$;
create or replace function public.revoke_team_invitation(p_invitation_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public,auth as $$
declare i public.invitations%rowtype;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 select * into i from public.invitations where id=p_invitation_id and invitation_type='team_invite' for update;
 if i.id is null or not public.has_team_capability(i.team_id,'manage_members') then raise exception 'Not authorized' using errcode='42501'; end if;
 if i.status='pending' then update public.invitations set status='cancelled',cancelled_at=now() where id=i.id and status='pending'; return jsonb_build_object('status','cancelled'); end if;
 return jsonb_build_object('status',i.status);
end; $$;
create or replace function public.expire_team_invitation(p_invitation_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public,auth as $$
declare i public.invitations%rowtype;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 select * into i from public.invitations where id=p_invitation_id and invitation_type='team_invite' for update;
 if i.id is null or (i.recipient_profile_id<>auth.uid() and not public.has_team_capability(i.team_id,'manage_members')) then raise exception 'Not authorized' using errcode='42501'; end if;
 if i.status='pending' and (i.expires_at is null or i.expires_at<=now()) then update public.invitations set status='expired' where id=i.id and status='pending'; return jsonb_build_object('status','expired'); end if;
 return jsonb_build_object('status',i.status);
end; $$;
revoke all on function public.has_team_capability(uuid,text),public.is_active_team_member(uuid),public.is_team_invitation_recipient(uuid),public.is_creator_managed(uuid),public.get_public_managed_creator_ids(),public.get_public_team_members(uuid),public.get_my_team_access(uuid),public.create_team_invitation(uuid,uuid,text),public.respond_to_team_invitation(uuid,boolean),public.revoke_team_invitation(uuid),public.expire_team_invitation(uuid) from public,anon;
grant execute on function public.has_team_capability(uuid,text),public.is_active_team_member(uuid),public.is_team_invitation_recipient(uuid),public.get_my_team_access(uuid),public.create_team_invitation(uuid,uuid,text),public.respond_to_team_invitation(uuid,boolean),public.revoke_team_invitation(uuid),public.expire_team_invitation(uuid) to authenticated;
grant execute on function public.is_creator_managed(uuid),public.get_public_managed_creator_ids(),public.get_public_team_members(uuid) to anon,authenticated;
drop policy if exists "Authenticated users can access invitations" on public.invitations;
drop policy if exists "Users can view team members" on public.team_members;
drop policy if exists "Users can insert team members" on public.team_members;
drop policy if exists "Users can update team members" on public.team_members;
drop policy if exists "Users can view teams" on public.teams;
drop policy if exists "Users can create teams" on public.teams;
drop policy if exists "Users can update teams" on public.teams;
drop policy if exists "Creator members are viewable by everyone" on public.creator_members;
drop policy if exists "Users can create creator claims" on public.creator_members;
drop policy if exists "Users can update own memberships" on public.creator_members;
drop policy if exists "Users can update own creators" on public.creators;
create policy "Team participants can view teams" on public.teams for select to authenticated using(public.is_active_team_member(id) or public.has_team_capability(id,null) or public.is_team_invitation_recipient(id));
create policy "Owners can create teams" on public.teams for insert to authenticated with check(exists(select 1 from public.creators c where c.id=teams.owner_id and c.owner_type='user' and c.owner_id=auth.uid()));
create policy "Owners can create team creator profiles" on public.creators for insert to authenticated with check(
 owner_type='team' and owner_id=team_id and exists(select 1 from public.teams t join public.creators owner_creator on owner_creator.id=t.owner_id
 where t.id=creators.team_id and t.creator_id is null and owner_creator.owner_type='user' and owner_creator.owner_id=auth.uid()));
create policy "Owners can update teams" on public.teams for update to authenticated using(exists(select 1 from public.creators c where c.id=teams.owner_id and c.owner_type='user' and c.owner_id=auth.uid())) with check(exists(select 1 from public.creators c where c.id=teams.owner_id and c.owner_type='user' and c.owner_id=auth.uid()));
create policy "Owners can update personal creator profiles" on public.creators for update to authenticated
using(owner_type='user' and owner_id=auth.uid())
with check(owner_type='user' and owner_id=auth.uid());
create policy "Authorized team managers can update team creator profiles" on public.creators for update to authenticated
using(owner_type='team' and public.has_team_capability(team_id,'manage_team') and exists(select 1 from public.teams t where t.id=creators.team_id and t.creator_id=creators.id))
with check(owner_type='team' and public.has_team_capability(team_id,'manage_team') and exists(select 1 from public.teams t where t.id=creators.team_id and t.creator_id=creators.id));
create policy "Team members can view roster" on public.team_members for select to authenticated using(public.is_active_team_member(team_id) or public.has_team_capability(team_id,null));
create policy "Owners can add initial owner membership" on public.team_members for insert to authenticated with check(role='owner' and can_upload=true and can_manage_members=true and can_manage_team=true and exists(select 1 from public.teams t join public.creators c on c.id=t.owner_id where t.id=team_members.team_id and t.owner_id=team_members.creator_id and c.owner_type='user' and c.owner_id=auth.uid()));
create policy "Invitation participants can read invitations" on public.invitations for select to authenticated using(recipient_profile_id=auth.uid() or public.has_team_capability(team_id,'manage_members'));
revoke all on table public.creator_members from public,anon,authenticated;
grant select,insert on table public.creator_members to authenticated;
create policy "Users can view own creator memberships" on public.creator_members for select to authenticated using(profile_id=auth.uid());
create policy "Users can add ownership membership for their creator" on public.creator_members for insert to authenticated with check(profile_id=auth.uid() and role='owner' and status='approved' and coalesce(verified,false)=true and (
 exists(select 1 from public.creators c where c.id=creator_members.creator_id and c.owner_type='user' and c.owner_id=auth.uid())
 or exists(select 1 from public.creators team_creator join public.teams t on t.creator_id=team_creator.id join public.creators owner_creator on owner_creator.id=t.owner_id
   where team_creator.id=creator_members.creator_id and team_creator.owner_type='team' and owner_creator.owner_type='user' and owner_creator.owner_id=auth.uid())
));
-- No direct UPDATE/DELETE policies for memberships or invitations; RPCs own state transitions.
