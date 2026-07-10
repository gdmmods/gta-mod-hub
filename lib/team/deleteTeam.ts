import { supabase } from "@/lib/supabase/client";

type DeleteTeamParams = {
  creatorId: string;
  teamId: string;
};

export async function deleteTeam({
  creatorId,
  teamId,
}: DeleteTeamParams) {

  if (!creatorId) {
    throw new Error(
      "Missing team creator ID."
    );
  }

  if (!teamId) {
    throw new Error(
      "Missing team ID."
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    "delete_owned_team",
    {
      p_team_id: teamId,
      p_team_creator_id: creatorId,
    }
  );

  if (error) {

    console.error(
      "DELETE TEAM RPC ERROR:",
      error
    );

    throw new Error(
      error.message ||
      "Failed to delete team."
    );
  }

  if (!data?.success) {

    console.error(
      "DELETE TEAM RPC RETURNED NO SUCCESS:",
      data
    );

    throw new Error(
      "Team deletion did not complete."
    );
  }

  return data;
}