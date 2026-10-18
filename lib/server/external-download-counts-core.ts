export type ExternalDownloadCount = {
  platform: string;
  downloads: number | null;
  sourceKey?: string;
};

export type ExternalDownloadSummary = {
  total: number | null;
  availableSources: number;
  totalSources: number;
};

/** Count one source per supported platform; duplicate pages use the largest reported total. */
export function aggregateExternalDownloadCounts(counts: ExternalDownloadCount[]): number | null {
  const totalsByPlatform = new Map<string, number>();
  for (const { platform, downloads } of counts) {
    if (
      (platform !== "gtainside" && platform !== "gta5mods") ||
      downloads === null ||
      !Number.isSafeInteger(downloads) ||
      downloads < 0
    ) continue;
    totalsByPlatform.set(platform, Math.max(totalsByPlatform.get(platform) ?? 0, downloads));
  }
  return totalsByPlatform.size
    ? [...totalsByPlatform.values()].reduce((total, downloads) => total + downloads, 0)
    : null;
}

/**
 * Apply the mod-page rule (largest page count per platform for each mod), then
 * sum distinct listings across a creator while counting a linked listing once.
 */
export function aggregateCreatorExternalDownloadCounts(
  counts: Array<ExternalDownloadCount & { modId: string }>
): ExternalDownloadSummary {
  const valid = counts.filter(({ platform, downloads }) =>
    (platform === "gtainside" || platform === "gta5mods") &&
    downloads !== null && Number.isSafeInteger(downloads) && downloads >= 0
  );
  const allSources = new Set(counts
    .filter(({ platform, sourceKey }) => (platform === "gtainside" || platform === "gta5mods") && !!sourceKey)
    .map(({ platform, sourceKey }) => `${platform}:${sourceKey}`));
  const bestPerModPlatform = new Map<string, ExternalDownloadCount & { modId: string }>;
  for (const row of valid) {
    const key = `${row.modId}:${row.platform}`;
    const current = bestPerModPlatform.get(key);
    if (!current || row.downloads! > current.downloads!) bestPerModPlatform.set(key, row);
  }

  const seenSources = new Set<string>();
  let total = 0;
  let counted = 0;
  for (const row of bestPerModPlatform.values()) {
    const sourceKey = row.sourceKey ? `${row.platform}:${row.sourceKey}` : `${row.modId}:${row.platform}`;
    if (seenSources.has(sourceKey)) continue;
    seenSources.add(sourceKey);
    total += row.downloads!;
    counted += 1;
  }

  return {
    total: counted ? total : null,
    availableSources: new Set(valid.map(({ platform, sourceKey }) => `${platform}:${sourceKey ?? "unknown"}`)).size,
    totalSources: allSources.size,
  };
}
