export type Gta5ModsDetails = {
  title: string | null;
  description: string | null;
  image: string | null;
  images: string[];
  version: string | null;
  category: string | null;
  tags: string[];
  features: string | null;
  requirements: string | null;
  credits: string | null;
  fileSize: string | null;
  downloads: number | null;
  lastUpdated: string | null;
  knownBugs: string | null;
};

/* ----------------------------------------
   HTML HELPERS
---------------------------------------- */

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
  };

  return value.replace(
    /&(#x[\da-f]+|#\d+|[a-z]+);/gi,
    (entity, code: string) => {
      if (code.startsWith("#x") || code.startsWith("#X")) {
        const point = Number.parseInt(code.slice(2), 16);

        return Number.isFinite(point)
          ? String.fromCodePoint(point)
          : entity;
      }

      if (code.startsWith("#")) {
        const point = Number.parseInt(code.slice(1), 10);

        return Number.isFinite(point)
          ? String.fromCodePoint(point)
          : entity;
      }

      return namedEntities[code.toLowerCase()] ?? entity;
    }
  );
}

function cleanText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getMetaContent(
  html: string,
  attribute: "property" | "name",
  key: string
): string | null {
  const escapedKey = escapeRegex(key);

  const metaRegex = /<meta\b[^>]*>/gi;

  let match: RegExpExecArray | null;

  while ((match = metaRegex.exec(html)) !== null) {
    const tag = match[0];

    const attributeMatch = tag.match(
      new RegExp(
        `\\b${attribute}\\s*=\\s*["']${escapedKey}["']`,
        "i"
      )
    );

    if (!attributeMatch) {
      continue;
    }

    const contentMatch = tag.match(
      /\bcontent\s*=\s*(["'])(.*?)\1/i
    );

    if (contentMatch?.[2]) {
      return decodeHtmlEntities(contentMatch[2].trim());
    }
  }

  return null;
}

function getElementText(
  html: string,
  className: string
): string | null {
  const escapedClass = escapeRegex(className);

  const regex = new RegExp(
    `<([a-z][\\w-]*)\\b[^>]*class\\s*=\\s*["'][^"']*\\b${escapedClass}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1\\s*>`,
    "i"
  );

  const match = html.match(regex);

  if (!match?.[2]) {
    return null;
  }

  return cleanText(match[2]) || null;
}

function getAttribute(
  html: string,
  attribute: string
): string | null {
  const escapedAttribute = escapeRegex(attribute);

  const regex = new RegExp(
    `\\b${escapedAttribute}\\s*=\\s*(["'])(.*?)\\1`,
    "i"
  );

  const match = html.match(regex);

  return match?.[2]
    ? decodeHtmlEntities(match[2].trim())
    : null;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function parseCount(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value.replace(/[^\d]/g, ""));

  return Number.isFinite(parsed) ? parsed : null;
}

/* ----------------------------------------
   DESCRIPTION EXTRACTION
---------------------------------------- */

/**
 * Extract a named section from the creator's
 * description without including later sections.
 *
 * Example:
 *
 * Features:
 * HQ Exterior
 * Working Dials
 *
 * Known Bugs:
 * None
 */
function extractDescriptionSection(
  descriptionHtml: string,
  heading: string,
  stopPatterns: RegExp[] = []
): string | null {
  const headingRegex = new RegExp(
    `<(?:b|strong)\\b[^>]*>\\s*${escapeRegex(heading)}\\s*:?\\s*<\\/(?:b|strong)>`,
    "i"
  );

  const headingMatch = headingRegex.exec(descriptionHtml);

  if (!headingMatch) {
    return null;
  }

  const start = headingMatch.index + headingMatch[0].length;
  const remainingHtml = descriptionHtml.slice(start);

  let end = remainingHtml.length;

  for (const pattern of stopPatterns) {
    const match = pattern.exec(remainingHtml);

    if (match && match.index < end) {
      end = match.index;
    }
  }

  return cleanText(remainingHtml.slice(0, end)) || null;
}

/**
 * Extract the main description block.
 *
 * GTA5-Mods may render both mobile and desktop
 * descriptions. Prefer the desktop description
 * when its distinctive file-description wrapper
 * exists, otherwise use the description-body block.
 */
function extractDescriptionHtml(html: string): string {
  const preferredPatterns = [
    /<div\b[^>]*class=["'][^"']*\bfile-description\b[^"']*["'][^>]*>[\s\S]*?<div\b[^>]*class=["'][^"']*\bdescription-body\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div\b[^>]*class=["'][^"']*\bdescription-body\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<[^>]*class=["'][^"']*\bdescription-body\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div)>/i,
  ];

  for (const pattern of preferredPatterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

/* ----------------------------------------
   MAIN EXTRACTOR
---------------------------------------- */

export function extractGta5ModsDetails(
  html: string,
  projectUrl: string
): Gta5ModsDetails {
  /* TITLE */

  const rawTitle =
    getMetaContent(html, "property", "og:title") ??
    getElementText(html, "file-name") ??
    getElementText(html, "title");

  const title = rawTitle
    ? cleanText(rawTitle)
        .replace(/\s*\|\s*GTA5-Mods\.com\s*$/i, "")
        .trim() || null
    : null;

  /* COVER IMAGE */

  const image =
    getMetaContent(html, "property", "og:image");

  /* DESCRIPTION */

  const descriptionHtml = extractDescriptionHtml(html);

  const description =
    cleanText(descriptionHtml) ||
    getMetaContent(html, "property", "og:description");

    /* FEATURES */

  const features = extractDescriptionSection(
    descriptionHtml,
    "Features",
    [
      /<(?:b|strong)\b[^>]*>\s*Known Bugs\s*:?\s*<\/(?:b|strong)>/i,
      /<(?:b|strong)\b[^>]*>\s*Credits\s*:?\s*<\/(?:b|strong)>/i,
    ]
  );

  
  /* KNOWN BUGS */

  const knownBugs = extractDescriptionSection(
    descriptionHtml,
    "Known Bugs",
    [
      /<(?:b|strong)\b[^>]*>\s*Credits\s*:?\s*<\/(?:b|strong)>/i,
      /<(?:b|strong)\b[^>]*>[^<]*INSTALL IN README[^<]*<\/(?:b|strong)>/i,
      /Install and Enjoy\s*;?\s*\)?/i,
      /See Ya Soon Peeps\.?/i,
    ]
  );


  /* REQUIREMENTS */

  /*
   * Do not infer requirements from comments or
   * installation instructions. Populate this only
   * when a dedicated source section is identified.
   */
  const requirements: string | null = null;

  /* CREDITS */

  const credits = extractDescriptionSection(
    descriptionHtml,
    "Credits",
    [
      /<(?:b|strong)\b[^>]*>[^<]*INSTALL IN README[^<]*<\/(?:b|strong)>/i,
    ]
  );

  /* GALLERY */

  const gallery: string[] = [];

  const galleryRegex =
    /<a\b[^>]*class\s*=\s*(["'])[^"']*\bmfp-image\b[^"']*\1[^>]*>/gi;

  let galleryMatch: RegExpExecArray | null;

  while (
    (galleryMatch = galleryRegex.exec(html)) !== null
  ) {
    const href = getAttribute(
      galleryMatch[0],
      "href"
    );

    if (!href) {
      continue;
    }

    try {
      const absoluteUrl = new URL(href, projectUrl);

      if (
        absoluteUrl.protocol === "https:" ||
        absoluteUrl.protocol === "http:"
      ) {
        gallery.push(absoluteUrl.href);
      }
    } catch {
      // Ignore malformed gallery URLs.
    }
  }

  const images = unique(gallery).filter(
    (url) => url !== image
  );

  /* VERSION */

  const version =
    getElementText(html, "version")
      ?.replace(/^V(?:ersion)?\.?\s*/i, "")
      .trim() || null;

  /* CATEGORY */

  let category: string | null = null;

  try {
    const url = new URL(projectUrl);
    const segments = url.pathname.split("/").filter(Boolean);

    if (segments.length === 2) {
      category = segments[0]
        .replace(/-/g, " ")
        .toLowerCase();
    }
  } catch {
    category = null;
  }

  /* TAGS */

  const tags: string[] = [];

  const tagRegex =
    /<a\b[^>]*class\s*=\s*(["'])[^"']*(?:tag|label)[^"']*\1[^>]*>([\s\S]*?)<\/a>/gi;

  let tagMatch: RegExpExecArray | null;

  while (
    (tagMatch = tagRegex.exec(html)) !== null
  ) {
    const tag = cleanText(tagMatch[2]);

    if (
      tag &&
      tag.length < 60 &&
      !/^(download|comments|details)$/i.test(tag)
    ) {
      tags.push(tag);
    }
  }

  /* FILE SIZE */

  const fileSizeMatch = html.match(
    /\b(\d+(?:\.\d+)?\s*(?:KB|MB|GB|KiB|MiB|GiB))\b/i
  );

  const fileSize =
    fileSizeMatch?.[1] ?? null;

  /* DOWNLOAD COUNT */

  let downloads: number | null = null;

  const downloadElementRegex =
    /<[^>]*class\s*=\s*(["'])[^"']*\bnum-downloads\b[^"']*\1[^>]*>([\s\S]*?)<\/[^>]+>/i;

  const downloadElementMatch =
    html.match(downloadElementRegex);

  if (downloadElementMatch?.[2]) {
    downloads = parseCount(
      downloadElementMatch[2].match(/[\d,]+/)?.[0] ?? null
    );
  }

  if (downloads === null) {
    const downloadTextMatch = html.match(
      /([\d,]+)\s+downloads?\b/i
    );

    downloads = parseCount(
      downloadTextMatch?.[1] ?? null
    );
  }

    /* LAST UPDATED */

  let lastUpdated: string | null = null;

  const dateMatch = html.match(
    /Last Updated\s*:?\s*<\/?[^>]*>\s*([^<\n]+)/i
  );

  if (dateMatch?.[1]) {
    lastUpdated = cleanText(dateMatch[1]) || null;
  }

  if (!lastUpdated || lastUpdated === ":") {
    const jsonLdDate = html.match(
      /"dateModified"\s*:\s*"([^"]+)"/i
    );

    lastUpdated = jsonLdDate?.[1] ?? null;
  }

  /* RESULT */

  return {
    title,
    description: description || null,
    image,
    images,
    version,
    category,
    tags: unique(tags),
    features,
    knownBugs,
    requirements,
    credits,
    fileSize,
    downloads,
    lastUpdated,
  };
}