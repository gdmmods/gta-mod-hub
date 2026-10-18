/**
 * GTA5-Mods gallery links use q95 while responsive thumbnail paths include
 * dimensions (for example q75-w350-h233-cfill). Restrict this rewrite to
 * dimensioned image paths on the GTA5-Mods image CDN.
 */
export function normalizeGta5ModsImageUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.hostname.toLowerCase() !== "img.gta5-mods.com") return value;

    const normalizedPath = url.pathname.replace(
      /^\/q\d+-w\d+(?:-h\d+)?(?:-c[a-z]+)?(?=\/images\/)/i,
      "/q95"
    );
    if (normalizedPath === url.pathname) return value;
    url.pathname = normalizedPath;
    return url.href;
  } catch {
    return value;
  }
}
