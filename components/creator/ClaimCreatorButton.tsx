"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/client";

interface ClaimCreatorButtonProps {
  creatorId: string;
}

export default function ClaimCreatorButton({
  creatorId,
}: ClaimCreatorButtonProps) {

  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);

  async function handleClaim() {

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: existingClaim } = await supabase
      .from("creator_claims")
      .select("id")
      .eq("creator_id", creatorId)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (existingClaim) {
      setClaimed(true);
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("creator_claims")
      .insert({
        creator_id: creatorId,
        profile_id: user.id,
        status: "pending",
      });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setClaimed(true);
    setLoading(false);

  }

  return (

    <button
      onClick={handleClaim}
      disabled={loading || claimed}
      className="
        rounded-2xl
        bg-purple-600
        px-5
        py-3
        text-sm
        font-medium
        text-white
        transition
        hover:bg-purple-500
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >

      {loading
        ? "Submitting..."
        : claimed
        ? "Claim Submitted"
        : "Claim Creator"}

    </button>

  );

}