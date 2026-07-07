import { supabase } from "@/lib/supabase/client";

interface CreateNotificationOptions {
  recipientProfileId: string;
  activityEventId: string;
}

export async function createNotification({
  recipientProfileId,
  activityEventId,
}: CreateNotificationOptions) {
  const { error } = await supabase
    .from("notifications")
    .insert({
      profile_id: recipientProfileId,
      activity_event_id: activityEventId,
    });

  if (error) {
    console.error("Notification Error:", error);
  }
}