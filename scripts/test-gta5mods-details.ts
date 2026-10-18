
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  extractGta5ModsDetails,
} from "../lib/connectors/gta5ModsDetails";
import { getGta5ModsPreviewDescription } from "../lib/connectors/gta5ModsDescriptionPreview";
import { mergeDiscoveryPreview } from "../components/discover/mergeDiscoveryPreview";
import { normalizeGta5ModsImageUrl } from "../lib/connectors/gta5ModsImageUrl";

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

const blockHeadingHtml = `<section class="description-body"><div><p>Intro that stays.</p><h3>Features</h3><p>Openable doors</p><p>Working lights</p><h3>Requirements</h3><p>Game build 3095</p><h3>Notes / Known Bugs</h3><p>Minor texture issue</p><h3>Credits</h3><p>Artist name</p><p><strong>INSTALL IN README</strong></p><p>Unrelated ending text stays.</p></div></section>`;
const blockHeading = extractGta5ModsDetails(blockHeadingHtml, projectUrl);
assert.equal(blockHeading.features, "Openable doors\n\nWorking lights");
assert.equal(blockHeading.requirements, "Game build 3095");
assert.equal(blockHeading.notes, "Minor texture issue");
assert.equal(blockHeading.credits, "Artist name");
assert.equal(
  getGta5ModsPreviewDescription(blockHeading.description, blockHeading),
  "Intro that stays.\n\nINSTALL IN README\nUnrelated ending text stays."
);

const mergedPreview = mergeDiscoveryPreview({
  platform: "gta5mods", externalId: "sample", title: "Discovery title", projectUrl,
}, {
  title: "Source title", description: "Short meta description", author: "Artist",
  category: "vehicles", imageUrl: null, screenshots: [], projectUrl, parsedDetails: blockHeading,
});
assert.equal(mergedPreview.title, "Source title");
assert.equal(mergedPreview.description, blockHeading.description);
assert.equal(mergedPreview.parsedDetails, blockHeading);

assert.equal(details.fileSize, "50.4 MB");
assert.equal(details.downloads, 7582);
assert.equal(details.lastUpdated, "June 06, 2023");

assert.ok(details.image, "Expected a cover image");
assert.ok(details.images.length > 0, "Expected gallery images");
assert.ok(
  !details.images.includes(details.image),
  "Gallery must not duplicate the cover image"
);
assert.equal(
  normalizeGta5ModsImageUrl("https://img.gta5-mods.com/q75-w350-h233-cfill/images/audi-abt-xgt-2024-v1-0-sp/8d9df8-Screenshot_3.jpg"),
  "https://img.gta5-mods.com/q95/images/audi-abt-xgt-2024-v1-0-sp/8d9df8-Screenshot_3.jpg"
);
assert.equal(
  normalizeGta5ModsImageUrl("https://img.gta5-mods.com/q80-w800/images/example/shot.webp"),
  "https://img.gta5-mods.com/q95/images/example/shot.webp"
);
const fullQualityImage = "https://img.gta5-mods.com/q95/images/example/shot.jpg";
assert.equal(normalizeGta5ModsImageUrl(fullQualityImage), fullQualityImage);
const externalImage = "https://cdn.example.test/q75-w350-h233-cfill/images/example/shot.jpg";
assert.equal(normalizeGta5ModsImageUrl(externalImage), externalImage);
assert.equal(details.image, "https://img.gta5-mods.com/q75/images/pontiac-gto-convertible-1966-animated-roof-add-on-fivem-template/aa9bc8-Screenshot_61.jpg", "Primary image behavior remains unchanged");
assert.ok(details.images.includes("https://img.gta5-mods.com/q95/images/pontiac-gto-convertible-1966-animated-roof-add-on-fivem-template/aa9bc8-Screenshot_62.jpg"), "Gallery uses the full-resolution link from source markup");

console.log("GTA5-Mods parser fixture checks passed.");
