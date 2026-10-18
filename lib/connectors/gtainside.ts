import type { DiscoveredProject, PlatformConnector } from "./types";
import { normalizeGtaInsideImageUrl } from "./gtaInsideImageUrl";

const GTAINSIDE_HOSTS = new Set(["gtainside.com", "www.gtainside.com"]);
const GTAINSIDE_ORIGIN = "https://www.gtainside.com";
const MAX_PROFILE_PAGES = 20;

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");
}

function cleanText(value: string): string {
  return decodeHtml(value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}

function getAttribute(tag: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`\\b${escaped}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match?.[2] ? decodeHtml(match[2].trim()) : null;
}

export function normalizeGtaInsideProjectUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !GTAINSIDE_HOSTS.has(url.hostname.toLowerCase()) ||
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

export function getGtaInsideExternalId(value: unknown): string | null {
  const normalized = normalizeGtaInsideProjectUrl(value);
  if (!normalized) return null;
  const slug = new URL(normalized).pathname.split("/").filter(Boolean).at(-1) ?? "";
  return slug.match(/^(\d+)-/)?.[1] ?? null;
}

export function isSameGtaInsideProject(
  externalId: unknown,
  projectUrl: unknown,
  savedUrl: unknown
): boolean {
  const id = typeof externalId === "string" ? externalId : "";
  const canonicalUrl = normalizeGtaInsideProjectUrl(projectUrl);
  const canonicalSavedUrl = normalizeGtaInsideProjectUrl(savedUrl);
  return !!id && !!canonicalUrl && !!canonicalSavedUrl &&
    getGtaInsideExternalId(canonicalUrl) === id &&
    getGtaInsideExternalId(canonicalSavedUrl) === id;
}

export function isGtaInsideSourceRecord(
  origin: unknown,
  externalId: unknown,
  projectUrl: unknown,
  savedUrl: unknown
): boolean {
  // New imports carry an explicit origin. For older records with no origin,
  // the validated GTAinside host and stable numeric ID in source_url still
  // identify the source safely. A different explicit origin is never inferred.
  return (origin == null || origin === "gtainside") &&
    isSameGtaInsideProject(externalId, projectUrl, savedUrl);
}

function getProfileUsername(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !GTAINSIDE_HOSTS.has(url.hostname.toLowerCase()) ||
      url.username || url.password || url.port
    ) return null;
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length !== 2 || segments[0].toLowerCase() !== "profile") return null;
    const username = decodeURIComponent(segments[1]);
    if (!username || username === "." || username === ".." || /[\/\\\u0000-\u001f]/.test(username)) return null;
    return username;
  } catch {
    return null;
  }
}

export function isValidGtaInsideProfileUrl(value: string): boolean {
  return getProfileUsername(value) !== null;
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "ModVault Creator Connector",
      Accept: "text/html",
    },
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
  });

  if (response.status >= 300 && response.status < 400) {
    throw new Error("GTAinside redirected the request. Try again later.");
  }
  if (!response.ok) throw new Error(`GTAinside returned HTTP ${response.status}.`);
  if (!(response.headers.get("content-type") ?? "").toLowerCase().includes("text/html")) {
    throw new Error("GTAinside did not return an HTML page.");
  }
  return response.text();
}

function normalizeImage(raw: string | null, baseUrl: string): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw, baseUrl);
    if (
      url.protocol !== "https:" ||
      !GTAINSIDE_HOSTS.has(url.hostname.toLowerCase()) ||
      !/^\/img\/\d{6}\/[sb]\/[^/]+\.(?:jpe?g|png|webp)$/i.test(url.pathname)
    ) return null;
    return normalizeGtaInsideImageUrl(url.href);
  } catch {
    return null;
  }
}

function formatCategory(projectUrl: string): string | null {
  const segments = new URL(projectUrl).pathname.split("/").filter(Boolean).slice(1, -1);
  if (segments.length === 0) return null;
  return segments.map((part) => part
    .split("-")
    .map((word) => word ? word[0].toUpperCase() + word.slice(1) : "")
    .join(" ")).join(" / ");
}

export function extractGtaInsideProjects(html: string): DiscoveredProject[] {
  const projects: DiscoveredProject[] = [];
  const seen = new Set<string>();
  const anchorRegex = /<a\b[^>]*\bclass\s*=\s*(["'])[^"']*\bcustombox\b[^"']*\bmod\b[^"']*\1[^>]*>[\s\S]*?<\/a>/gi;
  let anchor: RegExpExecArray | null;

  while ((anchor = anchorRegex.exec(html))) {
    const openingTag = anchor[0].match(/^<a\b[^>]*>/i)?.[0];
    const href = openingTag ? getAttribute(openingTag, "href") : null;
    let projectUrl: string | null = null;
    if (href) {
      try {
        projectUrl = normalizeGtaInsideProjectUrl(new URL(href, GTAINSIDE_ORIGIN).href);
      } catch {
        continue;
      }
    }
    if (!openingTag || !projectUrl) continue;

    const externalId = getGtaInsideExternalId(projectUrl);
    if (!externalId || seen.has(externalId)) continue;
    const titleTag = anchor[0].match(/<h3\b[^>]*\bclass\s*=\s*(["'])[^"']*\bheadline_mod\b[^"']*\1[^>]*>([\s\S]*?)<\/h3>/i);
    const title = titleTag?.[2] ? cleanText(titleTag[2]) : "";
    if (!title) continue;

    const background = anchor[0].match(/\bstyle\s*=\s*(["'])[^"']*url\(\s*(["']?)([^)"']+)\2\s*\)[^"']*\1/i)?.[3] ?? null;
    const imageUrl = normalizeImage(background, GTAINSIDE_ORIGIN);
    const authorTag = anchor[0].match(/<i\b[^>]*\bclass\s*=\s*(["'])[^"']*\bfa-user\b[^"']*\1[^>]*>\s*<\/i>\s*([^<\n]+)/i);
    const author = authorTag?.[2] ? cleanText(authorTag[2]) : null;

    seen.add(externalId);
    projects.push({
      platform: "gtainside",
      externalId,
      title,
      projectUrl,
      imageUrl,
      author,
      category: formatCategory(projectUrl),
    });
  }

  return projects;
}

function isProfileListingHtml(html: string): boolean {
  return /<html\b/i.test(html) && /<body\b/i.test(html) &&
    (/<div\b[^>]*class=["'][^"']*pagination\s+paginator/i.test(html) ||
      /\b\d+\s+mods uploaded by\b/i.test(html) ||
      /<a\b[^>]*class=["'][^"']*\bcustombox\b[^"']*\bmod\b/i.test(html));
}

export function extractGtaInsideNextProfilePage(
  html: string,
  profileUrl: string,
  currentPage: number
): number | null {
  const expectedUsername = getProfileUsername(profileUrl)?.toLowerCase();
  if (!expectedUsername) return null;
  const anchors = /<a\b[^>]*>[\s\S]*?<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchors.exec(html))) {
    const openingTag = match[0].match(/^<a\b[^>]*>/i)?.[0];
    const href = openingTag ? getAttribute(openingTag, "href") : null;
    if (!href) continue;
    const label = cleanText(match[0].replace(/^<a\b[^>]*>/i, "").replace(/<\/a>$/i, "")).toLowerCase();
    if (!label.includes("next") && !label.includes("»")) continue;
    if (label.includes("previous") || label.includes("«")) continue;
    try {
      const url = new URL(href, GTAINSIDE_ORIGIN);
      if (!GTAINSIDE_HOSTS.has(url.hostname.toLowerCase())) continue;
      const pageMatch = url.pathname.match(/^\/profile\/([^/]+)\/mods\/(\d+)\/?$/i);
      const linkedUsername = pageMatch ? decodeURIComponent(pageMatch[1]).toLowerCase() : null;
      if (linkedUsername !== expectedUsername) continue;
      const page = pageMatch ? Number(pageMatch[2]) : NaN;
      if (Number.isSafeInteger(page) && page > currentPage && page <= MAX_PROFILE_PAGES) return page;
    } catch {
      // Ignore malformed pagination links.
    }
  }
  return null;
}

async function discoverProfile(profileUrl: string): Promise<DiscoveredProject[]> {
  const username = getProfileUsername(profileUrl);
  if (!username) throw new Error("Invalid GTAinside profile URL.");
  const encodedUsername = encodeURIComponent(username);
  const projects: DiscoveredProject[] = [];
  const seen = new Set<string>();

  const firstPageUrl = `${GTAINSIDE_ORIGIN}/profile/${encodedUsername}/mods/1`;
  let html = await fetchHtml(firstPageUrl);
  if (!isProfileListingHtml(html)) throw new Error("GTAinside profile listing could not be parsed.");

  let page = 1;
  const visitedPages = new Set<number>();
  while (page <= MAX_PROFILE_PAGES && !visitedPages.has(page)) {
    visitedPages.add(page);
    if (!isProfileListingHtml(html)) throw new Error("GTAinside profile listing could not be parsed.");

    const pageProjects = extractGtaInsideProjects(html);
    let added = 0;
    for (const project of pageProjects) {
      if (seen.has(project.externalId)) continue;
      seen.add(project.externalId);
      projects.push(project);
      added += 1;
    }
    if (added === 0) break;
    const nextPage = extractGtaInsideNextProfilePage(html, profileUrl, page);
    if (!nextPage || visitedPages.has(nextPage)) break;
    page = nextPage;
    html = await fetchHtml(`${GTAINSIDE_ORIGIN}/profile/${encodedUsername}/mods/${page}`);
  }

  return projects;
}

async function fetchProfile(profileUrl: string): Promise<string> {
  if (!isValidGtaInsideProfileUrl(profileUrl)) throw new Error("Invalid GTAinside profile URL.");
  return fetchHtml(profileUrl);
}

function extractAboutMe(html: string): string | null {
  const heading = /<h[1-6]\b[^>]*>\s*About\s+me\s*<\/h[1-6]>/i.exec(html);
  if (!heading) return null;
  const afterHeading = html.slice(heading.index + heading[0].length);
  const nextHeading = /<h[1-6]\b[^>]*>/i.exec(afterHeading);
  const section = nextHeading ? afterHeading.slice(0, nextHeading.index) : afterHeading.slice(0, 10000);
  return cleanText(section) || null;
}

export const gtaInsideConnector: PlatformConnector = {
  async discover(profileUrl: string): Promise<DiscoveredProject[]> {
    return discoverProfile(profileUrl);
  },

  verification: {
    instructions: async () =>
      "Edit your public GTAinside profile and append your ModVault verification code to the About Me section. Save your profile, then return here and click Check Verification. You can remove the code after verification succeeds.",
    start: async (profileUrl: string) => ({ supported: isValidGtaInsideProfileUrl(profileUrl) }),
    check: async (profileUrl: string, verificationCode: string): Promise<boolean> => {
      if (!/^[A-Z0-9-]{6,20}$/.test(verificationCode)) return false;
      try {
        const aboutMe = extractAboutMe(await fetchProfile(profileUrl));
        return aboutMe !== null && aboutMe.includes(verificationCode);
      } catch (error) {
        console.error("GTAINSIDE VERIFICATION ERROR:", error);
        return false;
      }
    },
  },
};
