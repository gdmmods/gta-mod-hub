export type ParsedBackupUrl = {
  valid: boolean;
  url: string | null;
};

export function parseCreatorBackupUrl(value: unknown): ParsedBackupUrl {
  if (value == null || value === "") return { valid: true, url: null };
  if (typeof value !== "string") return { valid: false, url: null };

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return { valid: false, url: null };

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
      return { valid: false, url: null };
    }
    return { valid: true, url: url.href };
  } catch {
    return { valid: false, url: null };
  }
}
