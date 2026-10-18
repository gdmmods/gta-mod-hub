import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  extractGtaInsideProjects,
  extractGtaInsideNextProfilePage,
  isGtaInsideSourceRecord,
  getGtaInsideExternalId,
  isSameGtaInsideProject,
  isValidGtaInsideProfileUrl,
  normalizeGtaInsideProjectUrl,
} from "../lib/connectors/gtainside";
import { extractGtaInsideDetails } from "../lib/connectors/gtaInsideDetails";
import { normalizeGtaInsideImageUrl } from "../lib/connectors/gtaInsideImageUrl";
import { isValidGta5ModsProjectUrl } from "../lib/connectors/sourceProjectUrl";
import { getGtaInsidePreviewDescription } from "../lib/connectors/gtaInsideDescriptionPreview";
import {
  getSourceDescriptionDisplayValues,
  getSourceUpdateValues,
  SOURCE_DESCRIPTION_PLACEHOLDER,
  validateAcceptedUpdateValues,
} from "../lib/server/discovery-update-values";

const profileFixture = readFileSync(join(process.cwd(), "scripts/fixtures/gtainside-profile.html"), "utf8");
const detailFixture = readFileSync(join(process.cwd(), "scripts/fixtures/gtainside-detail.html"), "utf8");

assert.equal(isValidGtaInsideProfileUrl("https://www.gtainside.com/profile/5piderman"), true);
assert.equal(isValidGtaInsideProfileUrl("https://gtainside.com/profile/Clover%20Turbo/"), true);
assert.equal(isValidGtaInsideProfileUrl("http://www.gtainside.com/profile/5piderman"), false);
assert.equal(isValidGtaInsideProfileUrl("https://evil.example/profile/5piderman"), false);
assert.equal(isValidGtaInsideProfileUrl("https://www.gtainside.com/profile/../gta5"), false);

const projectUrl = "https://gtainside.com/gta5/mods/modifications/222223-handling-ferrari-f12-tdf/?ref=profile#details";
const canonicalUrl = "https://www.gtainside.com/gta5/mods/modifications/222223-handling-ferrari-f12-tdf";
assert.equal(normalizeGtaInsideProjectUrl(projectUrl), canonicalUrl);
assert.equal(getGtaInsideExternalId(projectUrl), "222223");
assert.equal(normalizeGtaInsideProjectUrl("http://www.gtainside.com/gta5/mods/123-name"), null);
assert.equal(normalizeGtaInsideProjectUrl("https://gtainside.com.evil.example/gta5/mods/123-name"), null);
assert.equal(normalizeGtaInsideProjectUrl("https://www.gtainside.com/gta5/mods/123-name/download"), null);
assert.equal(isSameGtaInsideProject("222223", canonicalUrl, projectUrl), true);
assert.equal(isSameGtaInsideProject("222224", canonicalUrl, projectUrl), false);
assert.equal(isSameGtaInsideProject("222223", canonicalUrl.replace("handling-ferrari-f12-tdf", "updated-title"), canonicalUrl), true,
  "The stable GTAInside ID remains the identity when the page slug changes");
assert.equal(isGtaInsideSourceRecord("gtainside", "222223", canonicalUrl, projectUrl), true);
assert.equal(isGtaInsideSourceRecord(null, "222223", canonicalUrl, projectUrl), true,
  "A validated GTAInside canonical URL and stable ID can identify legacy records without origin");
assert.equal(isGtaInsideSourceRecord("gta5mods", "222223", canonicalUrl, projectUrl), false);
assert.equal(isValidGta5ModsProjectUrl("https://www.gta5-mods.com/vehicles/sample-mod"), true);
assert.equal(isValidGta5ModsProjectUrl("https://evil.example/vehicles/sample-mod"), false);

const fullImage = "https://www.gtainside.com/img/202609/b/cd1e1adc7b765f7362d44a1c77262065.jpg";
assert.equal(
  normalizeGtaInsideImageUrl("https://www.gtainside.com/img/202609/s/cd1e1adc7b765f7362d44a1c77262065.jpg"),
  fullImage
);
assert.equal(normalizeGtaInsideImageUrl(fullImage), fullImage);
assert.equal(normalizeGtaInsideImageUrl("https://cdn.example.test/img/202609/s/image.jpg"), "https://cdn.example.test/img/202609/s/image.jpg");

const discovered = extractGtaInsideProjects(profileFixture);
assert.equal(extractGtaInsideNextProfilePage(profileFixture, "https://www.gtainside.com/profile/5piderman", 1), 2);
assert.equal(extractGtaInsideNextProfilePage(profileFixture, "https://www.gtainside.com/profile/other", 1), null,
  "Pagination must not cross to another creator profile");
assert.equal(discovered.length, 1, "Only GTA V mod pages should be discovered");
assert.equal(discovered[0].externalId, "222223");
assert.equal(discovered[0].title, "Handling Ferrari F12 Tdf");
assert.equal(discovered[0].author, "5piderman");
assert.equal(discovered[0].category, "Mods / Modifications");
assert.equal(discovered[0].projectUrl, canonicalUrl);
assert.equal(discovered[0].imageUrl, fullImage, "Listing thumbnail should map to the full-size GTAInside image variant");

const details = extractGtaInsideDetails(detailFixture, canonicalUrl);
assert.equal(details.title, "Handling Ferrari F12 Tdf");
assert.equal(details.category, "Mods / Modifications");
assert.equal(details.image, fullImage, "The primary image should prefer the full-size source variant");
assert.deepEqual(details.images, ["https://www.gtainside.com/img/202609/b/second-screen.jpg"]);
assert.equal(details.downloadUrl, `${canonicalUrl}/download`);
assert.equal(details.downloads, 308);
assert.equal(details.lastUpdated, "09/30/2026");
assert.equal(details.features, "Stable high-speed handling\nSoft suspension");
assert.equal(details.requirements, "GTA V current version");
assert.equal(details.notes, "Install the handling file carefully.");
assert.equal(details.knownBugs, "Minor steering issue.");
assert.equal(details.credits, "Model by Example Artist", "A paragraph boundary keeps unrelated trailing prose out of credits");
assert.ok(details.description?.includes("Unrelated ending instructions remain in full."));
assert.ok(!details.description?.includes("Truncated metadata description"), "Full detail description must be used instead of truncated metadata");

const sparseDetails = extractGtaInsideDetails(
  "<html><body><h1>Sparse project</h1><div id=\"moreContentDiv\"><p>Full text</p></div></body></html>",
  "https://www.gtainside.com/gta5/mods/modifications/222223-handling-ferrari-f12-tdf"
);
assert.equal(sparseDetails.title, "Sparse project");
assert.equal(sparseDetails.image, null);
assert.equal(sparseDetails.downloadUrl, null);
const sparseValues = getSourceUpdateValues({
  platform: "gtainside", title: sparseDetails.title, description: sparseDetails.description,
  parsedDetails: sparseDetails,
});
assert.equal("image" in sparseValues, false);
assert.equal("features" in sparseValues, false);
assert.ok(!Object.values(sparseValues).includes(SOURCE_DESCRIPTION_PLACEHOLDER));

const previewDescription = getGtaInsidePreviewDescription(details.description, details);
assert.ok(previewDescription?.includes("Full introduction paragraph remains intact with details."));
assert.ok(previewDescription?.includes("Unrelated ending instructions remain in full."));
assert.ok(!previewDescription?.includes("Features:"));
assert.ok(!previewDescription?.includes("Requirements:"));
assert.ok(!previewDescription?.includes("Known Bugs:"));
assert.ok(!previewDescription?.includes("Credits:"));
assert.ok(previewDescription?.includes("Unrelated ending instructions remain in full."));
assert.equal(getGtaInsidePreviewDescription("Intro.\n\nFeatures:\nDifferent source text", {
  features: "Parsed but mismatched value", requirements: null, notes: null, knownBugs: null, credits: null,
}), "Intro.\n\nFeatures:\nDifferent source text", "Ambiguous extraction must remain in the description");

const sourceProject = {
  platform: "gtainside",
  externalId: "222223",
  projectUrl: canonicalUrl,
  title: details.title,
  description: details.description,
  category: details.category,
  author: "5piderman",
  imageUrl: details.image,
  screenshots: [details.image, ...details.images].filter((image): image is string => !!image),
  parsedDetails: details,
};
const updateValues = getSourceUpdateValues(sourceProject);
assert.equal(updateValues.title, details.title);
assert.equal(updateValues.description, previewDescription);
assert.equal(updateValues.category, "Mods / Modifications");
assert.equal(updateValues.creator, "5piderman");
assert.equal(updateValues.image, fullImage);
assert.equal(updateValues.images, JSON.stringify([fullImage, "https://www.gtainside.com/img/202609/b/second-screen.jpg"]));
assert.equal(updateValues.features, details.features);
assert.equal(updateValues.requirements, details.requirements);
assert.equal(updateValues.notes, "Notes:\nInstall the handling file carefully.\n\nKnown Bugs:\nMinor steering issue.");
assert.equal(updateValues.download_url, `${canonicalUrl}/download`);
assert.equal(updateValues.credits, "Model by Example Artist");
assert.deepEqual(getSourceDescriptionDisplayValues({ parsedDetails: details }), {
  requirements: details.requirements,
  notes: updateValues.notes,
});
assert.equal(SOURCE_DESCRIPTION_PLACEHOLDER, "None found in source description");
assert.deepEqual(validateAcceptedUpdateValues({ title: details.title, image: fullImage }), {
  title: details.title,
  image: fullImage,
});
assert.equal(validateAcceptedUpdateValues({ image: "http://not-secure.test/image.jpg" }), null);
assert.equal(validateAcceptedUpdateValues({ unknown_field: "value" }), null);

console.log("GTAInside discovery, parser, mapping and safety checks passed.");
