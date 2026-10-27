type ActivityEvent = {
  id: string;
  event_type: string;
  metadata?: Record<string, unknown> | null;
};

export async function createNotificationsForEvent(
  event: ActivityEvent
) {
  switch (event.event_type) {
    case "team_created":
      return;

    // Invitation RPCs insert their notifications atomically with the activity event.
    case "team_member_invited":
    case "team_member_joined":
      return;

    case "creator_claim_approved":
      return;

    case "mod_published":
      return;

    default:
      return;
  }
}