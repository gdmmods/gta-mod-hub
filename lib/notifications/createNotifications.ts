import { createNotification } from "./createNotification";

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

    case "team_member_invited": {
      const recipientProfileId =
        event.metadata?.recipientProfileId;

      if (
        typeof recipientProfileId !== "string" ||
        !recipientProfileId
      ) {
        console.error(
          "Cannot create invitation notification: recipient profile is missing.",
          event.id
        );
        return;
      }

      await createNotification({
        recipientProfileId,
        activityEventId: event.id,
      });

      return;
    }

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