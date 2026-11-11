"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NewHandleField, { checkNewHandle } from "@/components/profile/NewHandleField";

import { supabase } from "@/lib/supabase/client";
import { useCreatorContext } from "@/app/contexts/CreatorContext";

export default function CreateTeamPage() {

  const router = useRouter();
  const { activeCreator, loading: identityLoading, selecting } = useCreatorContext();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({

    name: "",
    tagline: "",
    bio: "",

  });

  const [handle, setHandle] = useState("");
  const [creationError, setCreationError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (identityLoading || selecting) return;
    if (!activeCreator || activeCreator.owner_type !== "user") {
      setCreationError("Choose an active personal creator profile to create a team.");
      return;
    }
    setLoading(true);
    setCreationError("");
    try {
      const candidate = handle.trim().toLowerCase();
      const unavailable = await checkNewHandle(candidate);
      if (unavailable) {
        setCreationError(unavailable);
        return;
      }
      const { data, error } = await supabase.rpc("create_identity_with_handle", {
        p_handle: candidate, p_name: form.name, p_tagline: form.tagline, p_bio: form.bio,
        p_games: [], p_expected_founder: activeCreator.id,
      });
      if (error || !data) {
        setCreationError(error?.message ?? "Could not create your team.");
        return;
      }
      router.push("/dashboard/creator/" + data + "/settings");
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

          <NewHandleField value={handle} onChange={setHandle} />

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

          {creationError && <p role="alert" className="text-sm text-rose-300">{creationError}</p>}
          <div
            className="
              flex
              gap-3
            "
          >

            <button
              type="submit"
              disabled={loading || identityLoading || selecting}
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
