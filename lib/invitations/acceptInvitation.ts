import { supabase } from "@/lib/supabase/client";
import { recordActivity } from "@/lib/activity/recordActivity";
import { joinTeam } from "@/lib/team-members/joinTeam";

interface AcceptInvitationParams {
  invitationId: string;
}

export async function acceptInvitation({
  invitationId,
}: AcceptInvitationParams) {

  // ------------------------------------
  // Load invitation
  // ------------------------------------

  const {
    data: invitation,
    error,
  } = await supabase
    .from("invitations")
    .select("*")
    .eq("id", invitationId)
    .single();

  if (error) {
    throw error;
  }

  if (!invitation) {
    throw new Error("Invitation not found.");
  }

  if (invitation.status !== "pending") {
    throw new Error(
      "Invitation is no longer pending."
    );
  }

  // ------------------------------------
  // Join team
  // ------------------------------------

  await joinTeam({
    creatorId: invitation.team_creator_id,
    profileId: invitation.recipient_profile_id,
    role: "member",
  });

  // ------------------------------------
  // Update invitation
  // ------------------------------------

  const {
  error: updateError,
} = await supabase
  .from("invitations")
  .update({
    status: "accepted",

    accepted_at: new Date().toISOString(),

    accepted_by_creator_id:
      invitation.recipient_creator_id,
  })
  .eq("id", invitation.id);

  if (updateError) {
    throw updateError;
  }

  // ------------------------------------
  // Record activity
  // ------------------------------------

  await recordActivity({
    eventType: "team_member_joined",

    actor: {
      type: "creator",
      id: invitation.recipient_creator_id,
    },

    target: {
      type: "team",
      id: invitation.team_id,
    },

    visibility: "public",

    metadata: {
      invitationId: invitation.id,
      teamId: invitation.team_id,
      teamCreatorId: invitation.team_creator_id,
      recipientCreatorId:
        invitation.recipient_creator_id,
      recipientProfileId:
        invitation.recipient_profile_id,
    },
  });

  return true;
}