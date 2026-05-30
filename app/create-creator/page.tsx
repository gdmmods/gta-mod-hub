"use client";

import Navbar from "@/components/layout/Navbar";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { supabase } from "@/lib/supabase/client";

export default function CreateCreatorPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");

  const [saving, setSaving] = useState(false);

  async function createCreator() {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      setSaving(false);
      return;
    }

    const {
      data: creator,
      error: creatorError,
    } = await supabase
      .from("creators")
      .insert({
        name,
        tagline,
        bio,
        owner_id: user.id,
        status: "active",
      })
      .select()
      .single();

    if (creatorError) {
      console.error(creatorError);

      alert(
        "Failed to create creator profile."
      );

      setSaving(false);
      return;
    }

    const {
      error: membershipError,
    } = await supabase
      .from("creator_members")
      .insert({
        creator_id: creator.id,
        profile_id: user.id,
        role: "owner",
        status: "active",
        verified: true,
      });

    if (membershipError) {
      console.error(
        membershipError
      );

      alert(
        "Creator created but membership failed."
      );

      setSaving(false);
      return;
    }

    const { error: aliasError } = await supabase
        .from("creator_aliases")
        .insert({
            creator_id: creator.id,
            alias: name.trim(),
        });

        if (aliasError) {
        console.error(aliasError);
        }

    router.push(
      `/creator/${creator.id}`
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black text-white">

        <div className="max-w-4xl mx-auto px-6 py-24">

          <p
            className="
              text-purple-400
              uppercase
              tracking-[0.3em]
              text-sm
              mb-4
            "
          >
            Creator Onboarding
          </p>

          <h1
            className="
              text-5xl
              font-bold
              mb-6
            "
          >
            Create New Creator
          </h1>

          <p
            className="
              text-zinc-400
              mb-10
            "
          >
            Create a new creator profile and
            start building your presence on
            ModVault.
          </p>

          {/* GUIDELINES */}

          <div
            className="
              mb-10
              rounded-[24px]
              border
              border-zinc-800
              bg-zinc-950
              p-6
              space-y-4
            "
          >

            <h2
              className="
                text-xl
                font-bold
              "
            >
              Creator Guidelines
            </h2>

            <ul
              className="
                text-zinc-400
                space-y-2
                list-disc
                pl-5
              "
            >

              <li>
                Create a new creator profile
                only when it represents a
                distinct identity, project,
                team, or brand.
              </li>

              <li>
                If a creator profile already
                exists for you, consider
                claiming it instead of
                creating a duplicate.
              </li>

              <li>
                Multiple creator profiles are
                permitted when they represent
                separate public identities or
                projects.
              </li>

              <li>
                Impersonation, misleading
                identities, or duplicate
                profiles intended to confuse
                users are prohibited.
              </li>

            </ul>

          </div>

          {/* FORM */}

          <div
            className="
              rounded-[32px]
              border
              border-zinc-800
              bg-zinc-950
              p-8
              space-y-6
            "
          >

            <div>

              <label
                className="
                  block
                  text-sm
                  mb-2
                "
              >
                Creator Name
              </label>

              <input
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-xl
                  bg-zinc-900
                  border
                  border-zinc-700
                  px-4
                  py-3
                "
              />

            </div>

            <div>

              <label
                className="
                  block
                  text-sm
                  mb-2
                "
              >
                Tagline
              </label>

              <input
                value={tagline}
                onChange={(e) =>
                  setTagline(
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-xl
                  bg-zinc-900
                  border
                  border-zinc-700
                  px-4
                  py-3
                "
              />

            </div>

            <div>

              <label
                className="
                  block
                  text-sm
                  mb-2
                "
              >
                Bio
              </label>

              <textarea
                rows={6}
                value={bio}
                onChange={(e) =>
                  setBio(
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-xl
                  bg-zinc-900
                  border
                  border-zinc-700
                  px-4
                  py-3
                "
              />

            </div>

            <div
              className="
                border-t
                border-zinc-800
                pt-6
              "
            >

              <p
                className="
                  text-zinc-400
                  text-sm
                  mb-4
                "
              >
                Already have a creator
                profile on ModVault?

                Consider using the
                Claim Existing Creator
                option whenever possible
                to preserve attribution,
                creator history, and
                community trust.
              </p>

              <button
                onClick={
                  createCreator
                }
                disabled={saving}
                className="
                  px-6
                  py-3
                  rounded-xl
                  bg-purple-600
                  hover:bg-purple-500
                  transition
                "
              >
                {saving
                  ? "Creating..."
                  : "Create Creator"}
              </button>

            </div>

          </div>

        </div>

      </main>
    </>
  );
}