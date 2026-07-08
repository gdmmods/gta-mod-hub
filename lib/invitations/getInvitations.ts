import { supabase } from "@/lib/supabase/client";

interface GetInvitationsParams {
  creatorId: string;
  direction?: "received" | "sent";
  status?: "pending" | "accepted" | "rejected" | "cancelled" | "expired";
}

export async function getInvitations({
  creatorId,
  direction = "received",
  status,
}: GetInvitationsParams) {

  let query = supabase
    .from("invitations")
    .select(`
      *,
      sender:sender_creator_id (
        id,
        name,
        avatar
      ),
      recipient:recipient_creator_id (
        id,
        name,
        avatar
      ),
      team:team_id (
        id,
        name,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  // ------------------------------
  // Sent or received
  // ------------------------------

  if (direction === "sent") {

    query = query.eq(
      "sender_creator_id",
      creatorId
    );

  } else {

    query = query.eq(
      "recipient_creator_id",
      creatorId
    );

  }

  // ------------------------------
  // Status filter
  // ------------------------------

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("GET INVITATIONS ERROR:", error);
    throw error;
  }

  return data ?? [];
}