import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getOwnedCreators(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("default_creator_id").eq("id", userId).maybeSingle();
  const { data: ownerships } = await supabase.from("creator_members").select("creator_id")
    .eq("profile_id", userId).eq("role", "owner").eq("status", "approved");
  const ownedIds = [...new Set((ownerships ?? []).map((row) => row.creator_id))];
  if (ownedIds.length === 0) return { creator: null, creators: [], creatorIds: [] as string[] };

  const { data: creators } = await supabase.from("creators").select("id,name,owner_id,owner_type")
    .in("id", ownedIds).eq("owner_type", "user").eq("owner_id", userId);
  const personalCreators = creators ?? [];
  const creator = personalCreators.find((item) => item.id === profile?.default_creator_id) ?? personalCreators[0] ?? null;
  return { creator, creators: personalCreators, creatorIds: personalCreators.map((item) => item.id) };
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const teamId = new URL(request.url).searchParams.get("teamId");
  const { creator: defaultCreator, creators, creatorIds } = await getOwnedCreators(supabase, user.id);
  if (!defaultCreator) return NextResponse.json({ error: "An approved personal creator profile is required." }, { status: 403 });

  if (teamId) {
    const { data: members, error } = await supabase.rpc("get_team_members_for_owner", { p_team_id: teamId });
    if (error) return NextResponse.json({ error: error.message || "Could not load team members." }, { status: error.code === "42501" ? 403 : 500 });
    return NextResponse.json({ members: members ?? [] });
  }

  const requestedCreatorId = new URL(request.url).searchParams.get("creatorId");
  const creator = requestedCreatorId
    ? creators.find((item) => item.id === requestedCreatorId)
    : defaultCreator;
  if (!creator || !creatorIds.includes(creator.id)) {
    return NextResponse.json({ error: "An approved personal creator profile is required." }, { status: 403 });
  }

  const [{ data: teams, error: teamsError }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase.from("teams").select("id,name,slug,owner_id,creator_id").eq("status", "active").order("name"),
    supabase.from("team_members").select("team_id,role,left_at,membership_status").eq("creator_id", creator.id),
  ]);
  if (teamsError || membershipsError) {
    return NextResponse.json({ error: "Could not load team membership." }, { status: 500 });
  }
  const activeTeamIds = new Set((memberships ?? []).filter((row) => !row.left_at && (row.membership_status ?? "active") === "active").map((row) => row.team_id));
  const legacyOwnerTeamIds = new Set((memberships ?? []).filter((row) => !row.left_at && row.role === "owner" && (row.membership_status ?? "active") === "active").map((row) => row.team_id));
  return NextResponse.json({
    creator: { id: creator.id, name: creator.name },
    teams: (teams ?? []).map((team) => ({
      id: team.id,
      name: team.name,
      slug: team.slug,
      publicCreatorId: team.creator_id,
      isOwner: creator.id === team.owner_id,
      isLegacyOwnerRow: creator.id !== team.owner_id && legacyOwnerTeamIds.has(team.id),
      isMember: creator.id !== team.owner_id && !legacyOwnerTeamIds.has(team.id) && activeTeamIds.has(team.id),
    })).filter((team) => team.isOwner || team.isMember || team.isLegacyOwnerRow),
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { creator, creatorIds } = await getOwnedCreators(supabase, user.id);
  if (!creator) return NextResponse.json({ error: "An approved personal creator profile is required." }, { status: 403 });

  let body: { action?: string; teamId?: string; creatorId?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body.teamId || !["join", "leave", "remove"].includes(body.action ?? "")) {
    return NextResponse.json({ error: "Invalid membership action." }, { status: 400 });
  }
  const requestedCreatorId = body.creatorId ?? creator.id;
  const targetCreatorId = body.action === "remove" ? body.creatorId : requestedCreatorId;
  if (!targetCreatorId) return NextResponse.json({ error: "Creator is required." }, { status: 400 });
  if (body.action !== "remove" && !creatorIds.includes(targetCreatorId)) {
    return NextResponse.json({ error: "You can only change membership for a creator profile you own." }, { status: 403 });
  }

  const { data, error } = await supabase.rpc("set_team_membership", {
    p_team_id: body.teamId,
    p_creator_id: targetCreatorId,
    p_action: body.action,
  });
  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "23505" ? 409 : 400;
    return NextResponse.json({ error: error.message || "Membership could not be changed." }, { status });
  }
  return NextResponse.json({ result: data });
}
