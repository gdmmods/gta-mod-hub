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
        "Your ownership request is now pending review."
      );

    }

    setLoading(false);

  }

  return (

    <div className="space-y-3">

      <button
        onClick={handleClaim}
        disabled={loading}
        className="
          rounded-2xl
          bg-purple-600
          hover:bg-purple-500
          transition
          px-5
          py-3
          font-semibold
          disabled:opacity-50
        "
      >
        {loading
          ? "Submitting..."
          : "Claim Profile"}
      </button>

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