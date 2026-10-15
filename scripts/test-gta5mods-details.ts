
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  extractGta5ModsDetails,
} from "../lib/connectors/gta5ModsDetails";
import { getGta5ModsPreviewDescription } from "../lib/connectors/gta5ModsDescriptionPreview";

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
assert.equal(
  details.downloadUrl,
  "https://www.gta5-mods.com/vehicles/pontiac-gto-convertible-1966-animated-roof-add-on-fivem-template/download/155206"
);

assert.ok(details.description);
assert.ok(details.description.includes("Known Bugs"));
assert.ok(details.description.includes("Credits"));
assert.ok(details.description.includes("Install and Enjoy"));
assert.ok(details.description.includes("Patreon Exclusives"));

const previewDescription = getGta5ModsPreviewDescription(
  details.description,
  details
);

assert.ok(previewDescription);
assert.ok(previewDescription.includes("Forgot to get going with the Public Releases"));
assert.ok(!previewDescription.includes("Features:"));
assert.ok(!previewDescription.includes("HQ Exterior"));
assert.ok(!previewDescription.includes("Known Bugs:"));
assert.ok(!previewDescription.includes("NONE"));
assert.ok(!previewDescription.includes("Credits:"));
assert.ok(!previewDescription.includes("Base Model: CG"));
assert.ok(previewDescription.includes("Install and Enjoy"));
assert.ok(previewDescription.includes("See Ya Soon Peeps"));
assert.ok(previewDescription.includes("INSTALL IN README"));
assert.ok(previewDescription.includes("Patreon Exclusives"));
assert.ok(previewDescription.includes("Asyr0n's Workshop"));

const fallbackDescription =
  "Intro text.\n\nFeatures:\n\nUnparsed feature text remains here.";
assert.equal(
  getGta5ModsPreviewDescription(fallbackDescription, {
    features: null,
    requirements: null,
    notes: null,
    knownBugs: null,
    credits: null,
  }),
  fallbackDescription
);
assert.equal(
  getGta5ModsPreviewDescription(fallbackDescription, {
    features: "A different extracted value",
    requirements: null,
    notes: null,
    knownBugs: null,
    credits: null,
  }),
  fallbackDescription
);

assert.ok(details.features);
assert.ok(details.features.includes("HQ Exterior"));

assert.ok(details.credits);
assert.ok(details.credits.includes("CG"));
assert.ok(details.credits.includes("Asyr0n"));
assert.ok(!details.credits.includes("INSTALL IN README"));
assert.ok(!details.credits.includes("Patreon Exclusives"));

const structuredHtml = `<div class="description-body">Opening paragraph.<br>Unrelated sentence stays in the description.<br><strong>Requirements:</strong><br>Game version 1.0<br><strong>Notes:</strong><br>Install with care.<br><strong>Known Bugs:</strong><br>Minor visual issue.<br><strong>Credits:</strong><br>Artist name.</div>`;
const structured = extractGta5ModsDetails(structuredHtml, projectUrl);
assert.equal(structured.requirements, "Game version 1.0");
assert.equal(structured.notes, "Install with care.");
assert.equal(structured.knownBugs, "Minor visual issue.");
const structuredPreview = getGta5ModsPreviewDescription(structured.description, structured);
assert.equal(structuredPreview, "Opening paragraph.\nUnrelated sentence stays in the description.");

const combinedHeadingHtml = `<div class="description-body">Intro.<br><strong>Requirements:</strong><br>Game version 2<br><strong>Notes / Known Bugs:</strong><br>No issues reported.<br><strong>Credits:</strong><br>Contributor.</div>`;
const combinedHeading = extractGta5ModsDetails(combinedHeadingHtml, projectUrl);
assert.equal(combinedHeading.notes, "No issues reported.");
assert.equal(combinedHeading.knownBugs, null);
assert.equal(
  getGta5ModsPreviewDescription(combinedHeading.description, combinedHeading),
  "Intro."
);
assert.equal(
  getGta5ModsPreviewDescription("Intro.\n\nRequirements:\nFound value\nUnrelated sentence", {
    features: null,
    requirements: "Found value",
    notes: null,
    knownBugs: null,
    credits: null,
  }),
  "Intro.\n\nRequirements:\nFound value\nUnrelated sentence",
  "Do not remove a section when the extracted value does not match its full contents"
);

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
