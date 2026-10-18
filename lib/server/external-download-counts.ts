import { extractGtaInsideDetails } from "@/lib/connectors/gtaInsideDetails";
import { extractGta5ModsDetails } from "@/lib/connectors/gta5ModsDetails";
import { normalizeGtaInsideProjectUrl } from "@/lib/connectors/gtainside";
import { normalizeGta5ModsProjectUrl } from "@/lib/connectors/sourceProjectUrl";
import {
  aggregateCreatorExternalDownloadCounts,
  aggregateExternalDownloadCounts,
  type ExternalDownloadCount,
  type ExternalDownloadSummary,
} from "./external-download-counts-core";

export { aggregateExternalDownloadCounts } from "./external-download-counts-core";

export type ExternalDownloadSource = {
  platform: string;
  url: string;
};

export type CreatorExternalDownloadSource = ExternalDownloadSource & { modId: string };

async function fetchSourceDownloadCount(source: ExternalDownloadSource): Promise<ExternalDownloadCount> {
  const normalizedUrl = source.platform === "gtainside"
    ? normalizeGtaInsideProjectUrl(source.url)
    : source.platform === "gta5mods" ? normalizeGta5ModsProjectUrl(source.url) : null;
  if (!normalizedUrl) return { platform: source.platform, downloads: null, sourceKey: source.url };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(normalizedUrl, {
      headers: { "User-Agent": "ModVault External Download Counter", Accept: "text/html" },
      cache: "force-cache",
      next: { revalidate: 3600 },
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok || !(response.headers.get("content-type") ?? "").toLowerCase().includes("text/html")) {
      return { platform: source.platform, downloads: null, sourceKey: normalizedUrl };
    }
    const html = await response.text();
    const details = source.platform === "gtainside"
      ? extractGtaInsideDetails(html, normalizedUrl)
      : extractGta5ModsDetails(html, normalizedUrl);
    return { platform: source.platform, downloads: details.downloads, sourceKey: normalizedUrl };
  } catch {
    return { platform: source.platform, downloads: null, sourceKey: normalizedUrl };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getExternalDownloadTotal(sources: ExternalDownloadSource[]): Promise<number | null> {
  const unique = new Map<string, ExternalDownloadSource>();
  for (const source of sources) {
    const normalizedUrl = source.platform === "gtainside"
      ? normalizeGtaInsideProjectUrl(source.url)
      : source.platform === "gta5mods" ? normalizeGta5ModsProjectUrl(source.url) : null;
    if (normalizedUrl) unique.set(`${source.platform}:${normalizedUrl}`, { platform: source.platform, url: normalizedUrl });
  }
  if (!unique.size) return null;
  const counts = await Promise.all([...unique.values()].map(fetchSourceDownloadCount));
  return aggregateExternalDownloadCounts(counts);
}

export async function getCreatorExternalDownloadSummary(
  sources: CreatorExternalDownloadSource[]
): Promise<ExternalDownloadSummary> {
  const normalized = sources.flatMap((source) => {
    const url = source.platform === "gtainside"
      ? normalizeGtaInsideProjectUrl(source.url)
      : source.platform === "gta5mods" ? normalizeGta5ModsProjectUrl(source.url) : null;
    return url ? [{ modId: source.modId, platform: source.platform, url }] : [];
  });
  const unique = new Map<string, ExternalDownloadSource>();
  for (const source of normalized) unique.set(`${source.platform}:${source.url}`, { platform: source.platform, url: source.url });
  const fetched = new Map<string, ExternalDownloadCount>();
  await Promise.all([...unique.entries()].map(async ([key, source]) => {
    fetched.set(key, await fetchSourceDownloadCount(source));
  }));
  return aggregateCreatorExternalDownloadCounts(normalized.map((source) => ({
    ...fetched.get(`${source.platform}:${source.url}`)!,
    modId: source.modId,
  })));
}
