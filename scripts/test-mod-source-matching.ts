import assert from "node:assert/strict";
import {
  decideGtaInsideImport,
  findUniqueGtaInsideSourceMatch,
  getSourceMatchTitleAlternates,
  getSourceMatchTitleSearchPatterns,
  getSourceMatchTitleSearchPattern,
  isDiscoveryMatchCandidateVisible,
  normalizeSourceMatchTitle,
  resolveGtaInsideSourceMatch,
} from "../lib/connectors/modSourceMatch";
import { getDisplayableModSources } from "../lib/connectors/modSourceLinks";
import { normalizeGta5ModsProjectUrl } from "../lib/connectors/sourceProjectUrl";
import { parseCreatorBackupUrl } from "../lib/server/creatorBackupUrl";

const candidate = {
  id: "audi-mod",
  title: "Audi ABT XGT 2024 [Add-On / FiveM]",
  creator: "Asyr0n",
};
const project = {
  platform: "gtainside",
  externalId: "211505",
  title: "Audi ABT XGT 2024",
  author: "asyr0n",
};

assert.equal(normalizeSourceMatchTitle(candidate.title), "audi abt xgt 2024");
assert.equal(getSourceMatchTitleSearchPattern(candidate.title), "%audi%abt%xgt%2024%");
assert.deepEqual(getSourceMatchTitleSearchPatterns("2024 Audi ABT XGT [Add-On / FiveM]"), ["%2024%", "%audi%", "%abt%", "%xgt%"]);
const truncatedFordUrl = "https://www.gtainside.com/gta5/cars/211505-ford-mustang-gt-2024-add-on-fivem";
assert.deepEqual(getSourceMatchTitleAlternates("Ford Mustang GT...", truncatedFordUrl), ["Ford Mustang GT", "ford mustang gt 2024 add on fivem"]);
assert.ok(getSourceMatchTitleSearchPatterns("Ford Mustang GT...", truncatedFordUrl).includes("%fivem%"), "URL slug terms broaden candidate discovery past truncated card text");
assert.equal(findUniqueGtaInsideSourceMatch(project, [candidate])?.id, candidate.id);
assert.equal(
  findUniqueGtaInsideSourceMatch({ ...project, author: "  ASYR0N.  " }, [candidate])?.id,
  candidate.id,
  "creator capitalization, surrounding whitespace, and punctuation do not block normalized matching"
);
assert.equal(findUniqueGtaInsideSourceMatch({ ...project, author: null }, [candidate]), null);
assert.equal(findUniqueGtaInsideSourceMatch({ ...project, title: "Audi ABT XGT" }, [candidate]), null);
assert.equal(
  findUniqueGtaInsideSourceMatch(project, [candidate, { ...candidate, id: "duplicate" }]),
  null,
  "ambiguous ModVault matches must not be attached"
);
assert.equal(
  findUniqueGtaInsideSourceMatch(project, [candidate], [project, { ...project, externalId: "67890" }]),
  null,
  "duplicate source listings must remain for review"
);
assert.equal(resolveGtaInsideSourceMatch(project, [candidate, { ...candidate, id: "duplicate" }]).ambiguous, true);
assert.equal(resolveGtaInsideSourceMatch({ ...project, author: null }, [candidate]).ambiguous, true);
assert.equal(
  decideGtaInsideImport({ ...project, title: "2024 Audi ABT XGT [Add-On]" }, [candidate]).kind,
  "review",
  "a harmless word-order variation is surfaced for comparison, not auto-linked"
);
assert.equal(
  decideGtaInsideImport({ ...project, title: "Audi ABT XGT 2024 RS" }, [candidate]).kind,
  "review",
  "a close title variation is surfaced for review"
);
assert.equal(
  decideGtaInsideImport({ ...project, title: "Audi ABT XGT 2025" }, [candidate]).kind,
  "review",
  "different year/model numbers remain review-only rather than being silently imported as new"
);
assert.equal(findUniqueGtaInsideSourceMatch({ ...project, title: "Ford Mustang GT...", author: "[DTD] Asyr0n", projectUrl: truncatedFordUrl }, [{
  ...candidate, id: "ford", title: "Ford Mustang GT 2024 [Add-On / FiveM]", creator: "Asyr0n [DTD]",
}]), null, "truncated titles and their full URL slugs can suggest a candidate but never auto-link");
assert.equal(decideGtaInsideImport({ ...project, title: "Ford Mustang GT...", author: "[DTD] Asyr0n", projectUrl: truncatedFordUrl }, [{
  ...candidate, id: "ford", title: "Ford Mustang GT 2024 [Add-On / FiveM]", creator: "Asyr0n [DTD]",
}]).kind, "review", "a candidate found from a truncated card title is surfaced for review");
const ferrariSergioProject = {
  ...project,
  externalId: "105287",
  title: "2013 Pininfarina Ferrari Sergio [Add-On / Replace | HQ] v1.0",
  author: "[DTD] Asyr0n",
  projectUrl: "https://www.gtainside.com/gta5/cars/ferrari/105287-2013-pininfarina-ferrari-sergio-add-on-replace-hq-v1-0",
};
const ferrariSergioCandidate = {
  ...candidate,
  id: "ferrari-sergio",
  title: "2013 Pininfarina Ferrari Sergio [Add-On / Replace]",
};
assert.ok(
  getSourceMatchTitleAlternates(ferrariSergioProject.title, ferrariSergioProject.projectUrl).includes("2013 Pininfarina Ferrari Sergio"),
  "the trailing format/version suffix yields a conservative core-title review hint"
);
assert.equal(
  decideGtaInsideImport(ferrariSergioProject, [ferrariSergioCandidate]).kind,
  "review",
  "the live Ferrari Sergio listing’s trailing HQ/version text suggests its published core-title candidate for review, never auto-link"
);
assert.equal(
  findUniqueGtaInsideSourceMatch(ferrariSergioProject, [ferrariSergioCandidate]),
  null,
  "release-version suffix cleanup cannot authorize an automatic source link"
);
assert.equal(
  decideGtaInsideImport({ ...project, author: "Different Creator" }, [candidate]).kind,
  "review",
  "a plausible title with a different creator requires review"
);
assert.equal(
  decideGtaInsideImport({ ...project, author: "  ASYR0N--- " }, [candidate]).kind,
  "cross_source_duplicate",
  "creator punctuation and spacing differences normalize conservatively"
);
assert.equal(
  decideGtaInsideImport({ ...project, author: "[DTD] Asyr0n" }, [candidate]).kind,
  "cross_source_duplicate",
  "the known GTAInside team tag does not block exact unique title and creator matching"
);
assert.equal(
  decideGtaInsideImport(project, [candidate]).kind,
  "cross_source_duplicate",
  "Audi ABT XGT 2024 from GTAInside matches its existing GTA5-Mods record"
);
assert.deepEqual(
  decideGtaInsideImport({ ...project, author: null }, [candidate]),
  { kind: "review", candidates: [candidate] },
  "missing creator data must block automatic import"
);
assert.equal(
  decideGtaInsideImport({ ...project, author: "" }, []).kind,
  "review",
  "missing creator data remains review-only even when no title candidate was loaded"
);
assert.equal(
  decideGtaInsideImport(project, [candidate, { ...candidate, id: "duplicate" }]).kind,
  "review",
  "ambiguous cross-source matches must block automatic import"
);
assert.equal(
  decideGtaInsideImport(project, [candidate, { ...candidate, id: "different-owner" }]).kind,
  "review",
  "multiple plausible records require review"
);
assert.equal(
  decideGtaInsideImport({ ...project, title: "Different vehicle" }, [candidate]).kind,
  "new",
  "a genuinely different title can continue through the legitimate import flow"
);
const sameSourceCandidate = { ...candidate, source_url: "https://www.gtainside.com/gta5/mods/12345-audi-xgt" };
assert.deepEqual(
  decideGtaInsideImport(project, [candidate], sameSourceCandidate),
  { kind: "same_source_duplicate", mod: sameSourceCandidate },
  "same-source duplicates remain blocked before insertion"
);
assert.equal(
  decideGtaInsideImport(project, [candidate]).kind === "new",
  false,
  "a unique cross-source duplicate is rejected before the route reaches its insert"
);

const selectedCreatorDraft = { ...candidate, id: "owned-draft", status: "draft", creator_id: "creator-a" };
const otherCreatorDraft = { ...candidate, id: "private-draft", status: "draft", creator_id: "creator-b" };
const publicPublished = { ...candidate, id: "published", status: "published", visibility: "public" };
assert.equal(isDiscoveryMatchCandidateVisible(selectedCreatorDraft, "creator-a"), true, "eligible selected-creator drafts can be considered");
assert.equal(isDiscoveryMatchCandidateVisible(otherCreatorDraft, "creator-a"), false, "another creator's draft is excluded from Discovery matching");
assert.equal(isDiscoveryMatchCandidateVisible(publicPublished, "creator-a"), true, "public published records remain matchable");
assert.equal(isDiscoveryMatchCandidateVisible({ ...publicPublished, visibility: "private" }, "creator-a"), false, "non-public published records are excluded");
assert.equal(isDiscoveryMatchCandidateVisible(selectedCreatorDraft, null), false, "drafts are not considered without an authorized selected creator");
assert.equal(
  findUniqueGtaInsideSourceMatch(project, [selectedCreatorDraft])?.id,
  selectedCreatorDraft.id,
  "an eligible draft can be matched using the same conservative title and creator rules"
);
assert.equal(
  findUniqueGtaInsideSourceMatch(project, [otherCreatorDraft].filter((row) => isDiscoveryMatchCandidateVisible(row, "creator-a"))),
  null,
  "inaccessible draft records cannot produce a match"
);
assert.equal(
  findUniqueGtaInsideSourceMatch({ ...project, platform: "gta5mods" }, [candidate]),
  null,
  "cross-platform matching is restricted to the GTAInside integration"
);

assert.equal(
  normalizeGta5ModsProjectUrl("https://gta5-mods.com/vehicles/audi-abt-xgt#description_tab"),
  "https://www.gta5-mods.com/vehicles/audi-abt-xgt",
  "normalizing an additional source must not alter the primary URL stored on the mod"
);
assert.equal(normalizeGta5ModsProjectUrl("https://example.com/vehicles/audi"), null);

assert.deepEqual(parseCreatorBackupUrl(""), { valid: true, url: null }, "an empty backup clears the field");
assert.equal(parseCreatorBackupUrl("https://drive.google.com/file/d/abc").valid, true);
assert.equal(parseCreatorBackupUrl("http://drive.google.com/file/d/abc").valid, false);
assert.equal(parseCreatorBackupUrl("javascript:alert(1)").valid, false);
assert.equal(parseCreatorBackupUrl("https://user:pass@drive.google.com/file/d/abc").valid, false);

const sources = [
  { canonical_url: "https://www.gtainside.com/gta5/mods/12345-audi-xgt", platform: { slug: "gtainside", name: "GTAinside" } },
  { canonical_url: "https://www.gta5-mods.com/vehicles/audi-xgt", platform: { slug: "gta5mods", name: "GTA5-Mods" } },
];
assert.equal(getDisplayableModSources([]).length, 0, "empty sources disable the selector");
assert.equal(getDisplayableModSources([sources[0]]).length, 1, "one source remains selectable");
assert.equal(getDisplayableModSources(sources).length, 2, "multiple platforms appear separately");
assert.equal(getDisplayableModSources([
  ...sources,
  { canonical_url: "javascript:alert(1)", platform: { slug: "evil", name: "Unsafe" } },
]).length, 2, "unsafe external URLs are never shown");

console.log("Mod source matching and import duplicate-decision tests passed.");
