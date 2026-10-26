import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(
  new URL("../supabase/migrations/20261020094708_secure_team_invitation_workflow.sql", import.meta.url),
  "utf8",
);

function functionBody(name) {
  const start = sql.indexOf(`create or replace function public.${name}`);
  assert.notEqual(start, -1, `migration defines ${name}`);
  const end = sql.indexOf("$$;", start);
  assert.notEqual(end, -1, `${name} function body closes`);
  return sql.slice(start, end);
}

const send = functionBody("create_team_invitation");
assert.match(send, /has_team_capability\(p_team_id,'manage_members'\)/);
assert.match(send, /pg_advisory_xact_lock/);
assert.match(send, /status='pending'/);
assert.match(send, /make_interval\(days=>ttl_days\)/);
assert.match(send, /pg_advisory_xact_lock/);
assert.match(send, /recipient_creator_id/);

const respond = functionBody("respond_to_team_invitation");
assert.match(respond, /recipient_profile_id<>auth\.uid\(\)/);
assert.match(respond, /status<>'pending'/);
assert.match(respond, /set status='expired'/);
assert.match(respond, /set status='rejected'/);
assert.match(respond, /expires_at<=now\(\)/);
assert.match(respond, /perform 1 from public\.teams t where t\.id=i\.team_id and t\.status='active' for share/);
assert.match(respond, /if not found then raise exception 'This team is no longer active'/);
assert.match(respond, /pg_advisory_xact_lock/);
assert.match(respond, /'member','active',false,false,false/);
assert.match(respond, /accepted_by_creator_id/);
assert.match(respond, /rejected_at/);

const revoke = functionBody("revoke_team_invitation");
assert.match(revoke, /has_team_capability\(i\.team_id,'manage_members'\)/);
assert.match(revoke, /status='cancelled'/);

const inviteRecipient = functionBody("is_team_invitation_recipient");
assert.match(inviteRecipient, /i\.status='pending'/);
assert.match(inviteRecipient, /i\.expires_at>now\(\)/);
assert.match(inviteRecipient, /t\.status='active'/);

const managedStatus = functionBody("is_creator_managed");
assert.match(managedStatus, /cm\.status='approved'/);
const publicManagedIds = functionBody("get_public_managed_creator_ids");
assert.match(publicManagedIds, /cm\.role='owner' and cm\.status='approved'/);

const publicRoster = functionBody("get_public_team_members");
assert.match(publicRoster, /returns table\(creator_id uuid,creator_name text,creator_avatar text,public_role text\)/i);
assert.match(publicRoster, /tm\.left_at is null/);
assert.match(publicRoster, /coalesce\(tm\.membership_status,'active'\)='active'/);
assert.match(publicRoster, /t\.status='active'/);
assert.match(publicRoster, /team_profile\.id=t\.creator_id/);
assert.match(publicRoster, /team_profile\.team_id=t\.id/);
assert.match(publicRoster, /case when tm\.role='owner' then 'owner' else 'member' end/);
assert.doesNotMatch(publicRoster, /profile_id|can_upload|can_manage_members|can_manage_team|invitations/i);

assert.match(sql, /recipient_profile_id=auth\.uid\(\) or public\.has_team_capability\(team_id,'manage_members'\)/);
assert.match(sql, /drop policy if exists "Users can insert team members"/);
assert.match(sql, /drop policy if exists "Users can update team members"/);
assert.match(sql, /drop policy if exists "Users can update own memberships"/);
assert.match(sql, /revoke all on table public\.creator_members from public,anon/i);
assert.match(sql, /create policy "Users can view own creator memberships" on public\.creator_members for select to authenticated using\(profile_id=auth\.uid\(\)\)/i);
assert.doesNotMatch(sql, /create policy "Creators are publicly readable" on public\.creator_members/i);
assert.match(sql, /grant execute on function public\.is_creator_managed\(uuid\),public\.get_public_managed_creator_ids\(\),public\.get_public_team_members\(uuid\) to anon,authenticated/i);
assert.match(sql, /with check\(owner_type='user' and owner_id=auth\.uid\(\)\)/);
assert.match(sql, /profile_id=auth\.uid\(\) and role='owner' and status='approved'/);

const publicProfilePage = readFileSync(new URL("../app/creator/[id]/page.tsx", import.meta.url), "utf8");
assert.match(publicProfilePage, /supabase\.rpc\(\s*"is_creator_managed"/);
assert.match(publicProfilePage, /supabase\.rpc\(\s*"get_public_team_members"/);
const claimPage = readFileSync(new URL("../app/claim-creator/page.tsx", import.meta.url), "utf8");
assert.match(claimPage, /get_public_managed_creator_ids/);
const createTeamPage = readFileSync(new URL("../app/create-team/page.tsx", import.meta.url), "utf8");
assert.match(createTeamPage, /from\("creator_members"\)[\s\S]*?verified:\s*true/);

console.log("Team invitation migration contract checks passed.");
