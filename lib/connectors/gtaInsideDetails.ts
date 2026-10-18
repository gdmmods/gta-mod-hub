import { extractDescriptionSection as extractSharedDescriptionSection } from "./gta5ModsDetails";
import { normalizeGtaInsideImageUrl } from "./gtaInsideImageUrl";

export type GtaInsideDetails = {
  title: string | null;
  description: string | null;
  image: string | null;
  images: string[];
  version: string | null;
  category: string | null;
  tags: string[];
  features: string | null;
  requirements: string | null;
  notes: string | null;
  credits: string | null;
  downloadUrl: string | null;
  fileSize: string | null;
  downloads: number | null;
  lastUpdated: string | null;
  knownBugs: string | null;
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, token: string) => {
    if (token.startsWith("#x")) {
      const point = Number.parseInt(token.slice(2), 16);
      return Number.isSafeInteger(point) && point >= 0 && point <= 0x10ffff
        ? String.fromCodePoint(point)
        : entity;
    }
    if (token.startsWith("#")) {
      const point = Number.parseInt(token.slice(1), 10);
      return Number.isSafeInteger(point) && point >= 0 && point <= 0x10ffff
        ? String.fromCodePoint(point)
        : entity;
    }
    const named: Record<string, string> = {
      amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ",
    };
    return named[token.toLowerCase()] ?? entity;
  });
}

function cleanText(value: string): string {
  return decodeEntities(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<!--([\s\S]*?)-->/g, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|li|h[1-6]|tr)\s*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );
}

function getAttribute(tag: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`\\b${escaped}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match?.[2] ? decodeEntities(match[2].trim()) : null;
}

function getMetaContent(html: string, key: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    if (getAttribute(tag, "property")?.toLowerCase() !== key.toLowerCase() &&
        getAttribute(tag, "name")?.toLowerCase() !== key.toLowerCase()) continue;
    const content = getAttribute(tag, "content");
    if (content) return content;
  }
  return null;
}

function getElementById(html: string, id: string): string | null {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const opening = new RegExp(`<div\\b(?=[^>]*\\bid\\s*=\\s*(["'])${escaped}\\1)[^>]*>`, "gi");
  const match = opening.exec(html);
  if (!match) return null;

  const token = /<\/?div\b[^>]*>/gi;
  token.lastIndex = opening.lastIndex;
  let depth = 1;
  let current: RegExpExecArray | null;
  while ((current = token.exec(html))) {
    if (/^<\//.test(current[0])) depth -= 1;
    else if (!/\/\s*>$/.test(current[0])) depth += 1;
    if (depth === 0) return html.slice(opening.lastIndex, current.index);
  }
  return null;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function normalizeSourceImage(raw: string, pageUrl: URL): string | null {
  try {
    const url = new URL(raw, pageUrl);
    if (url.protocol !== "https:" || !["gtainside.com", "www.gtainside.com"].includes(url.hostname.toLowerCase())) return null;
    if (!/^\/img\/\d{6}\/[sb]\/[^/]+\.(?:jpe?g|png|webp)$/i.test(url.pathname)) return null;
    return normalizeGtaInsideImageUrl(url.href);
  } catch {
    return null;
  }
}

function extractLightboxImages(html: string, pageUrl: URL): string[] {
  const images: string[] = [];
  const anchor = /<a\b[^>]*\bdata-lightbox\s*=\s*(["'])image-[^"']+\1[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchor.exec(html))) {
    const href = getAttribute(match[0], "href");
    const image = href ? normalizeSourceImage(href, pageUrl) : null;
    if (image) images.push(image);
  }
  return unique(images);
}

function extractCategory(html: string): string | null {
  const breadcrumb = html.match(/<h4\b[^>]*>[\s\S]*?<\/h4>/i)?.[0];
  if (!breadcrumb) return null;
  const text = cleanText(breadcrumb).replace(/^GTA\s*V\s*\/\s*/i, "").trim();
  return text || null;
}

function extractAuthor(html: string): string | null {
  const match = html.match(/uploaded\s+by\s*<a\b[^>]*href\s*=\s*(["'])\/profile\/[^"']+\1[^>]*>([\s\S]*?)<\/a>/i);
  return match?.[2] ? cleanText(match[2]) || null : null;
}

function extractDescriptionSection(
  descriptionHtml: string,
  heading: string,
  followingHeadings: string[]
): string | null {
  const stopPatterns = [
    ...followingHeadings.map((next) => new RegExp(
      `<(?:b|strong)\\b[^>]*>\\s*${next.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:?\\s*<\\/(?:b|strong)>`,
      "i"
    )),
    /<\/p\s*>/i,
  ];
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const taggedHeading = new RegExp(
    `<(?:b|strong)\\b[^>]*>\\s*${escapedHeading}\\s*:?\\s*<\\/(?:b|strong)>`,
    "i"
  );

  // If the source uses plain block headings instead of bold labels, only
  // accept the section when another recognized heading bounds its end.
  // Otherwise the text after the heading could include unrelated prose.
  if (!taggedHeading.test(descriptionHtml)) {
    const plainText = cleanText(descriptionHtml.replace(/<h[1-6]\b[^>]*>/gi, "\n"));
    const lineHeading = new RegExp(`(?:^|\n)[\t ]*${escapedHeading}[\t ]*:?[\t ]*(?:\n|$)`, "i");
    const match = lineHeading.exec(plainText);
    if (!match) return null;
    const remaining = plainText.slice(match.index + match[0].length);
    const nextHeading = /(?:^|\n)[\t ]*(?:Features|Requirements|Notes(?:\s*\/\s*Known Bugs)?|Notes\s*\/\s*Known Bugs|Known Bugs|Credits)[\t ]*:?[\t ]*(?:\n|$)/i;
    if (!nextHeading.test(remaining)) return null;
  }
  return extractSharedDescriptionSection(descriptionHtml, heading, stopPatterns);
}

function parseCount(value: string | null): number | null {
  if (!value) return null;
  const count = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(count) ? count : null;
}

export function extractGtaInsideDetails(html: string, projectUrl: string): GtaInsideDetails {
  const pageUrl = new URL(projectUrl);
  const descriptionHtml = getElementById(html, "moreContentDiv") ?? "";
  const description = cleanText(descriptionHtml) || null;
  const lightboxImages = extractLightboxImages(html, pageUrl);
  const metaImage = getMetaContent(html, "og:image");
  const image = (metaImage ? normalizeSourceImage(metaImage, pageUrl) : null) ?? lightboxImages[0] ?? null;
  const images = lightboxImages.filter((candidate) => candidate !== image);
  const title = cleanText(
    html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ??
    getMetaContent(html, "og:title") ?? ""
  ).replace(/\s*\|\s*GTAinside\.com\s*$/i, "").trim() || null;

  const breadcrumbCategory = extractCategory(html);
  const downloadAnchor = (html.match(/<a\b[^>]*>/gi) ?? []).find((tag) =>
    /\bclass\s*=\s*(["'])[^"']*\bdownloadbutton\b[^"']*\1/i.test(tag)
  );
  let downloadUrl: string | null = null;
  const downloadHref = downloadAnchor ? getAttribute(downloadAnchor, "href") : null;
  if (downloadHref) {
    try {
      const candidate = new URL(downloadHref, pageUrl);
      const expectedPath = `${pageUrl.pathname.replace(/\/$/, "")}/download`;
      if (
        candidate.protocol === "https:" &&
        candidate.hostname.toLowerCase() === pageUrl.hostname.toLowerCase() &&
        candidate.pathname.replace(/\/$/, "") === expectedPath
      ) downloadUrl = candidate.href;
    } catch {
      // Ignore malformed or unrelated links.
    }
  }

  const lastUpdated = html.match(/Last\s+update:\s*([^)<\n]+)/i)?.[1]?.trim() ?? null;
  const downloads = parseCount(html.match(/([\d,]+)\s+Downloads\b/i)?.[1] ?? null);
  const fileSize = html.match(/\b\d+(?:\.\d+)?\s*(?:KB|MB|GB|KiB|MiB|GiB|Kb)\b/i)?.[0] ?? null;

  return {
    title,
    description,
    image,
    images,
    version: null,
    category: breadcrumbCategory,
    tags: [],
    features: extractDescriptionSection(descriptionHtml, "Features", ["Requirements", "Notes", "Notes / Known Bugs", "Notes/Known Bugs", "Known Bugs", "Credits"]),
    requirements: extractDescriptionSection(descriptionHtml, "Requirements", ["Features", "Notes", "Known Bugs", "Credits"]),
    notes: extractDescriptionSection(descriptionHtml, "Notes", ["Features", "Requirements", "Known Bugs", "Credits"]) ??
      extractDescriptionSection(descriptionHtml, "Notes / Known Bugs", ["Features", "Requirements", "Known Bugs", "Credits"]) ??
      extractDescriptionSection(descriptionHtml, "Notes/Known Bugs", ["Features", "Requirements", "Known Bugs", "Credits"]),
    knownBugs: extractDescriptionSection(descriptionHtml, "Known Bugs", ["Features", "Requirements", "Notes", "Credits"]),
    credits: extractDescriptionSection(descriptionHtml, "Credits", ["Features", "Requirements", "Notes", "Known Bugs"]),
    downloadUrl,
    fileSize,
    downloads,
    lastUpdated,
  };
}

export function extractGtaInsideAuthor(html: string): string | null {
  return extractAuthor(html);
}
