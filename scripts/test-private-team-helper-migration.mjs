import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(
  new URL("../supabase/migrations/20261021083201_secure_private_team_auth_helpers.sql", import.meta.url),
  "utf8",
);

assert.match(sql, /create schema if not exists team_private/i);
assert.match(sql, /revoke all on schema team_private from public, anon, authenticated/i);
assert.match(sql, /grant usage on schema team_private to authenticated/i);

for (const helper of [
  "active_team_ids",
  "pending_invited_team_ids",
  "manage_members_team_ids",
  "manage_team_profile_ids",
]) {
  assert.match(
    sql,
    new RegExp(`create or replace function team_private\\.${helper}\\(\\)`, "i"),
    `${helper} accepts no caller-supplied team or capability arguments`,
  );
  assert.match(
    sql,
    new RegExp(`revoke all on function team_private\\.${helper}\\(\\) from public, anon, authenticated`, "i"),
  );
}

const activeTeamHelper = sql.slice(sql.indexOf("create or replace function team_private.active_team_ids()"), sql.indexOf("create or replace function team_private.pending_invited_team_ids()"));
assert.match(activeTeamHelper, /owner_creator\.owner_id = auth\.uid\(\)/);
assert.doesNotMatch(activeTeamHelper, /t\.status\s*=\s*'active'/, "owners and active members retain access to existing teams regardless of team status");
assert.match(sql, /create or replace function team_private\.has_team_capability\(p_team_id uuid, p_capability text default null\)/i);
assert.match(sql, /revoke all on function team_private\.has_team_capability\(uuid, text\) from public, anon, authenticated/i);
assert.doesNotMatch(sql, /grant execute on function team_private\.has_team_capability/i);
assert.match(sql, /create or replace function public\.create_team_invitation[\s\S]*?team_private\.has_team_capability\(p_team_id, 'manage_members'\)/i);
assert.match(sql, /create or replace function public\.revoke_team_invitation[\s\S]*?team_private\.has_team_capability\(i\.team_id, 'manage_members'\)/i);
assert.match(sql, /create or replace function public\.expire_team_invitation[\s\S]*?team_private\.has_team_capability\(i\.team_id, 'manage_members'\)/i);
assert.match(sql, /using \(id = any\(team_private\.active_team_ids\(\)\) or id = any\(team_private\.pending_invited_team_ids\(\)\)\)/i);
assert.match(sql, /team_id = any\(team_private\.manage_team_profile_ids\(\)\)/i);
assert.match(sql, /using \(team_id = any\(team_private\.active_team_ids\(\)\)\)/i);
assert.match(sql, /recipient_profile_id = auth\.uid\(\) or team_id = any\(team_private\.manage_members_team_ids\(\)\)/i);
for (const oldHelper of ["has_team_capability", "is_active_team_member", "is_team_invitation_recipient"]) {
  assert.match(sql, new RegExp(`drop function if exists public\\.${oldHelper}\\(`, "i"));
}

console.log("Private team helper migration contract checks passed.");
