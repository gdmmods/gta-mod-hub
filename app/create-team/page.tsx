"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { recordActivity } from "@/lib/activity/recordActivity";

import { supabase } from "@/lib/supabase/client";

export default function CreateTeamPage() {

  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({

    name: "",
    tagline: "",
    bio: "",

  });

  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault();

    setLoading(true);

    try {

      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {

        alert("You must be logged in.");

        setLoading(false);

        return;

      }

      const slug =
        form.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-");

      /* ---------------------------
         FIND FOUNDER CREATOR
      ---------------------------- */

      const {
        data: founderCreator,
        error: founderError,
      } = await supabase
        .from("creators")
        .select("id")
        .eq(
          "owner_id",
          user.id
        )
        .eq(
          "owner_type",
          "user"
        )
        .single();

      console.log(
        "FOUNDER CREATOR:",
        founderCreator
      );

      console.log(
        "FOUNDER ERROR:",
        founderError
      );

      if (
        founderError ||
        !founderCreator
      ) {

        console.error(
          founderError
        );

        alert(
          "Could not locate your personal creator profile."
        );

        setLoading(false);

        return;

      }

      /* ---------------------------
         CREATE TEAM
      ---------------------------- */

      const {
        data: team,
        error: teamError,
      } = await supabase
        .from("teams")
        .insert({

          name: form.name,

          slug,

          owner_id:
            founderCreator.id,

        })
        .select()
        .single();

      if (teamError) {

        console.log(
          "TEAM ERROR:",
          JSON.stringify(
            teamError,
            null,
            2
          )
        );

        console.error(
          teamError
        );

        alert(
          "Failed to create team."
        );

        setLoading(false);

        return;

      }

      /* ---------------------------
         CREATE TEAM CREATOR
      ---------------------------- */

      console.log("USER ID:", user.id);

const {
  data: creator,
  error: creatorError,
} = await supabase
  .from("creators")
  .insert({

    name: form.name,

    tagline: form.tagline,

    bio: form.bio,

    status: "active",

    owner_type: "team",

    owner_id: user.id,

    team_id: team.id,

  })
  .select()
  .single();

console.log(
  "CREATOR ERROR:",
  creatorError
);

console.log(
  "CREATOR DATA:",
  creator
);

      if (creatorError) {

        console.error(
          creatorError
        );

        alert(
          "Failed to create team creator."
        );

        setLoading(false);

        return;

      }

      /* ---------------------------
         CREATE OWNER MEMBERSHIP
      ---------------------------- */

      const {
        error: memberError,
      } = await supabase
        .from("team_members")
        .insert({

          team_id:
            team.id,

          creator_id:
            founderCreator.id,

          role:
            "owner",

          membership_status:
            "active",

          can_upload:
            true,

          can_manage_members:
            true,

          can_manage_team:
            true,

        });

      if (memberError) {

        console.error(
          memberError
        );

        alert(
          "Failed to create owner membership."
        );

        setLoading(false);

        return;

      }

      const {
  error: creatorMemberError,
} = await supabase
  .from("creator_members")
  .insert({

    profile_id:
      user.id,

    creator_id:
      creator.id,

    role:
      "owner",

    status:
      "approved",

  });

  if (creatorMemberError) {
  console.error(creatorMemberError);

  alert("Failed to create creator membership.");

  setLoading(false);

  return;
}

await recordActivity({
  eventType: "team_created",

  actor: {
    type: "creator",
    id: creator.id,
  },

  target: {
    type: "team",
    id: team.id,
  },

  visibility: "public",

  title: "Team created",

  summary: `${creator.name} created the team ${team.name}.`,

  metadata: {
    creatorName: creator.name,
    teamName: team.name,
  },
});

      router.push(
        `/dashboard/creator/${creator.id}/settings`
      );

    } catch (error) {

      console.error(
        error
      );

      alert(
        "Unexpected error creating team."
      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <div
      className="
        max-w-4xl
        mx-auto
        py-12
        px-6
      "
    >

      <div
        className="
          rounded-3xl
          border
          border-zinc-800
          bg-zinc-900/60
          backdrop-blur-xl
          p-8
        "
      >

        <p
          className="
            text-xs
            uppercase
            tracking-[0.3em]
            text-purple-400
            mb-3
          "
        >
          Team Creation
        </p>

        <h1
          className="
            text-4xl
            font-bold
            mb-3
          "
        >
          Create Team
        </h1>

        <p
          className="
            text-zinc-400
            mb-8
          "
        >
          Create a collaborative creator
          team. Ownership, membership,
          contributions and history will
          be preserved.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <div>

            <label
              className="
                block
                mb-2
                text-sm
                text-zinc-400
              "
            >
              Team Name
            </label>

            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name:
                    e.target.value,
                })
              }
              required
              className="
                w-full
                rounded-xl
                bg-zinc-950
                border
                border-zinc-800
                px-4
                py-3
              "
            />

          </div>

          <div>

            <label
              className="
                block
                mb-2
                text-sm
                text-zinc-400
              "
            >
              Tagline
            </label>

            <input
              value={form.tagline}
              onChange={(e) =>
                setForm({
                  ...form,
                  tagline:
                    e.target.value,
                })
              }
              className="
                w-full
                rounded-xl
                bg-zinc-950
                border
                border-zinc-800
                px-4
                py-3
              "
            />

          </div>

          <div>

            <label
              className="
                block
                mb-2
                text-sm
                text-zinc-400
              "
            >
              Description
            </label>

            <textarea
              rows={6}
              value={form.bio}
              onChange={(e) =>
                setForm({
                  ...form,
                  bio:
                    e.target.value,
                })
              }
              className="
                w-full
                rounded-xl
                bg-zinc-950
                border
                border-zinc-800
                px-4
                py-3
              "
            />

          </div>

          <div
            className="
              flex
              gap-3
            "
          >

            <button
              type="submit"
              disabled={loading}
              className="
                rounded-2xl
                bg-purple-600
                px-6
                py-3
                font-semibold
              "
            >
              {loading
                ? "Creating..."
                : "Create Team"}
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard"
                )
              }
              className="
                rounded-2xl
                border
                border-zinc-700
                px-6
                py-3
              "
            >
              Cancel
            </button>

          </div>

        </form>

      </div>

    </div>

  );

}