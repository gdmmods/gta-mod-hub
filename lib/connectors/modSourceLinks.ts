export type ModSourceRow = {
  canonical_url: string;
  platform: { slug: string; name: string } | null;
};

export type DisplayableModSource = ModSourceRow & { url: string };

export function getDisplayableModSources(sources: ModSourceRow[]): DisplayableModSource[] {
  const seen = new Set<string>();
  const result: DisplayableModSource[] = [];

  for (const source of sources) {
    if (!source.platform?.slug || !source.platform.name) continue;
    try {
      const url = new URL(source.canonical_url);
      if (url.protocol !== "https:" || url.username || url.password) continue;
      const canonicalUrl = url.href;
      const key = `${source.platform.slug}:${canonicalUrl}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ ...source, url: canonicalUrl });
    } catch {
      // Malformed rows are not exposed as outbound links.
    }
  }

  return result;
}
