export type ModSourceMatchCandidate = {
  id: string;
  title: string | null;
  creator: string | null;
  creator_id?: string | null;
  status?: string | null;
  visibility?: string | null;
};

type SourceProject = {
  platform: string;
  externalId: string;
  title: string;
  author?: string | null;
  projectUrl?: string | null;
  titleAlternates?: string[];
};

function stripKnownTitleSuffix(value: string): string {
  let title = value.trim();
  const metadata = /\b(?:add[\s-]?on|addon|fivem|five\s*m|template|replace|tuning|livery|lods|els|oiv)\b/i;
  let previous = "";

  while (title !== previous) {
    previous = title;
    title = title.replace(/\s*(?:\[([^\]]*)\]|\(([^)]*)\))\s*$/, (suffix, square, round) =>
      metadata.test(square ?? round ?? "") ? "" : suffix
    ).trim();
  }

  return title;
}

function normalizeMatchText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeSourceMatchTitle(value: unknown): string {
  return normalizeMatchText(typeof value === "string" ? stripKnownTitleSuffix(value) : "");
}

export function normalizeSourceMatchCreator(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase()
    .replace(/^\s*\[dtd\]\s*|\s*\[dtd\]\s*$/gi, "")
    .replace(/[^a-z0-9]/g, "");
}

/** A GTAInside URL slug can retain the complete title when a profile card truncates it. */
export function getSourceMatchTitleAlternates(value: unknown, projectUrl?: unknown): string[] {
  const alternates: string[] = [];
  if (typeof value === "string") {
    const cleaned = value.trim().replace(/(?:\.\.\.|…)+\s*$/, "").replace(/\s*[[(][^\])]*$/, "").trim();
    if (cleaned && cleaned !== value.trim()) alternates.push(cleaned);

    // A release suffix after a bracketed format label can hide an otherwise
    // matching core title. Keep this alternate review-only; it never drives
    // automatic matching because exact matching still uses the original title.
    const versionAfterMetadata = value.trim().match(/^(.*?)\s*\[((?:[^\]]*\b(?:add[\s-]?on|addon|fivem|five\s*m|template|replace|tuning|livery|lods|els|oiv)\b)[^\]]*)\]\s+(?:v|version)\s*\d+(?:\.\d+)*$/i);
    if (versionAfterMetadata?.[1]) alternates.push(versionAfterMetadata[1].trim());
  }
  if (typeof projectUrl === "string") {
    try {
      const url = new URL(projectUrl);
      if (
        url.protocol === "https:" &&
        ["gtainside.com", "www.gtainside.com"].includes(url.hostname.toLowerCase()) &&
        !url.username && !url.password && !url.port &&
        /^\/gta5\/(?:[a-z0-9-]+\/)+\d+-[a-z0-9][a-z0-9-]*$/i.test(url.pathname)
      ) {
        const slug = url.pathname.split("/").filter(Boolean).at(-1) ?? "";
        const titleSlug = slug.replace(/^\d+-/, "");
        if (titleSlug) alternates.push(decodeURIComponent(titleSlug).replace(/[-_]+/g, " "));
      }
    } catch {
      // Invalid URL text is never used as a title hint.
    }
  }
  return [...new Set(alternates.map((title) => title.trim()).filter(Boolean))];
}

/**
 * Produces a broad, punctuation-insensitive database search pattern. Results
 * must still pass the exact normalized title and creator checks below.
 */
export function getSourceMatchTitleSearchPattern(value: unknown): string | null {
  const title = normalizeSourceMatchTitle(value);
  const words = title.split(" ").filter(Boolean);
  return words.length ? `%${words.join("%")}%` : null;
}

/** Search each semantic token independently so title word order does not hide candidates. */
export function getSourceMatchTitleSearchPatterns(value: unknown, projectUrl?: unknown): string[] {
  const titles = [value, ...getSourceMatchTitleAlternates(value, projectUrl)];
  return [...new Set(titles.flatMap((title) => normalizeSourceMatchTitle(title).split(" ").filter((word) => word.length >= 3)))]
    .map((word) => `%${word}%`);
}

/** Discovery may match public records and drafts owned by its selected creator only. */
export function isDiscoveryMatchCandidateVisible(
  candidate: Pick<ModSourceMatchCandidate, "creator_id" | "status" | "visibility">,
  currentCreatorId: string | null | undefined
): boolean {
  if (candidate.status === "published") {
    return candidate.visibility === "public" || candidate.visibility === "early_access";
  }
  return Boolean(currentCreatorId && candidate.status === "draft" && candidate.creator_id === currentCreatorId);
}

function titleSimilarity(left: unknown, right: unknown): number {
  const leftWords = normalizeSourceMatchTitle(left).split(" ").filter(Boolean);
  const rightWords = normalizeSourceMatchTitle(right).split(" ").filter(Boolean);
  if (!leftWords.length || !rightWords.length) return 0;

  const leftSet = new Set(leftWords);
  const rightSet = new Set(rightWords);
  const intersection = [...leftSet].filter((word) => rightSet.has(word)).length;
  const sharedCoreWords = [...leftSet].filter((word) => rightSet.has(word) && !/\d/.test(word)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return sharedCoreWords >= 2 && union > 0 ? intersection / union : 0;
}

/**
 * Cross-source matching is deliberately exact after removing only common
 * trailing game/mod-format labels. Both creator identity and title must match,
 * and both sides must be unique in the current discovery batch.
 */
export function resolveGtaInsideSourceMatch<T extends ModSourceMatchCandidate>(
  project: SourceProject,
  candidates: T[],
  discoveredProjects: SourceProject[] = [project]
): { match: T | null; ambiguous: boolean; candidates: T[] } {
  if (project.platform !== "gtainside") return { match: null, ambiguous: false, candidates: [] };

  const title = normalizeSourceMatchTitle(project.title);
  const creator = normalizeSourceMatchCreator(project.author);
  if (!title) return { match: null, ambiguous: false, candidates: [] };

  const titleAlternates = [...(project.titleAlternates ?? []), ...getSourceMatchTitleAlternates(project.title, project.projectUrl)];
  const isTruncated = /(?:\.\.\.|…)\s*$/.test(project.title.trim());
  const plausible = candidates.filter((candidate) =>
    [project.title, ...titleAlternates].some((title) => titleSimilarity(title, candidate.title) >= 0.55)
  );
  if (!creator) return { match: null, ambiguous: true, candidates: plausible };

  const sameDiscoveredIdentity = discoveredProjects.filter((candidate) =>
    candidate.platform === "gtainside" &&
    normalizeSourceMatchTitle(candidate.title) === title &&
    normalizeSourceMatchCreator(candidate.author) === creator
  );
  if (sameDiscoveredIdentity.length !== 1) return { match: null, ambiguous: true, candidates: plausible };

  const matches = plausible.filter((candidate) =>
    normalizeSourceMatchTitle(candidate.title) === title && normalizeSourceMatchCreator(candidate.creator) === creator
  );

  // Only an exact normalized title and creator with no competing plausible title is linked automatically.
  if (!isTruncated && matches.length === 1 && plausible.length === 1) return { match: matches[0], ambiguous: false, candidates: plausible };
  return { match: null, ambiguous: plausible.length > 0, candidates: plausible };
}

export type GtaInsideImportDecision<T extends ModSourceMatchCandidate> =
  | { kind: "same_source_duplicate"; mod: T }
  | { kind: "cross_source_duplicate"; mod: T }
  | { kind: "review"; candidates: T[] }
  | { kind: "new" };

export function decideGtaInsideImport<T extends ModSourceMatchCandidate>(
  project: SourceProject,
  candidates: T[],
  sameSourceMatch: T | null = null
): GtaInsideImportDecision<T> {
  if (sameSourceMatch) return { kind: "same_source_duplicate", mod: sameSourceMatch };

  const result = resolveGtaInsideSourceMatch(project, candidates);
  if (result.match) return { kind: "cross_source_duplicate", mod: result.match };
  if (result.ambiguous) {
    return { kind: "review", candidates: result.candidates };
  }
  if (!normalizeSourceMatchCreator(project.author)) return { kind: "review", candidates: result.candidates };
  return { kind: "new" };
}

export function findUniqueGtaInsideSourceMatch<T extends ModSourceMatchCandidate>(
  project: SourceProject,
  candidates: T[],
  discoveredProjects: SourceProject[] = [project]
): T | null {
  return resolveGtaInsideSourceMatch(project, candidates, discoveredProjects).match;
}
