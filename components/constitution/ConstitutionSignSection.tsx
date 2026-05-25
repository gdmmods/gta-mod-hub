"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase/client";

export default function ConstitutionSignSection() {

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    signed,
    setSigned,
  ] = useState(false);

  const [
    creatorId,
    setCreatorId,
  ] = useState<string | null>(
    null
  );

  /* -------------------------------
     LOAD CREATOR
  ------------------------------- */

  useEffect(() => {

    async function loadCreator() {

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const {
  data: membership,
} = await supabase
  .from("creator_members")
  .select("creator_id")
  .eq(
    "profile_id",
    user.id
  )
  .eq(
    "role",
    "owner"
  )
  .maybeSingle();

if (!membership) return;

setCreatorId(
  membership.creator_id
);

      /* CHECK IF ALREADY SIGNED */

      const {
        data: existing,
      } = await supabase
        .from(
          "constitution_signatures"
        )
        .select("id")
        .eq(
        "creator_id",
        membership.creator_id
        )
        .maybeSingle();

      if (existing) {

        setSigned(true);

      }

    }

    loadCreator();

  }, []);

  /* -------------------------------
     SIGN
  ------------------------------- */

  async function signConstitution() {

    if (!creatorId) return;

    setLoading(true);

    const { error } =
      await supabase
        .from(
          "constitution_signatures"
        )
        .insert({
          creator_id: creatorId,
        });

    if (error) {

  console.error(
    "SIGN ERROR:",
    error
  );

  alert(
    JSON.stringify(error)
  );

} else {

      setSigned(true);

    }

    setLoading(false);

  }

  /* -------------------------------
     NO CREATOR
  ------------------------------- */

  if (!creatorId) {

    return (

      <section
        className="
          border
          border-zinc-800
          rounded-3xl
          p-10
          bg-zinc-950/50
        "
      >

        <p
          className="
            text-zinc-400
          "
        >
          You must own a creator
          profile to sign the
          Constitution.
        </p>

      </section>

    );

  }

  /* -------------------------------
     UI
  ------------------------------- */

  return (

    <section
      className="
        border
        border-zinc-800
        rounded-3xl
        p-10
        bg-zinc-950/50
        backdrop-blur-xl
        space-y-6
      "
    >

      <div className="space-y-3">

        <p
          className="
            text-sm
            uppercase
            tracking-[0.3em]
            text-violet-400
          "
        >
          Public Commitment
        </p>

        <h2
          className="
            text-4xl
            font-black
            max-w-3xl
          "
        >
          Sign the ModVault Constitution
        </h2>

        <p
          className="
            text-zinc-400
            text-lg
            max-w-2xl
            leading-relaxed
          "
        >
          Creators can publicly align
          themselves with the principles
          of attribution, preservation,
          creator ownership, and ethical
          ecosystem development.
        </p>

      </div>

      {!signed ? (

        <button
          onClick={signConstitution}
          disabled={loading}
          className="
            h-14
            px-8
            rounded-2xl
            bg-gradient-to-r
            from-violet-600
            to-fuchsia-500
            font-bold
            text-white
            transition
            hover:scale-[1.02]
          "
        >

          {loading
            ? "Signing..."
            : "Sign Constitution"}

        </button>

      ) : (

        <div
          className="
            border
            border-emerald-500/30
            bg-emerald-500/10
            rounded-2xl
            px-6
            py-4
            text-emerald-400
            font-medium
            w-fit
          "
        >
          Constitution signed.
        </div>

      )}

    </section>

  );

} 