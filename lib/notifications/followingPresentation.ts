type Event = { event_type: string; metadata: Record<string, unknown> | null };
const uuid = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;

export function followingEventHref(event: Event | null): string | null {
  const metadata = event?.metadata;
  if (!event || !metadata) return null;
  const { creatorId, modId, followingEventId, followerUsername, followerCreatorId } = metadata;
  if (["creator_followed", "profile_followed"].includes(event.event_type) && typeof followerCreatorId === "string" && uuid.test(followerCreatorId)) {
    return "/creator/" + followerCreatorId;
  }
  if (["creator_followed", "profile_followed"].includes(event.event_type) && typeof followerUsername === "string" && /^[a-z0-9_.-]+$/i.test(followerUsername)) {
    return "/profile/" + encodeURIComponent(followerUsername);
  }
  if (event.event_type === "mod_published" && typeof modId === "string" && uuid.test(modId)) return "/mods/" + modId;
  if (typeof followingEventId !== "string" || !uuid.test(followingEventId)) return null;
  const anchor = "#announcement-" + followingEventId;
  if (event.event_type === "creator_announcement" && typeof creatorId === "string" && uuid.test(creatorId)) return "/creator/" + creatorId + anchor;
  if (["mod_version_update", "mod_announcement"].includes(event.event_type) && typeof modId === "string" && uuid.test(modId)) return "/mods/" + modId + anchor;
  return null;
}

export function isModActivity(event: Event | null): boolean {
  if (!event) return false;
  return event.event_type === "discussion_recognized" || event.event_type.startsWith("mod_") ||
    (["comment_created", "comment_reply_created"].includes(event.event_type) && typeof event.metadata?.modId === "string");
}
