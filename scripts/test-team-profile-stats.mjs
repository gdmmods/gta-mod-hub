import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  calculateTeamProfileStats,
  isMissingClickTotalsTable,
  sumLegacyDownloadClicks,
} from "../lib/server/team-profile-stats-core.mjs";

const page = await readFile(new URL("../app/creator/[id]/page.tsx", import.meta.url), "utf8");
const externalCounts = await readFile(new URL("../lib/server/external-download-counts.ts", import.meta.url), "utf8");

const stats = calculateTeamProfileStats([
  { id: "owner-mod", likes: 12 },
  { id: "member-mod", likes: 30 },
  { id: "owner-mod", likes: 12 }, // duplicate creator/mod relationship
], [
  { mod_id: "owner-mod", action_type: "download", click_count: 8 },
  { mod_id: "owner-mod", action_type: "primary_source", click_count: 3 },
  { mod_id: "member-mod", action_type: "download", click_count: 10 },
  { mod_id: "member-mod", action_type: "download", click_count: 10 }, // duplicate row cannot inflate
  { mod_id: "unrelated-mod", action_type: "download", click_count: 1000 },
]);
assert.deepEqual(stats, { modsCount: 2, totalLikes: 42, totalClicks: 21 });

// A roster member with no mod relationship adds no rows; an empty eligible set has zero counts.
assert.deepEqual(calculateTeamProfileStats([], []), { modsCount: 0, totalLikes: 0, totalClicks: 0 });
assert.equal(sumLegacyDownloadClicks([]), 0);
assert.equal(sumLegacyDownloadClicks([
  { id: "owner-mod", downloads: 8 },
  { id: "member-mod", downloads: 10 },
  { id: "owner-mod", downloads: 8 },
]), 18, "legacy fallback counts each mod once");
assert.equal(isMissingClickTotalsTable({ code: "PGRST205", message: "missing from schema cache" }), true);
assert.equal(isMissingClickTotalsTable({ code: "42501", message: "permission denied" }), false);

assert.match(page, /const eligibleTeamMods = \[\.\.\.new Map\(teamPublishedMods\.map/);
assert.match(page, /const memberCreatorIds = publicTeamMembers\.map\(\(member\) => member\.creator_id\)/);
assert.match(page, /select\("mod_id,action_type,click_count"\)\.in\("mod_id", teamModIds\)/);
assert.match(page, /clickTotalsTableMissing \? sumLegacyDownloadClicks\(eligibleTeamMods\) : teamStats\.totalClicks/);
assert.match(page, /getExternalDownloadDataByMod\(externalSources\)/);
assert.match(page, /profileExternalDownloadSummary = externalDownloadData\.summary/);
assert.match(page, /modsCount=\{profileModsCount\}/);
assert.match(externalCounts, /aggregateCreatorExternalDownloadCounts\(normalizedSources\.map/);

console.log("Team profile statistics checks passed.");
