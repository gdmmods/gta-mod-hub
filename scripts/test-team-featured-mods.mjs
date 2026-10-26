import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { selectTeamFeaturedMods } from "../lib/server/team-featured-mods-core.mjs";

const page = await readFile(new URL("../app/creator/[id]/page.tsx", import.meta.url), "utf8");
const card = await readFile(new URL("../components/creator/profile/CreatorFeaturedMod.tsx", import.meta.url), "utf8");

const owner = "team-owner";
const member = "team-member";
const unrelated = "unrelated-creator";
const candidate = (id, creatorIds, externalDownloads, likes, status = "published", visibility = "public") => ({
  id, title: id, image: null, creatorIds, externalDownloads, likes, status, visibility,
});

const multiple = selectTeamFeaturedMods([
  candidate("download-leader", [owner], 1200, 30),
  candidate("like-leader", [member], null, 90),
  candidate("second-download", [member], 600, 50),
  candidate("unrelated", [unrelated], 90000, 10000),
  candidate("draft", [owner], 50000, 20000, "draft"),
  candidate("private", [member], 40000, 10000, "published", "private"),
], [owner, member]);
assert.equal(multiple.mostDownloaded.id, "download-leader");
assert.equal(multiple.mostDownloaded.downloads, 1200);
assert.equal(multiple.mostLiked.id, "like-leader");
assert.notEqual(multiple.mostDownloaded.id, "unrelated");

const distinct = selectTeamFeaturedMods([
  candidate("top-both", [owner], 200, 100),
  candidate("next-liked", [member], 100, 90),
], [owner, member]);
assert.equal(distinct.mostDownloaded.id, "top-both");
assert.equal(distinct.mostLiked.id, "next-liked");

const one = selectTeamFeaturedMods([candidate("only", [member], 0, 5)], [member]);
assert.equal(one.mostDownloaded.id, "only");
assert.equal(one.mostLiked.id, "only");

const unavailable = selectTeamFeaturedMods([candidate("unknown-count", [owner], null, 7)], [owner]);
assert.equal(unavailable.mostDownloaded, null, "unavailable download totals are not treated as zero");
assert.equal(unavailable.mostLiked.id, "unknown-count");

const empty = selectTeamFeaturedMods([], [owner, member]);
assert.deepEqual(empty, { mostDownloaded: null, mostLiked: null });

assert.match(page, /publicTeamMembers\.map\(\(member\) => member\.creator_id\)/);
assert.match(page, /\.in\("creator_id", memberCreatorIds\)/);
assert.match(page, /\.eq\("status", "published"\)/);
assert.match(page, /getExternalDownloadDataByMod\(externalSources\)/);
assert.match(page, /selectTeamFeaturedMods\(/);
assert.match(page, /teamFeatured\.mostDownloaded/);
assert.match(page, /No eligible published mods are available for this team yet/);
assert.match(card, /External download counts unavailable/);

console.log("Team featured mod selection checks passed.");
