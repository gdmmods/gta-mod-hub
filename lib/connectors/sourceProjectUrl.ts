const GTA5_MODS_HOSTS = new Set(["gta5-mods.com", "www.gta5-mods.com"]);

/** Return the canonical project URL used by GTA5-Mods discovery records. */
export function normalizeGta5ModsProjectUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !GTA5_MODS_HOSTS.has(url.hostname.toLowerCase()) ||
      url.username || url.password || url.port
    ) return null;
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length !== 2 || segments[0].toLowerCase() === "users") return null;
    url.hostname = "www.gta5-mods.com";
    url.pathname = `/${segments.map((segment) => encodeURIComponent(decodeURIComponent(segment))).join("/")}`;
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

/** Validate the URL shape used by existing GTA5-Mods discovery records. */
export function isValidGta5ModsProjectUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !GTA5_MODS_HOSTS.has(url.hostname.toLowerCase()) ||
      url.username || url.password || url.port
    ) return false;
    const segments = url.pathname.split("/").filter(Boolean);
    return segments.length === 2 && segments[0].toLowerCase() !== "users";
  } catch {
    return false;
  }
}

export function normalizeGtaInsideProjectUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !["gtainside.com", "www.gtainside.com"].includes(url.hostname.toLowerCase()) ||
      url.username || url.password || url.port
    ) return null;

    const path = url.pathname.replace(/\/$/, "");
    if (!/^\/gta5\/(?:[a-z0-9-]+\/)+\d+-[a-z0-9][a-z0-9-]*$/i.test(path)) return null;

    url.hostname = "www.gtainside.com";
    url.pathname = path;
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}
