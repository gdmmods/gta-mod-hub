import type { Gta5ModsDetails } from "./gta5ModsDetails";

type ExtractedDescriptionSection = Pick<
  Gta5ModsDetails,
  "features" | "requirements" | "notes" | "knownBugs" | "credits"
>;

const SECTION_LABELS = [
  { heading: "Features", field: "features" },
  { heading: "Requirements", field: "requirements" },
  { heading: "Notes(?:\\s*\\/\\s*Known Bugs)?", field: "notes" },
  { heading: "Known Bugs", field: "knownBugs" },
  { heading: "Credits", field: "credits" },
] as const;

/**
 * Remove extracted sections from the creator-facing preview description.
 * The parser's original full description remains untouched for other uses.
 * A section is removed only when its extracted text matches the description
 * immediately after the matching heading.
 */
export function getGta5ModsPreviewDescription(
  description: string | null,
  extracted: ExtractedDescriptionSection
): string | null {
  if (!description) {
    return null;
  }

  let previewDescription = description;

  for (const { heading, field } of SECTION_LABELS) {
    const extractedText = extracted[field]?.trim();

    if (!extractedText) {
      continue;
    }

    const headingRegex = new RegExp(
      `(^|\\n)[\\t ]*${heading === "Notes(?:\\s*\\/\\s*Known Bugs)?" ? heading : heading.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}:?[\\t ]*(?:\\r?\\n|$)`,
      "i"
    );
    const headingMatch = headingRegex.exec(previewDescription);

    if (!headingMatch) {
      continue;
    }

    const bodyStart = headingMatch.index + headingMatch[0].length;
    const body = previewDescription.slice(bodyStart);
    const leadingWhitespace = body.match(/^\s*/)?.[0].length ?? 0;
    const content = body.slice(leadingWhitespace);
    const target = extractedText.replace(/\s+/g, " ");

    let sourceIndex = 0;
    let targetIndex = 0;

    while (sourceIndex < content.length && targetIndex < target.length) {
      if (/\s/.test(content[sourceIndex])) {
        if (!/\s/.test(target[targetIndex])) {
          break;
        }

        while (sourceIndex < content.length && /\s/.test(content[sourceIndex])) {
          sourceIndex += 1;
        }
        targetIndex += 1;
        continue;
      }

      if (content[sourceIndex] !== target[targetIndex]) {
        break;
      }

      sourceIndex += 1;
      targetIndex += 1;
    }

    const tail = content.slice(sourceIndex).trim();
    const tailStartsAtNextSection =
      /^(?:Features|Requirements|Notes(?:\s*\/\s*Known Bugs)?|Known Bugs|Credits):?[\t ]*(?:\r?\n|$)/i.test(tail);
    const tailStartsAtKnownBugsEnding =
      field === "knownBugs" && /^(?:Install and Enjoy\s*;?\s*\)?|See Ya Soon Peeps\.?|INSTALL IN README\b)/i.test(tail);
    const tailStartsAtCreditsEnding =
      field === "credits" && /^[*\-\s]*INSTALL IN README\b/i.test(tail);
    const matchedWholeSection =
      targetIndex === target.length &&
      (tail.length === 0 || tailStartsAtNextSection || tailStartsAtKnownBugsEnding || tailStartsAtCreditsEnding);

    if (!matchedWholeSection) {
      continue;
    }

    const precedingNewline = headingMatch[1] === "\n" ? 1 : 0;
    const removeStart = headingMatch.index + precedingNewline;
    const removeEnd = bodyStart + leadingWhitespace + sourceIndex;

    previewDescription =
      previewDescription.slice(0, removeStart) +
      previewDescription.slice(removeEnd);
  }

  return previewDescription
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim() || null;
}
