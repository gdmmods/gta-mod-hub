import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildOutboundClickUrl,
  isEligibleOutboundTarget,
  isCreatorSelfClick,
  isOutboundClickAction,
  normalizeTrackedHttpsUrl,
  OUTBOUND_CLICK_ACTIONS,
} from "../lib/server/click-analytics";
import { createClickSessionToken, verifyClickSessionToken } from "../lib/server/click-session";

assert.deepEqual(OUTBOUND_CLICK_ACTIONS, ["download", "primary_source", "creator_backup", "other_source"]);
for (const action of OUTBOUND_CLICK_ACTIONS) assert.equal(isOutboundClickAction(action), true);
assert.equal(isOutboundClickAction("other"), false);
assert.equal(isOutboundClickAction("other_sources_open"), false, "opening the source selector is not an outbound action");
assert.equal(normalizeTrackedHttpsUrl("https://example.com/mod"), "https://example.com/mod");
assert.equal(normalizeTrackedHttpsUrl("http://example.com/mod"), null);
assert.equal(normalizeTrackedHttpsUrl("https://user:pass@example.com/mod"), null);
assert.equal(isCreatorSelfClick("owner-id", "owner-id"), true);
assert.equal(isCreatorSelfClick("visitor-id", "owner-id"), false);
assert.equal(isCreatorSelfClick(null, "owner-id"), false);
const signedSession = createClickSessionToken("test-secret");
assert.ok(verifyClickSessionToken(signedSession, "test-secret"), "signed session cookie is accepted");
const [sessionId, signature] = signedSession.split(".");
const forgedSession = `${sessionId}.${signature[0] === "0" ? "1" : "0"}${signature.slice(1)}`;
assert.equal(verifyClickSessionToken(forgedSession, "test-secret"), null, "forged session cookie is rejected");

const destinations = {
  downloadUrl: "https://downloads.example/archive.zip",
  primarySourceUrl: "https://primary.example/mod",
  creatorBackupUrl: "https://creator.example/backup",
  otherSourceUrls: ["https://other.example/mod-1", "https://other.example/mod-2"],
};
for (const [action, targetUrl] of [
  ["download", destinations.downloadUrl],
  ["primary_source", destinations.primarySourceUrl],
  ["creator_backup", destinations.creatorBackupUrl],
  ["other_source", destinations.otherSourceUrls[1]],
] as const) {
  assert.equal(isEligibleOutboundTarget({ action, targetUrl, ...destinations }), true, `${action} target is attributed`);
}
assert.equal(isEligibleOutboundTarget({
  action: "other_source",
  targetUrl: "https://unlinked.example/mod",
  ...destinations,
}), false, "unlinked external URLs cannot be counted");

const trackedUrl = new URL(buildOutboundClickUrl({
  origin: "https://modvault.example",
  modId: "11111111-1111-4111-8111-111111111111",
  action: "other_source",
  targetUrl: "https://source.example/mod",
  eventId: "22222222-2222-4222-8222-222222222222",
}));
assert.equal(trackedUrl.pathname, "/api/outbound-click");
assert.equal(trackedUrl.searchParams.get("action"), "other_source");
assert.equal(trackedUrl.searchParams.get("target"), "https://source.example/mod");

const migration = readFileSync(new URL("../supabase/migrations/20261018131942_protected_click_analytics.sql", import.meta.url), "utf8");
assert.match(migration, /event_id uuid primary key/, "event IDs are idempotency keys");
assert.match(migration, /interval '30 minutes'/, "same session and destination are deduplicated");
assert.match(migration, />= 60/, "per-session hourly rate limit is enforced");
assert.match(migration, /interval '90 days'/, "raw session digests are periodically pruned");
assert.match(migration, /revoke all on function public\.record_mod_click[\s\S]*?from public, anon, authenticated/, "public callers cannot bypass route validation");
assert.match(migration, /grant execute on function public\.record_mod_click[\s\S]*?to service_role/, "only the server role can record clicks");
assert.match(migration, /revoke execute on function public\.increment_downloads[\s\S]*?from public, anon, authenticated/, "the old unprotected increment path is closed");
assert.match(migration, /create policy "Public can read published mod click aggregates"/, "only safe aggregate rows are exposed");
const publicTotals = migration.match(/create table public\.mod_click_totals \(([\s\S]*?)\);/)?.[1] ?? "";
assert.doesNotMatch(publicTotals, /target_hash|session_hash/, "public totals do not expose source or session digests");
assert.doesNotMatch(migration, /grant select on table public\.mod_click_events to anon|grant select on table public\.mod_click_events to authenticated/);
const clickSessionRoute = readFileSync(new URL("../app/api/click-session/route.ts", import.meta.url), "utf8");
assert.doesNotMatch(clickSessionRoute, /record_mod_click/, "initializing a session does not count a click");

console.log("Protected click analytics checks passed.");
