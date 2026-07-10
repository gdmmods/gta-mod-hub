"use client";

import {
  useState,
} from "react";

import {
  deleteTeam,
} from "@/lib/team/deleteTeam";

type Props = {
  creator: any;
  onTeamDeleted: () => void;
};

export default function TeamDangerZone({
  creator,
  onTeamDeleted,
}: Props) {

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  async function handleDeleteTeam() {

    if (
      !creator?.id ||
      !creator?.team_id
    ) {

      alert(
        "Missing team information."
      );

      return;

    }

    const confirmed =
      window.confirm(
        `Permanently delete "${creator.name}"?\n\nThis cannot be undone.`
      );

    if (!confirmed) return;

    setDeleting(true);

    try {

      await deleteTeam({

        creatorId:
          creator.id,

        teamId:
          creator.team_id,

      });

      alert(
    "Team deleted successfully."
    );

    onTeamDeleted();

    } catch (error) {

      console.error(
        "DELETE TEAM ERROR:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete team.";

      alert(message);

    } finally {

      setDeleting(false);

    }

  }

  return (

    <section
      className="
        mt-8
        rounded-3xl
        border
        border-red-900/50
        bg-red-950/10
        p-8
      "
    >

      <p
        className="
          text-xs
          uppercase
          tracking-[0.3em]
          text-red-400
          mb-3
        "
      >
        Danger Zone
      </p>

      <h2
        className="
          text-2xl
          font-bold
          mb-3
        "
      >
        Delete Team
      </h2>

      <p
        className="
          text-zinc-400
          mb-6
        "
      >
        Permanently delete this team and its team creator profile.
        This action cannot be undone.
      </p>

      <button
        type="button"
        onClick={
          handleDeleteTeam
        }
        disabled={deleting}
        className="
          rounded-xl
          bg-red-600
          px-6
          py-3
          font-semibold
          text-white
          transition
          hover:bg-red-500
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >

        {deleting
          ? "Deleting Team..."
          : "Delete Team"}

      </button>

    </section>

  );

}