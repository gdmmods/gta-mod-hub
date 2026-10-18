import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isAuthorizedModEditor } from "../lib/server/mod-edit-authorization";

const linked = {
  userId: "user-owner",
  modCreatorId: "creator-1",
  linkedCreatorId: "creator-1",
  creatorOwnerId: "user-owner",
};

assert.equal(isAuthorizedModEditor(linked), true, "the linked creator owner may edit");
assert.equal(isAuthorizedModEditor({ ...linked, userId: "another-user" }), false, "another user cannot edit");
assert.equal(isAuthorizedModEditor({ ...linked, userId: null }), false, "signed-out users cannot edit");
assert.equal(isAuthorizedModEditor({ ...linked, linkedCreatorId: null }), false, "unlinked creators cannot edit");
assert.equal(isAuthorizedModEditor({ ...linked, creatorOwnerId: null }), false, "an unowned creator link cannot grant access");

const editLayout = readFileSync(new URL("../app/dashboard/mods/[id]/edit/layout.tsx", import.meta.url), "utf8");
assert.match(editLayout, /auth\.getUser\(\)/, "direct edit URLs verify the current server-authenticated user");
assert.match(editLayout, /if \(\s*creatorError\s*\|\|[\s\S]*?notFound\(\)/, "unauthorized direct edit URLs are denied");
assert.match(editLayout, /isAuthorizedModEditor/, "the direct URL guard uses the same linked-owner rule");

const ownershipMigration = readFileSync(new URL("../supabase/migrations/20261015083649_discovery_write_ownership_policies.sql", import.meta.url), "utf8");
assert.match(ownershipMigration, /Creators can update mods they own[\s\S]*?owner_id = \(select auth\.uid\(\)\)/, "direct Supabase update API calls remain owner-restricted by RLS");

console.log("Mod edit authorization checks passed.");
