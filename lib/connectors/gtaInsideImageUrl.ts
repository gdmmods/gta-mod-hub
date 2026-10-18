const GTAINSIDE_HOSTS = new Set(["gtainside.com", "www.gtainside.com"]);

/**
 * GTAinside page cards and og:image use /s/ image paths while detail pages
 * link to the corresponding full-size /b/ image. Only normalize the observed
 * GTAinside image path format; leave other URLs untouched.
 */
export function normalizeGtaInsideImageUrl(value: string): string {
  try {
    const url = new URL(value);
    if (!GTAINSIDE_HOSTS.has(url.hostname.toLowerCase())) return value;

    const normalizedPath = url.pathname.replace(
      /^(\/img\/\d{6})\/s(?=\/[^/]+\.(?:jpe?g|png|webp)$)/i,
      "$1/b"
    );
    if (normalizedPath === url.pathname) return value;
    url.hostname = "www.gtainside.com";
    url.pathname = normalizedPath;
    return url.href;
  } catch {
    return value;
  }
}
