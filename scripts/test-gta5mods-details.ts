
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  extractGta5ModsDetails,
} from "../lib/connectors/gta5ModsDetails";

const projectUrl =
  "https://www.gta5-mods.com/vehicles/pontiac-gto-convertible-1966-animated-roof-add-on-fivem-template";

const html = readFileSync(
  join(process.cwd(), "gta5mods-sample.html"),
  "utf8"
);

const details = extractGta5ModsDetails(html, projectUrl);

assert.equal(
  details.title,
  "Pontiac GTO Convertible 1966 (Animated Roof) [Add-On / FiveM | Template]"
);

assert.equal(details.category, "vehicles");
assert.equal(details.version, "1.1");
assert.equal(details.knownBugs, "NONE");

assert.ok(details.description);
assert.ok(details.description.includes("Known Bugs"));
assert.ok(details.description.includes("Credits"));

assert.ok(details.features);
assert.ok(details.features.includes("HQ Exterior"));

assert.ok(details.credits);
assert.ok(details.credits.includes("CG"));
assert.ok(details.credits.includes("Asyr0n"));
assert.ok(!details.credits.includes("INSTALL IN README"));
assert.ok(!details.credits.includes("Patreon Exclusives"));

assert.equal(details.fileSize, "50.4 MB");
assert.equal(details.downloads, 7582);
assert.equal(details.lastUpdated, "June 06, 2023");

assert.ok(details.image, "Expected a cover image");
assert.ok(details.images.length > 0, "Expected gallery images");
assert.ok(
  !details.images.includes(details.image),
  "Gallery must not duplicate the cover image"
);

console.log("GTA5-Mods parser fixture checks passed.");
