import { supabase } from "@/lib/supabase/client";

export async function getNotifications(profileId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select(`
      *,
      activity_events(*)
    `)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  // Batch enrich only discussion notifications; delivery/unread/team logic is unchanged.
  const discussionIds = (data ?? []).flatMap(notification => {
    const event = Array.isArray(notification.activity_events) ? notification.activity_events[0] : notification.activity_events;
    return event && ['comment_created', 'comment_reply_created'].includes(event.event_type) ? [event.id] : [];
  });
  const details: Record<string, Record<string, unknown>> = {};
  for (let index = 0; index < discussionIds.length; index += 100) {
    const { data: batch, error: detailError } = await supabase.rpc('discussion_event_details', { p_ids: discussionIds.slice(index, index + 100) });
    if (!detailError && batch) Object.assign(details, batch);
  }
  return (data ?? []).map(notification => {
    const enrich = (event: { id: string; metadata: Record<string, unknown> | null }) => details[event.id] ? ({ ...event, metadata: { ...event.metadata, ...details[event.id] } }) : event;
    return { ...notification, activity_events: Array.isArray(notification.activity_events)
      ? notification.activity_events.map(enrich) : notification.activity_events ? enrich(notification.activity_events) : null };
  });
}