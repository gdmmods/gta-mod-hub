import { supabase } from "@/lib/supabase/client";

interface JoinTeamParams {
  creatorId: string;
  profileId: string;
  role?: "owner" | "manager" | "member";
}

export async function joinTeam({
  creatorId,
  profileId,
  role = "member",
}: JoinTeamParams) {

  const { data: existing, error: existingError } =
    await supabase
      .from("creator_members")
      .select("id")
      .eq("creator_id", creatorId)
      .eq("profile_id", profileId)
      .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("creator_members")
    .insert({
      creator_id: creatorId,
      profile_id: profileId,
      role,
      status: "approved",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}