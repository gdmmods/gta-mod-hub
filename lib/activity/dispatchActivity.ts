import { createNotificationsForEvent }
from "@/lib/notifications/createNotifications";

export async function dispatchActivity(
  event: any
) {

  await createNotificationsForEvent(
    event
  );

}