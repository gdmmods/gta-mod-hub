"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase/client";

interface ClaimCreatorButtonProps {
  creatorId: string;
}

export default function ClaimCreatorButton({
  creatorId,
}: ClaimCreatorButtonProps) {

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function handleClaim() {

    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {

      setMessage(
        "You must be logged in."
      );

      setLoading(false);
      return;

    }

    const {
      data: existingClaim,
    } = await supabase
      .from("creator_claims")
      .select("id")
      .eq(
        "creator_id",
        creatorId
      )
      .eq(
        "user_id",
        user.id
      )
      .eq(
        "status",
        "pending"
      )
      .maybeSingle();

    if (existingClaim) {

      setMessage(
        "Claim already pending review."
      );

      setLoading(false);

      return;

    }

    const { error } =
      await supabase
        .from("creator_claims")
        .insert({
          creator_id: creatorId,
          user_id: user.id,
          status: "pending",
        });

    if (error) {

      console.error(error);

      setMessage(
        "Failed to submit claim."
      );

    } else {

      setMessage(
        "Ownership request submitted."
      );

    }

    setLoading(false);

  }

  return (

    <div
      className="
        rounded-[28px]
        border
        border-zinc-900
        bg-zinc-950/50
        backdrop-blur-xl
        p-5
      "
    >

      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >

        <div>

          <p
            className="
              text-[10px]
              uppercase
              tracking-[0.22em]
              text-purple-400
            "
          >
            Ownership
          </p>

          <h3
            className="
              mt-2
              text-lg
              font-bold
            "
          >
            Claim Creator Profile
          </h3>

          <p
            className="
              mt-2
              text-sm
              text-zinc-500
              max-w-md
            "
          >
            Unlock creator editing,
            uploads, and ecosystem tools.
          </p>

        </div>

        <button
          onClick={handleClaim}
          disabled={loading}
          className="
            shrink-0
            rounded-2xl
            bg-purple-600
            hover:bg-purple-500
            transition
            px-4
            py-2.5
            text-sm
            font-semibold
            disabled:opacity-50
          "
        >
          {loading
            ? "Submitting..."
            : "Claim"}
        </button>

      </div>

      {message && (

        <p
          className="
            mt-4
            text-sm
            text-emerald-400
          "
        >
          {message}
        </p>

      )}

    </div>

  );

}