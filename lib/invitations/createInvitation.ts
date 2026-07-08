import { supabase } from "@/lib/supabase/client";
import { recordActivity } from "@/lib/activity/recordActivity";

interface CreateInvitationParams {
  senderCreatorId: string;

  recipientCreatorId: string;
  recipientProfileId: string;

  teamId: string;
  teamCreatorId: string;

  message?: string;
}

export async function createInvitation({
  senderCreatorId,
  recipientCreatorId,
  recipientProfileId,
  teamId,
  teamCreatorId,
  message,
}: CreateInvitationParams) {

  // ------------------------------------
  // Prevent duplicate invitations
  // ------------------------------------

  const {
    data: existing,
    error: existingError,
  } = await supabase
    .from("invitations")
    .select("id")
    .eq("team_id", teamId)
    .eq("recipient_creator_id", recipientCreatorId)
    .eq("status", "pending")
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    throw new Error(
      "Creator already has a pending invitation."
    );
  }

  // ------------------------------------
  // Record activity
  // ------------------------------------

  const {
    data: activity,
    error: activityError,
  } = await recordActivity({
    eventType: "team_member_invited",

    actor: {
      type: "creator",
      id: senderCreatorId,
    },

    target: {
      type: "team",
      id: teamId,
    },

    visibility: "private",

    metadata: {
      senderCreatorId,
      recipientCreatorId,
      recipientProfileId,
      teamId,
      teamCreatorId,
    },
  });

  if (activityError) {
    throw activityError;
  }

  if (!activity) {
    throw new Error(
      "Failed to create activity event."
    );
  }

  // ------------------------------------
  // Create invitation
  // ------------------------------------

  const {
    data,
    error,
  } = await supabase
    .from("invitations")
    .insert({

      invitation_type: "team_invite",

      sender_creator_id: senderCreatorId,

      recipient_creator_id: recipientCreatorId,

      recipient_profile_id: recipientProfileId,

      team_creator_id: teamCreatorId,

      team_id: teamId,

      activity_event_id: activity.id,

      message: message ?? null,

    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}