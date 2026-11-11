-- Add a creator-aware read API without changing the existing RPC signature or ownership model.
-- Optional filters run before LIMIT, including the exact pair check used before responding.
create or replace function public.get_creator_team_invitations(
  p_creator_id uuid default null, p_invitation_id uuid default null
)
returns table(invitation_id uuid, team_id uuid, team_name text, team_creator_id uuid,
  sender_name text, message text, status text, expires_at timestamptz, created_at timestamptz,
  recipient_creator_id uuid, recipient_creator_name text)
language plpgsql stable security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  return query
  select i.id, i.team_id, t.name, t.creator_id, s.name, i.message,
    case when i.status = 'pending' and (i.expires_at is null or i.expires_at <= now()) then 'expired'
      when i.status = 'pending' and t.status <> 'active' then 'team_unavailable' else i.status end,
    i.expires_at, i.created_at, r.id, r.name
  from public.invitations i
  join public.teams t on t.id = i.team_id
  join public.creators r on r.id = i.recipient_creator_id
  left join public.creators s on s.id = i.sender_creator_id
  where i.invitation_type = 'team_invite' and i.recipient_profile_id = auth.uid()
    and r.owner_type = 'user' and r.owner_id = auth.uid()
    and (p_creator_id is null or i.recipient_creator_id = p_creator_id)
    and (p_invitation_id is null or i.id = p_invitation_id)
    and exists (select 1 from public.creator_members cm where cm.creator_id = r.id
      and cm.profile_id = auth.uid() and cm.role = 'owner' and cm.status = 'approved')
  order by i.created_at desc limit 50;
end;
$$;
revoke all on function public.get_creator_team_invitations(uuid, uuid) from public, anon;
grant execute on function public.get_creator_team_invitations(uuid, uuid) to authenticated;
