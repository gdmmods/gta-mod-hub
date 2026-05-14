"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase/client";

import CreatorEditBrandingSection from "./CreatorEditBrandingSection";
import CreatorEditSocialsSection from "./CreatorEditSocialsSection";
import CreatorEditTagsSection from "./CreatorEditTagsSection";
import CreatorEditStatsSection from "./CreatorEditStatsSection";
import { useRouter } from "next/navigation";

interface Props {
  creator: any;
}

export default function CreatorEditForm({
  creator,
}: Props) {

  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [creatorData, setCreatorData] =
    useState({
      name:
        creator.name || "",

      tagline:
        creator.tagline || "",

      bio:
        creator.bio || "",

      location:
        creator.location || "",

      avatar:
        creator.avatar || "",

      banner:
        creator.banner || "",

      specialization:
        creator.specialization || [],

      socials:
        creator.socials || {},
    });

  async function saveCreator() {

    setLoading(true);

    setSaved(false);

    const { error } =
      await supabase
        .from("creators")
        .update({
          ...creatorData,
        })
        .eq(
          "id",
          creator.id
        );

    if (error) {

      console.error(error);

      alert(
        "Failed to save creator."
      );

    } else {

      setSaved(true);

        router.push(
          `/creator/${creator.id}`
);

    }

    setLoading(false);

  }

  return (

    <div
      className="
        max-w-[1450px]
        mx-auto
        space-y-8
      "
    >

      <CreatorEditBrandingSection
        creatorData={creatorData}
        setCreatorData={
          setCreatorData
        }
      />

      <CreatorEditSocialsSection
        creatorData={creatorData}
        setCreatorData={
          setCreatorData
        }
      />

      <CreatorEditTagsSection
        creatorData={creatorData}
        setCreatorData={
          setCreatorData
        }
      />

      <CreatorEditStatsSection />

      {/* SAVE */}
      <div
        className="
          flex
          items-center
          justify-end
          gap-5
          pt-2
          pb-12
        "
      >

        {saved && (

          <p
            className="
              text-emerald-400
            "
          >
            Creator profile saved.
          </p>

        )}

        <button
          onClick={saveCreator}
          disabled={loading}
          className="
            h-14
            px-10
            rounded-2xl
            bg-gradient-to-r
            from-violet-600
            to-fuchsia-500
            text-white
            font-bold
            text-lg
            transition
            hover:scale-[1.02]
            disabled:opacity-50
          "
        >

          {loading
            ? "Saving..."
            : "Save Changes"}

        </button>

      </div>

    </div>

  );

}