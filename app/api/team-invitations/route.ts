import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordActivity } from "@/lib/activity/recordActivity";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const params = new URL(request.url).searchParams;
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

  const { data, error } = await supabase.rpc("get_my_team_invitations");
  if (error) return NextResponse.json({ error: error.message || "Could not load invitations." }, { status: error.code === "42501" ? 403 : 500 });
  return NextResponse.json({ invitations: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: { action?: string; teamId?: string; creatorId?: string; invitationId?: string; accept?: boolean; message?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  if (body.action === "invite" && body.teamId && body.creatorId) {
  const { data: invitation, error } = await supabase.rpc(
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

  const { error: activityError } = await recordActivity({
    eventType: "team_member_invited",

    actor: {
      type: "creator",
      id: invitation.sender_creator_id,
    },

    target: {
      type: "team",
      id: invitation.team_id,
    },

    visibility: "private",

    title: "Team invitation sent",
    summary: "A creator was invited to join a team.",

    metadata: {
      invitationId: invitation.id,
      teamId: invitation.team_id,
      senderCreatorId: invitation.sender_creator_id,
      recipientCreatorId: invitation.recipient_creator_id,
      recipientProfileId: invitation.recipient_profile_id,

      // Associate this activity with the invited creator.
      creatorProfileId: invitation.recipient_creator_id,
    },
  });

  if (activityError) {
    console.error(
      "Invitation was created, but activity recording failed:",
      activityError
    );
  }

  return NextResponse.json({
    sent: true,
    activityRecorded: !activityError,
  });
}

  if (body.action === "respond" && body.invitationId && typeof body.accept === "boolean") {
    const { data, error } = await supabase.rpc("respond_to_team_invitation", {
      p_invitation_id: body.invitationId,
      p_accept: body.accept,
    });
    if (error) return NextResponse.json({ error: error.message || "Invitation could not be updated." }, { status: error.code === "42501" ? 403 : 400 });
    return NextResponse.json({ result: data });
  }

  return NextResponse.json({ error: "Invalid invitation action." }, { status: 400 });
}
