"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase/client";
import { useCreatorContext } from "@/app/contexts/CreatorContext";

export default function ConstitutionSignSection() {

  const { activeCreatorId, loading: creatorContextLoading } = useCreatorContext();

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

  const [
    checked,
    setChecked,
  ] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setChecked(false);
    setSigned(false);
    setCreatorId(null);

    if (creatorContextLoading) return () => { cancelled = true; };
    if (!activeCreatorId) {
      setChecked(true);
      return () => { cancelled = true; };
    }

    async function loadCreator() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setChecked(true);
        return;
      }

      const { data: membership, error: membershipError } = await supabase
        .from("creator_members")
        .select("creator_id")
        .eq("profile_id", user.id)
        .eq("creator_id", activeCreatorId)
        .eq("role", "owner")
        .eq("status", "approved")
        .maybeSingle();

      if (cancelled) return;
      if (membershipError || !membership) {
        setChecked(true);
        return;
      }

      setCreatorId(activeCreatorId);
      const { data: existingRows, error: signatureError } = await supabase
        .from("constitution_signatures")
        .select("id")
        .eq("creator_id", activeCreatorId);
      if (cancelled) return;
      if (signatureError) console.error("SIGNATURE STATUS ERROR:", signatureError);
      setSigned((existingRows?.length ?? 0) > 0);
      setChecked(true);
    }

    void loadCreator();
    return () => { cancelled = true; };
  }, [activeCreatorId, creatorContextLoading]);
  /* --------------------------------
     SIGN CONSTITUTION
  -------------------------------- */

  async function signConstitution() {

  if (!creatorId) return;

  setLoading(true);

  /* -------------------------------
     CHECK EXISTING SIGNATURE
  ------------------------------- */

  const {
    data: existingRows,
    error: existingError,
  } = await supabase
    .from(
      "constitution_signatures"
    )
    .select("id")
    .eq(
      "creator_id",
      creatorId
    );

  if (existingError) {

    console.error(
      "CHECK ERROR:",
      existingError
    );

    setLoading(false);

    return;

  }

  /* -------------------------------
     ALREADY SIGNED
  ------------------------------- */

  if (
    existingRows &&
    existingRows.length > 0
  ) {

    setSigned(true);
    setLoading(false);

    return;

  }

  /* -------------------------------
     INSERT SIGNATURE
  ------------------------------- */

  const {
    error,
  } = await supabase
    .from(
      "constitution_signatures"
    )
    .insert({

      creator_id:
        creatorId,

    });

  if (error) {

    console.error(
      "SIGN ERROR:",
      error
    );

    alert(
      JSON.stringify(
        error,
        null,
        2
      )
    );

  } else {

    setSigned(true);

  }

  setLoading(false);

}

  /* --------------------------------
     LOADING
  -------------------------------- */

  if (!checked) {

    return null;

  }

  /* --------------------------------
     NO CREATOR PROFILE
  -------------------------------- */

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

  /* --------------------------------
     SIGNED STATE
  -------------------------------- */

  if (signed) {

    return (

      <section
        className="
          border
          border-zinc-800
          rounded-3xl
          p-10
          bg-zinc-950/50
          backdrop-blur-xl
        "
      >

        <div
          className="
            border
            border-emerald-500/30
            bg-emerald-500/10
            rounded-2xl
            px-6
            py-5
            text-emerald-400
            font-medium
          "
        >
          Constitution signed.
        </div>

      </section>

    );

  }

  /* --------------------------------
     DEFAULT UI
  -------------------------------- */

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

    </section>

  );

}