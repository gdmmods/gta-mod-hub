import type { GtaInsideDetails } from "./gtaInsideDetails";

type ExtractedSections = Pick<GtaInsideDetails, "features" | "requirements" | "notes" | "knownBugs" | "credits">;

const SECTION_LABELS = [
  { heading: "Features", field: "features" },
  { heading: "Requirements", field: "requirements" },
  { heading: "Notes(?:\\s*\\/\\s*Known Bugs)?", field: "notes" },
  { heading: "Known Bugs", field: "knownBugs" },
  { heading: "Credits", field: "credits" },
] as const;

/**
 * Remove only sections that the GTAInside parser extracted to a source block
 * boundary. Preserve any trailing text after the exact extracted value.
 */
export function getGtaInsidePreviewDescription(
  description: string | null,
  extracted: ExtractedSections
): string | null {
  if (!description) return null;
  let result = description;

  for (const { heading, field } of SECTION_LABELS) {
    const extractedText = extracted[field]?.trim();
    if (!extractedText) continue;

    const headingPattern = new RegExp(
      `(^|\\n)[\\t ]*${heading}:?[\\t ]*(?:\\r?\\n|$)`,
      "i"
    );
    const headingMatch = headingPattern.exec(result);
    if (!headingMatch) continue;

    const bodyStart = headingMatch.index + headingMatch[0].length;
    const body = result.slice(bodyStart);
    const leadingWhitespace = body.match(/^\s*/)?.[0].length ?? 0;
    const content = body.slice(leadingWhitespace);
    const target = extractedText.replace(/\s+/g, " ");
    let sourceIndex = 0;
    let targetIndex = 0;

    while (sourceIndex < content.length && targetIndex < target.length) {
      if (/\s/.test(content[sourceIndex])) {
        if (!/\s/.test(target[targetIndex])) break;
        while (sourceIndex < content.length && /\s/.test(content[sourceIndex])) sourceIndex += 1;
        targetIndex += 1;
      } else if (content[sourceIndex] === target[targetIndex]) {
        sourceIndex += 1;
        targetIndex += 1;
      } else {
        break;
      }
    }

    if (targetIndex !== target.length) continue;
    const tail = content.slice(sourceIndex);
    if (tail.length > 0 && !/^\s/.test(tail)) continue;

    const precedingNewline = headingMatch[1] === "\n" ? 1 : 0;
    const removeStart = headingMatch.index + precedingNewline;
    const removeEnd = bodyStart + leadingWhitespace + sourceIndex;
    result = result.slice(0, removeStart) + result.slice(removeEnd);
  }

  return result
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim() || null;
}
