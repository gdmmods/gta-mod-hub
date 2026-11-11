import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import vm from "node:vm";
import ts from "typescript";

// Install the isolated test dependency outside the checkout:
// npm install --prefix "$env:TEMP/modvault-notification-tests" --no-save --package-lock=false @electric-sql/pglite@0.3.14
const runtime = process.env.MODVAULT_NOTIFICATION_TEST_RUNTIME ?? join(process.env.TEMP, "modvault-notification-tests");
const { PGlite } = createRequire(join(runtime, "package.json"))("@electric-sql/pglite");
const db = new PGlite();
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const [owner, member, departed, invitee, outsider] = [1, 2, 3, 4, 5].map(id);
const [ownerCreator, memberA, memberB, departedCreator, invitedCreator, otherCreator, publicTeam, team] = [11, 12, 13, 14, 15, 16, 17, 18].map(id);
await db.exec(`
  create role anon; create role authenticated;
  create schema auth;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to authenticated, anon;
  create table public.creators(id uuid primary key, name text, owner_id uuid, owner_type text, status text default 'active');
  create table public.creator_members(creator_id uuid, profile_id uuid, role text, status text);
  create table public.teams(id uuid primary key, owner_id uuid, creator_id uuid, name text, status text);
  create table public.team_members(id uuid default gen_random_uuid() primary key, team_id uuid, creator_id uuid,
    role text, membership_status text, joined_at timestamptz default now(), left_at timestamptz, removed_at timestamptz,
    removed_by uuid, leave_reason text, can_upload boolean, can_manage_members boolean, can_manage_team boolean);
  create table public.activity_events(id uuid default gen_random_uuid() primary key, event_type text, actor_type text,
    actor_id uuid, target_type text, target_id uuid, visibility text, title text, summary text, metadata jsonb);
  create table public.notifications(id uuid default gen_random_uuid() primary key, profile_id uuid, activity_event_id uuid,
    archived_at timestamptz);
  create table public.invitations(id uuid default gen_random_uuid() primary key, invitation_type text, status text,
    sender_creator_id uuid, recipient_creator_id uuid, recipient_profile_id uuid, team_creator_id uuid, team_id uuid,
    message text, expires_at timestamptz, activity_event_id uuid, accepted_at timestamptz, rejected_at timestamptz,
    accepted_by_creator_id uuid);
`);
for (const [creator, account, name] of [
  [ownerCreator, owner, "Owner"], [memberA, member, "Member A"], [memberB, member, "Member B"],
  [departedCreator, departed, "Departed"], [invitedCreator, invitee, "Invited creator"], [otherCreator, invitee, "Other creator"],
]) {
  await db.query("insert into creators(id,name,owner_id,owner_type) values ($1,$2,$3,'user')", [creator, name, account]);
  await db.query("insert into creator_members values ($1,$2,'owner','approved')", [creator, account]);
}
await db.query("insert into creators(id,name,owner_id,owner_type) values ($1,'Fixture Team',$2,'team')", [publicTeam, team]);
await db.query("insert into teams values ($1,$2,$3,'Fixture Team','active')", [team, ownerCreator, publicTeam]);
for (const creator of [memberA, memberB]) await db.query("insert into team_members(team_id,creator_id,role,membership_status) values ($1,$2,'member','active')", [team, creator]);
await db.query("insert into team_members(team_id,creator_id,role,membership_status,left_at) values ($1,$2,'member','left',now())", [team, departedCreator]);
await db.exec(readFileSync(new URL("../supabase/migrations/20261029091721_team_member_invitation_notifications.sql", import.meta.url), "utf8"));
await db.exec(readFileSync(new URL("../supabase/migrations/20261029094229_separate_personal_and_team_invitation_notifications.sql", import.meta.url), "utf8"));
const as = async (account, query, args = []) => {
  await db.exec("begin; set local role authenticated;");
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [account]);
    const result = await db.query(query, args);
    await db.exec("commit;");
    return result.rows;
  } catch (error) { await db.exec("rollback;"); throw error; }
};
const accountsFor = async (eventId) => (await db.query("select profile_id from notifications where activity_event_id=$1 order by profile_id", [eventId])).rows.map((r) => r.profile_id);
const [invitation] = await as(owner, "select * from public.create_team_invitation($1,$2,'private message')", [team, invitedCreator]);
assert.equal(invitation.recipient_creator_id, invitedCreator);
assert.ok(invitation.activity_event_id);
assert.deepEqual(await accountsFor(invitation.activity_event_id), [invitee]);
const [personalEvent] = (await db.query("select * from activity_events where id=$1", [invitation.activity_event_id])).rows;
assert.equal(personalEvent.metadata.notificationAudience, "recipient");
assert.equal(personalEvent.metadata.creatorProfileId, invitedCreator);
const [teamEvent] = (await db.query("select * from activity_events where metadata->>'invitationId'=$1 and metadata->>'notificationAudience'='team'", [invitation.id])).rows;
assert.notEqual(teamEvent.id, personalEvent.id);
assert.equal(teamEvent.metadata.creatorProfileId, publicTeam);
assert.equal(teamEvent.metadata.recipientProfileId, undefined);
assert.deepEqual(await accountsFor(teamEvent.id), [owner, member].sort());
assert.equal((await as(member, "select * from public.get_notified_team_invitation_statuses()")).find((r) => r.invitation_id === invitation.id)?.status, "pending");
assert.equal((await as(departed, "select * from public.get_notified_team_invitation_statuses()")).length, 0);
assert.equal((await as(outsider, "select * from public.get_notified_team_invitation_statuses()")).length, 0);
await assert.rejects(as(member, "select public.respond_to_team_invitation($1,true)", [invitation.id]), /Invitation not found/);
const [response] = await as(invitee, "select public.respond_to_team_invitation($1,true) as result", [invitation.id]);
assert.equal(response.result.status, "accepted");
assert.equal((await db.query("select count(*)::int as count from team_members where creator_id=$1 and membership_status='active'", [invitedCreator])).rows[0].count, 1);
assert.equal((await db.query("select count(*)::int as count from team_members where creator_id=$1", [otherCreator])).rows[0].count, 0);
const [joined] = (await db.query("select * from activity_events where event_type='team_member_joined'")).rows;
assert.equal(joined.title, "New team member");
assert.match(joined.summary, /Invited creator joined Fixture Team/);
assert.deepEqual(await accountsFor(joined.id), [owner, member, invitee].sort());
assert.equal((await as(member, "select * from public.get_notified_team_invitation_statuses()")).find((r) => r.invitation_id === invitation.id)?.status, "accepted");
await as(invitee, "select public.respond_to_team_invitation($1,true)", [invitation.id]);
assert.equal((await db.query("select count(*)::int as count from activity_events where event_type='team_member_joined'")).rows[0].count, 1);
const [declined] = await as(owner, "select * from public.create_team_invitation($1,$2)", [team, otherCreator]);
const [secondTeamEvent] = (await db.query("select * from activity_events where metadata->>'invitationId'=$1 and metadata->>'notificationAudience'='team'", [declined.id])).rows;
assert.deepEqual(await accountsFor(declined.activity_event_id), [invitee]);
assert.deepEqual(await accountsFor(secondTeamEvent.id), [owner, member].sort());

await as(invitee, "select public.respond_to_team_invitation($1,false)", [declined.id]);
assert.equal((await db.query("select count(*)::int as count from activity_events where event_type='team_member_joined'")).rows[0].count, 1);
assert.equal((await as(member, "select * from public.get_notified_team_invitation_statuses()")).find((r) => r.invitation_id === declined.id)?.status, "declined");
await assert.rejects(as(outsider, "select * from private.team_notification_accounts($1)", [team]), /permission denied/);
await assert.rejects(as("", "select * from public.get_notified_team_invitation_statuses()"), /Authentication required/);

// Expiration clears the pending state without announcing a new member.
await db.query("update invitations set status='pending', expires_at=now()-interval '1 second' where id=$1", [declined.id]);
assert.equal((await as(member, "select * from public.get_notified_team_invitation_statuses()")).find((r) => r.invitation_id === declined.id)?.status, "expired");
// An old owner-role row is paused, not a current member of the team.
await db.query("insert into team_members(team_id,creator_id,role,membership_status) values ($1,$2,'owner','active')", [team, departedCreator]);
assert.ok(!(await db.query("select * from private.team_notification_accounts($1)", [team])).rows.some((row) => row.profile_id === departed));
// Existing members cannot keep reading live invitation state after leaving.
await db.query("update team_members set membership_status='left', left_at=now() where creator_id in ($1,$2)", [memberA,memberB]);
assert.equal((await as(member, "select * from public.get_notified_team_invitation_statuses()")).length, 0);
await db.exec("begin; set local role anon;");
await assert.rejects(db.query("select * from public.get_notified_team_invitation_statuses()"), /permission denied/);
await db.exec("rollback;");

// Reproduce the live foreign-key failure, then prove the focused removal fix.
await db.exec("alter table public.team_members add constraint team_members_removed_by_fkey foreign key (removed_by) references public.creators(id)");
const oldMembershipSql = readFileSync(new URL("../supabase/migrations/20261027124319_team_leave_notifications_and_notification_reads.sql", import.meta.url), "utf8");
const functionStart = oldMembershipSql.indexOf("create or replace function public.set_team_membership(");
await db.exec(oldMembershipSql.slice(functionStart, oldMembershipSql.indexOf("$$;", functionStart) + 3));
await db.exec("grant execute on function public.set_team_membership(uuid,uuid,text) to authenticated");
await assert.rejects(as(owner, "select public.set_team_membership($1,$2,'remove')", [team, invitedCreator]), /team_members_removed_by_fkey/);
assert.equal((await db.query("select membership_status from team_members where creator_id=$1", [invitedCreator])).rows[0].membership_status, "active");
await db.exec(readFileSync(new URL("../supabase/migrations/20261029093013_fix_team_member_removed_by_creator.sql", import.meta.url), "utf8"));
await assert.rejects(as(outsider, "select public.set_team_membership($1,$2,'remove')", [team, invitedCreator]), /Only the team owner/);
await assert.rejects(as(invitee, "select public.set_team_membership($1,$2,'remove')", [team, invitedCreator]), /Only the team owner/);
await assert.rejects(as(owner, "select public.set_team_membership($1,$2,'remove')", [team, ownerCreator]), /team owner cannot be removed/);
const [removed] = await as(owner, "select public.set_team_membership($1,$2,'remove') as result", [team, invitedCreator]);
assert.equal(removed.result.status, "removed");
const [removedRow] = (await db.query("select * from team_members where creator_id=$1", [invitedCreator])).rows;
assert.equal(removedRow.removed_by, ownerCreator);
assert.equal(removedRow.membership_status, "removed");
assert.ok(removedRow.removed_at);
assert.ok(removedRow.left_at);
assert.equal(removedRow.can_upload, false);
assert.equal(removedRow.can_manage_members, false);
assert.equal(removedRow.can_manage_team, false);
assert.equal((await as(owner, "select public.set_team_membership($1,$2,'remove') as result", [team, invitedCreator]))[0].result.status, "not_member");
console.log("Removal regression checks passed: reproduced FK failure, correct owner creator audit ID, permission revocation, unauthorized/self removal rejection, and safe repeat.");
await db.close();

const presentationModule = { exports: {} };
const compiled = ts.transpileModule(readFileSync(new URL("../lib/notifications/teamInvitationPresentation.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
vm.runInNewContext(compiled, { module: presentationModule, exports: presentationModule.exports });
const { teamInvitationTitle, teamInvitationSummary } = presentationModule.exports;
const metadata = { senderProfileId: owner, recipientProfileId: invitee, recipientCreatorName: "Invited creator", teamName: "Fixture Team" };
assert.match(teamInvitationSummary(metadata, member, true), /^Invited creator was invited.*Waiting for their response/);
assert.doesNotMatch(teamInvitationSummary(metadata, member, true), /You invited|You've been invited/);
assert.match(teamInvitationSummary(metadata, owner, true), /^You invited/);
assert.match(teamInvitationSummary(metadata, invitee, true), /^You've been invited to join Fixture Team/);
assert.equal(teamInvitationTitle(metadata, invitee, true), "Team invitation");
const broadcast = { ...metadata, notificationAudience: "team", creatorProfileId: publicTeam };
assert.match(teamInvitationSummary(broadcast, owner, true), /^Invited creator was invited/);
assert.doesNotMatch(teamInvitationSummary(broadcast, invitee, true), /You've been invited/);
assert.equal(teamInvitationTitle(broadcast, owner, true), "Pending team invitation");
assert.equal(teamInvitationTitle(broadcast, owner, false), "Creator invited to team");
assert.equal(teamInvitationTitle(metadata, member, true), "Pending team invitation");
assert.equal(teamInvitationTitle(metadata, member, false), "Creator invited to team");
assert.doesNotMatch(teamInvitationSummary(metadata, member, false), /Waiting/);
console.log("Team notification integration checks passed: owner/member/recipient fan-out, shared-account deduplication, departed/outsider exclusion, pending status, correct creator acceptance, retry, decline, private helper, authentication, and audience wording.");
