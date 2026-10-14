import { NextResponse } from "next/server";
import { extractGta5ModsDetails } from "@/lib/connectors/gta5ModsDetails";

const ALLOWED_HOSTS = new Set([
  "gta5-mods.com",
  "www.gta5-mods.com",
]);

function isValidProjectUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      !ALLOWED_HOSTS.has(url.hostname.toLowerCase()) ||
      url.username ||
      url.password
    ) {
      return false;
    }

    const segments = url.pathname
      .split("/")
      .filter(Boolean);

    // GTA5-Mods project URLs use /category/project-slug.
    return (
      segments.length === 2 &&
      segments.every((segment) => segment.length > 0) &&
      !url.pathname.toLowerCase().startsWith("/users/")
    );
  } catch {
    return false;
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");
}

function stripTags(value: string): string {
  return decodeEntities(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function getMetaContent(
  html: string,
  key: string
): string | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patterns = [
    new RegExp(
      `<meta\\b(?=[^>]*\\bname=["']${escaped}["'])[^>]*\\bcontent=["']([^"']*)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta\\b(?=[^>]*\\bproperty=["']${escaped}["'])[^>]*\\bcontent=["']([^"']*)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta\\b(?=[^>]*\\bcontent=["']([^"']*)["'])[^>]*\\b(?:name|property)=["']${escaped}["'][^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match) {
      const content = match[1]?.trim();

      if (content) {
        return stripTags(content);
      }
    }
  }

  return null;
}

function extractDescription(html: string): string | null {
  const description =
    getMetaContent(html, "og:description") ??
    getMetaContent(html, "description") ??
    getMetaContent(html, "twitter:description");

  if (description) {
    return description;
  }

  const match = html.match(
    /<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i
  );

  return match?.[1]
    ? stripTags(match[1])
    : null;
}

function extractAuthor(html: string): string | null {
  const author =
    getMetaContent(html, "author") ??
    getMetaContent(html, "article:author");

  if (author) {
    return author;
  }

  const patterns = [
    /<a\b[^>]*href=["']\/users\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/i,
    /<a\b[^>]*href=["']\/users\/[^"']+["'][^>]*title=["']([^"']+)["'][^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      const value = stripTags(match[1]);

      if (value) {
        return value;
      }
    }
  }

  return null;
}

function extractScreenshots(html: string, pageUrl: URL): string[] {
  const projectSlug = pageUrl.pathname
    .split("/")
    .filter(Boolean)[1];

  const results = new Set<string>();

  const allowedImageHosts = new Set([
    "img.gta5-mods.com",
    "images.gta5-mods.com",
    "gta5-mods.com",
    "www.gta5-mods.com",
  ]);

  function addImage(rawUrl: string | null | undefined) {
    if (!rawUrl) return;

    try {
      const imageUrl = new URL(rawUrl, pageUrl);

      if (
        imageUrl.protocol !== "https:" ||
        !allowedImageHosts.has(imageUrl.hostname.toLowerCase())
      ) {
        return;
      }

      if (!/\.(jpg|jpeg|png|webp)(?:$|[?#])/i.test(imageUrl.href)) {
        return;
      }

      results.add(imageUrl.href);
    } catch {
      // Ignore malformed image URLs.
    }
  }

  // Extract images from the page's actual HTML.
  const imageRegex = /<img\b[^>]*>/gi;
  const projectImages: string[] = [];

  let match: RegExpExecArray | null;

  while ((match = imageRegex.exec(html)) !== null) {
    const tag = match[0];

    // Prioritize the responsive images used by the mod gallery.
    if (!/\bclass=["'][^"']*\bimg-responsive\b[^"']*["']/i.test(tag)) {
      continue;
    }

    const src =
      tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ??
      tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1];

    if (!src) continue;

    try {
      const imageUrl = new URL(src, pageUrl);

      if (
        imageUrl.protocol === "https:" &&
        allowedImageHosts.has(imageUrl.hostname.toLowerCase()) &&
        /\.(jpg|jpeg|png|webp)(?:$|[?#])/i.test(imageUrl.href) &&
        imageUrl.pathname.toLowerCase().includes(projectSlug.toLowerCase())
      ) {
        projectImages.push(imageUrl.href);
      }
    } catch {
      // Ignore malformed image URLs.
    }
  }

  // Prefer images that belong to this specific project.
  for (const image of projectImages) {
    addImage(image);
  }

  // Only fall back to the featured image if no project gallery images
  // were identified.
  if (results.size === 0) {
    addImage(
      getMetaContent(html, "og:image") ??
        getMetaContent(html, "twitter:image")
    );
  }

  return [...results].slice(0, 12);
}

export async function POST(request: Request) {
  try {
  let body: { projectUrl?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid or empty request body." },
      { status: 400 }
    );
  }

  const projectUrl = body?.projectUrl;

    if (!isValidProjectUrl(projectUrl)) {
      return NextResponse.json(
        { error: "Invalid GTA5-Mods project URL." },
        { status: 400 }
      );
    }

    const url = new URL(projectUrl);

    // Canonicalize the URL before fetching it.
    url.search = "";
    url.hash = "";

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      8000
    );

    let response: Response;

    try {
      response = await fetch(url.href, {
        method: "GET",
        headers: {
          "User-Agent": "ModVault Creator Connector",
          Accept: "text/html",
        },
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to retrieve the source project." },
        { status: 502 }
      );
    }

    const contentType =
      response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("text/html")) {
      return NextResponse.json(
        { error: "The source did not return an HTML project page." },
        { status: 502 }
      );
    }

    const html = await response.text();

    const title =
      getMetaContent(html, "og:title") ??
      html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]
        ?.trim() ??
      null;

    const category =
      url.pathname.split("/").filter(Boolean)[0] ?? null;

    const description = extractDescription(html);
    const author = extractAuthor(html);
    const screenshots = extractScreenshots(html, url);
    const parsedDetails = extractGta5ModsDetails(html, url.href);

    return NextResponse.json({
      metadata: {
        title: title ? stripTags(title) : null,
        description,
        author,
        category,
        imageUrl: screenshots[0] ?? null,
        screenshots,
        projectUrl: url.href,
        parsedDetails,
      },
    });
  } catch (error) {
    console.error("PROJECT PREVIEW ERROR:", error);

    return NextResponse.json(
      { error: "Unable to load project preview metadata." },
      { status: 500 }
    );
  }
}