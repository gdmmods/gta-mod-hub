"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase/client";

import CreatorEditBrandingSection from "@/components/creator/edit/CreatorEditBrandingSection";
import CreatorEditTagsSection from "@/components/creator/edit/CreatorEditTagsSection";
import CreatorEditStatsSection from "@/components/creator/edit/CreatorEditStatsSection";
import CreatorSocialsSection from "@/components/creator-settings/CreatorSocialsSection";

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

  const [aliases, setAliases] =
    useState<string[]>([]);

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

    console.log(
      "CREATOR DATA:"
    );

    console.log(
      creatorData
    );

    console.log(
      "SOCIALS:"
    );

    console.log(
      creatorData.socials
    );

    setLoading(true);

    setSaved(false);

    const {
      data,
      error,
    } = await supabase
      .from("creators")
      .update({
        ...creatorData,
      })
      .eq(
        "id",
        creator.id
      )
      .select();

    console.log(data);
    console.log(error);

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

      <CreatorSocialsSection
        form={creatorData}
        handleSocialChange={(
          field: string,
          value: string
        ) => {

          setCreatorData(
            (prev: any) => ({
              ...prev,

              socials: {
                ...prev.socials,
                [field]: value,
              },
            })
          );

        }}
      />

      <CreatorEditTagsSection
        creatorData={creatorData}
        setCreatorData={
          setCreatorData
        }
      />

      <CreatorEditStatsSection />

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