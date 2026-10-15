import assert from "node:assert/strict";
import {
  getSourceUpdateValues,
  getSourceDescriptionDisplayValues,
  SOURCE_DESCRIPTION_PLACEHOLDER,
  validateAcceptedUpdateValues,
} from "../lib/server/discovery-update-values";

const longDescription = `Opening paragraph.\n${"Full source description. ".repeat(2_000)}`;
const project = {
  title: "Source title",
  description: longDescription,
  category: "vehicles",
  author: "External creator",
  imageUrl: "https://cdn.example.test/cover.jpg",
  screenshots: ["https://cdn.example.test/cover.jpg", "https://cdn.example.test/gallery.jpg"],
  projectUrl: "https://www.gta5-mods.com/vehicles/sample",
  parsedDetails: {
    features: "Feature one\nFeature two",
    requirements: null,
    credits: "Model: Artist",
    knownBugs: "NONE",
    downloadUrl: "https://www.gta5-mods.com/vehicles/sample/download/12345",
  },
};

const proposed = getSourceUpdateValues(project);
assert.equal(proposed.title, "Source title");
assert.equal(proposed.description, longDescription.trim());
assert.ok((proposed.description?.length ?? 0) > 40_000, "The complete long source description must be retained");
assert.equal(proposed.category, "vehicles");
assert.equal(proposed.creator, "External creator");
assert.equal(proposed.image, "https://cdn.example.test/cover.jpg");
assert.equal(proposed.features, "Feature one\nFeature two");
assert.equal(proposed.credits, "Model: Artist");
assert.equal(proposed.download_url, project.parsedDetails.downloadUrl);
assert.equal("requirements" in proposed, false, "Unavailable source data must not propose an overwrite");
assert.equal("known_bugs" in proposed, false, "No unconfirmed database field may be proposed");
assert.equal(proposed.notes, "Known Bugs:\nNONE", "Known Bugs map to the confirmed notes column");
assert.equal(proposed.images, JSON.stringify(project.screenshots));

// ADD and UPDATE both use getSourceUpdateValues so imports receive the same supported fields.
const addSourceValues = getSourceUpdateValues({
  title: "Imported vehicle",
  description: "Description intro.\n\nRequirements:\nGame build 3095\n\nNotes:\nBack up files\n\nKnown Bugs:\nMinor texture issue\n\nCredits:\nArtist",
  category: "vehicles",
  author: "External artist",
  imageUrl: null,
  screenshots: ["https://cdn.example.test/gallery-1.jpg", "https://cdn.example.test/gallery-2.jpg"],
  parsedDetails: {
    features: "Openable doors",
    requirements: "Game build 3095",
    notes: "Back up files",
    knownBugs: "Minor texture issue",
    credits: "Artist",
    downloadUrl: "https://www.gta5-mods.com/vehicles/sample/download/12345",
  },
});
assert.deepEqual(addSourceValues, {
  title: "Imported vehicle",
  description: "Description intro.",
  category: "vehicles",
  creator: "External artist",
  image: "https://cdn.example.test/gallery-1.jpg",
  images: JSON.stringify(["https://cdn.example.test/gallery-1.jpg", "https://cdn.example.test/gallery-2.jpg"]),
  features: "Openable doors",
  requirements: "Game build 3095",
  notes: "Notes:\nBack up files\n\nKnown Bugs:\nMinor texture issue",
  credits: "Artist",
  download_url: "https://www.gta5-mods.com/vehicles/sample/download/12345",
});

assert.deepEqual(validateAcceptedUpdateValues({
  description: longDescription,
  features: "Feature one\nFeature two",
  download_url: project.parsedDetails.downloadUrl,
}), {
  description: longDescription,
  features: "Feature one\nFeature two",
  download_url: project.parsedDetails.downloadUrl,
});
assert.equal(validateAcceptedUpdateValues({ known_bugs: "NONE" }), null);
assert.equal(validateAcceptedUpdateValues({ requirements: "" }), null);

const sectionedDescription = "Intro that stays.\n\nRequirements:\nGame build 3095\n\nNotes:\nBack up your files\n\nKnown Bugs:\nMinor texture issue\n\nCredits:\nArtist";
const sectionedProject = {
  title: "Source title",
  description: sectionedDescription,
  parsedDetails: {
    requirements: "Game build 3095",
    notes: "Back up your files",
    knownBugs: "Minor texture issue",
    features: null,
    credits: "Artist",
  },
};
const sectionedValues = getSourceUpdateValues(sectionedProject);
assert.equal(sectionedValues.requirements, "Game build 3095");
assert.equal(sectionedValues.notes, "Notes:\nBack up your files\n\nKnown Bugs:\nMinor texture issue");
assert.equal(sectionedValues.description, "Intro that stays.");

const unsectionedProject = {
  title: "Source title",
  description: "Description with unrelated text only.",
  parsedDetails: { requirements: null, notes: null, knownBugs: null },
};
const unsectionedValues = getSourceUpdateValues(unsectionedProject);
assert.equal(unsectionedValues.description, unsectionedProject.description);
assert.equal("requirements" in unsectionedValues, false);
assert.equal("notes" in unsectionedValues, false);
assert.ok(!Object.values(unsectionedValues).includes(SOURCE_DESCRIPTION_PLACEHOLDER));
assert.deepEqual(getSourceDescriptionDisplayValues(unsectionedProject), {
  requirements: SOURCE_DESCRIPTION_PLACEHOLDER,
  notes: SOURCE_DESCRIPTION_PLACEHOLDER,
});

console.log("Discovery update value checks passed.");
