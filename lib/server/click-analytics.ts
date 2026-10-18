export const OUTBOUND_CLICK_ACTIONS = [
  "download",
  "primary_source",
  "creator_backup",
  "other_source",
] as const;

export type OutboundClickAction = (typeof OUTBOUND_CLICK_ACTIONS)[number];

export function isOutboundClickAction(value: string | null): value is OutboundClickAction {
  return OUTBOUND_CLICK_ACTIONS.some((action) => action === value);
}

export function normalizeTrackedHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function isCreatorSelfClick(userId: string | null | undefined, ownerId: string | null | undefined): boolean {
  return Boolean(userId && ownerId && userId === ownerId);
}

export function isEligibleOutboundTarget(input: {
  action: OutboundClickAction;
  targetUrl: string;
  downloadUrl?: string | null;
  primarySourceUrl?: string | null;
  creatorBackupUrl?: string | null;
  otherSourceUrls?: Array<string | null | undefined>;
}): boolean {
  const target = normalizeTrackedHttpsUrl(input.targetUrl);
  if (!target) return false;
  if (input.action === "download") return normalizeTrackedHttpsUrl(input.downloadUrl) === target;
  if (input.action === "primary_source") return normalizeTrackedHttpsUrl(input.primarySourceUrl) === target;
  if (input.action === "creator_backup") return normalizeTrackedHttpsUrl(input.creatorBackupUrl) === target;
  return (input.otherSourceUrls ?? []).some((source) => normalizeTrackedHttpsUrl(source) === target);
}

export function buildOutboundClickUrl(input: {
  origin: string;
  modId: string;
  action: OutboundClickAction;
  targetUrl: string;
  eventId: string;
}): string {
  const url = new URL("/api/outbound-click", input.origin);
  url.searchParams.set("mod", input.modId);
  url.searchParams.set("action", input.action);
  url.searchParams.set("target", input.targetUrl);
  url.searchParams.set("event", input.eventId);
  return url.toString();
}
