import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const params = new URL(request.url).searchParams;
  if (params.get("activity") === "true") {
    const { data, error } = await supabase.rpc("get_notified_team_invitation_statuses");
    if (error) return NextResponse.json({ error: "Could not load invitation activity status." }, { status: error.code === "42501" ? 403 : 500 });
    return NextResponse.json({ invitations: data ?? [] });
  }
  const teamId = params.get("teamId");
  const search = params.get("q");
  if (teamId && search !== null) {
    const { data, error } = await supabase.rpc("search_team_invite_creators", {
      p_team_id: teamId,
      p_query: search,
    });
    if (error) return NextResponse.json({ error: error.message || "Creator search failed." }, { status: error.code === "42501" ? 403 : 500 });
    return NextResponse.json({ candidates: data ?? [] });
  }

  if (teamId) {
    const { data: invitations, error: inviteError } = await supabase.rpc("get_team_invitations_for_owner", { p_team_id: teamId });
    if (inviteError) return NextResponse.json({ error: inviteError.message || "Could not load invitations." }, { status: inviteError.code === "42501" ? 403 : 500 });
    return NextResponse.json({ invitations: invitations ?? [] });
  }

  const { data, error } = await supabase.rpc("get_creator_team_invitations", { p_creator_id: params.get("creatorId") });
  if (error) return NextResponse.json({ error: error.message || "Could not load invitations." }, { status: error.code === "42501" ? 403 : 500 });
  return NextResponse.json({ invitations: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: { action?: string; teamId?: string; creatorId?: string; invitationId?: string; accept?: boolean; recipientCreatorId?: string; message?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  if (body.action === "invite" && body.teamId && body.creatorId) {
  const { error } = await supabase.rpc(
    "create_team_invitation",
    {
      p_team_id: body.teamId,
      p_recipient_creator_id: body.creatorId,
      p_message: body.message?.trim() || null,
    }
  );

  if (error) {
    return NextResponse.json(
      { error: error.message || "Invitation could not be sent." },
      {
        status:
          error.code === "42501"
            ? 403
            : error.code === "23505"
              ? 409
              : 400,
      }
    );
  }

  return NextResponse.json({ sent: true });
}

  if (body.action === "respond" && body.invitationId && typeof body.accept === "boolean") {
    if (!body.recipientCreatorId) {
      return NextResponse.json({ error: "The invited creator must be specified. Reload invitations and try again." }, { status: 400 });
    }
    // Verify the displayed creator/invitation pair without using the Active Creator.
    const { data: invitations, error: lookupError } = await supabase.rpc("get_creator_team_invitations", {
      p_creator_id: body.recipientCreatorId,
      p_invitation_id: body.invitationId,
    });
    if (lookupError) return NextResponse.json({ error: lookupError.message || "Could not verify the invited creator." }, { status: 500 });
    const invitation = invitations?.[0];
    if (!invitation) return NextResponse.json({ error: "This invitation does not belong to the specified creator profile." }, { status: 403 });
    const { data, error } = await supabase.rpc("respond_to_team_invitation", {
      p_invitation_id: body.invitationId,
      p_accept: body.accept,
    });
    if (error) return NextResponse.json({ error: error.message || "Invitation could not be updated." }, { status: error.code === "42501" ? 403 : 400 });
    return NextResponse.json({ result: data, recipientCreatorId: invitation.recipient_creator_id, recipientCreatorName: invitation.recipient_creator_name });
  }

  return NextResponse.json({ error: "Invalid invitation action." }, { status: 400 });
}
