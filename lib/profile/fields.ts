export const profileSocialFields = ["website", "discord", "youtube", "instagram", "twitter", "github"] as const;

export function publicProfileUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2048) return;
  try {
    const url = new URL(value);
    if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password) return url.href;
  } catch {
    return;
  }
}

export function normalizeProfileLinks(values: Record<string, string>, fields: readonly string[]) {
  const result: Record<string, string> = {};
  for (const field of fields) {
    const value = values[field]?.trim();
    if (!value) continue;
    const url = publicProfileUrl(value);
    if (!url) throw new Error(`${field.replace(/^./, c => c.toUpperCase())} must be a valid HTTP or HTTPS URL.`);
    result[field] = url;
  }
  return result;
}

export const profileImageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;
export const profileImageLimit = 5 * 1024 * 1024;
