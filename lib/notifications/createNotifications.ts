import { supabase } from "@/lib/supabase/client";
import { createNotification } from "./createNotification";

export async function createNotificationsForEvent(event: any) {
  switch (event.event_type) {

    case "team_created":
      return;

    case "team_member_invited": {
    // We'll implement this once invites exist.
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