export async function canUserUploadToCreator(supabase: any, userId: string, creatorId: string): Promise<boolean> {
  if (!creatorId) return false;
  const { data: creator, error: creatorError } = await supabase.from("creators")
    .select("id,owner_id,owner_type,team_id").eq("id", creatorId).maybeSingle();
  if (creatorError || !creator) return false;

  const { data: memberships, error: membershipError } = await supabase.from("creator_members")
    .select("creator_id").eq("profile_id", userId).eq("role", "owner").eq("status", "approved");
  if (membershipError) return false;
  const personalIds = [...new Set((memberships ?? []).map((row: { creator_id: string }) => row.creator_id))];
  if (personalIds.length === 0) return false;

  const { data: ownedCreators, error: ownedError } = await supabase.from("creators")
    .select("id").in("id", personalIds).eq("owner_id", userId).eq("owner_type", "user");
  if (ownedError) return false;
  const ownedIds = [...new Set((ownedCreators ?? []).map((row: { id: string }) => row.id))];

  if (creator.owner_type === "user") {
    return creator.owner_id === userId && ownedIds.includes(creatorId);
  }
  if (creator.owner_type !== "team" || !creator.team_id) return false;

  const { data: team, error: teamError } = await supabase.from("teams")
    .select("id,owner_id,creator_id,status").eq("id", creator.team_id).eq("creator_id", creator.id).maybeSingle();
  if (teamError || !team || team.status !== "active") return false;
  if (ownedIds.includes(team.owner_id)) return true;

  const { data: teamMembership, error: teamMembershipError } = await supabase.from("team_members")
    .select("creator_id,can_upload,left_at,membership_status").eq("team_id", team.id).in("creator_id", ownedIds).limit(1).maybeSingle();
  return !teamMembershipError && Boolean(teamMembership && teamMembership.left_at == null &&
    (teamMembership.membership_status ?? "active") === "active" && teamMembership.can_upload === true);
}
