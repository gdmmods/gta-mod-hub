"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, FormEvent } from "react";

import {
  supabase,
} from "@/lib/supabase/client";

import {
  useRouter,
} from "next/navigation";

import { normalizeProfileLinks, profileSocialFields } from "@/lib/profile/fields";

type CreatorSettingsValues = {
  name: string;
  tagline: string;
  bio: string;
  status: string;
  owner_id: string;
  team_id: string;
  owner_type: string;
  avatar: string;
  banner: string;
  specialization: string[];
  location: string;
  aliases: string[];
  socials: Record<string, string>;
};

export default function useCreatorSettings(
  creatorId: string
) {

  const router =
  useRouter();

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loaded,
    setLoaded,
  ] = useState(false);

  const [saveError, setSaveError] = useState<string | null>(null);
  const savedUrls = useRef<Record<string, string>>({});
  const [savedOwnerType, setSavedOwnerType] = useState("user");

  const [form, setForm] =
    useState<CreatorSettingsValues>({

      name: "",

      tagline: "",

      bio: "",

      status: "",

      owner_id: "",

      team_id: "",

      owner_type: "user",

      avatar: "",

      banner: "",

      specialization: [] as string[],

      location: "",

      aliases: [] as string[],

      socials: {

        discord: "",

        youtube: "",

        website: "",

        instagram: "",

        twitter: "",

        github: "",

        patreon: "",

        kofi: "",

        store: "",

        support_email: "",

      },

    });

  /* --------------------------------
     LOAD
  -------------------------------- */

  useEffect(() => {

    async function loadCreator() {

      const {
        data: creator,
        error,
      } = await supabase
        .from("creators")
        .select(`
          id,
          name,
          tagline,
          bio,
          status,
          owner_id,
          owner_type,
          team_id,
          avatar,
          banner,
          specialization,
          location,
          socials
        `)
        .eq(
          "id",
          creatorId
        )
        .maybeSingle();

      if (
        error ||
        !creator
      ) {

        console.error(
          "CREATOR SETTINGS LOAD ERROR:",
          JSON.stringify(
            error,
            null,
            2
          )
        );

        return;

      }

      const {
        data: aliasesData,
      } = await supabase
        .from("creator_aliases")
        .select("alias")
        .eq("creator_id", creatorId);

      const socials =
        creator.socials || {};

      setForm({

        name:
          creator.name || "",

        tagline:
          creator.tagline || "",

        bio:
          creator.bio || "",

        status: 
          creator.status || "",

          owner_id:
            creator.owner_id || "",

          team_id:
          creator.team_id || "",

        owner_type:
          creator.owner_type ||
          "user",

        avatar:
          creator.avatar || "",

        banner:
          creator.banner || "",

        specialization:
          Array.isArray(
            creator.specialization
          )
            ? creator.specialization
            : [],

        location:
          creator.location || "",

        aliases:
          aliasesData?.map(
            (a) => a.alias
          ) || [],

        socials: {

          discord:
            socials.discord || "",

          youtube:
            socials.youtube || "",

          website:
            socials.website || "",

          instagram:
            socials.instagram || "",

          twitter:
            socials.twitter || "",

          github:
            socials.github || "",

          patreon:
            socials.patreon || "",

          kofi:
            socials.kofi || "",

          store:
            socials.store || "",

          support_email:
            socials.support_email || "",

        },

      });

      savedUrls.current = { ...socials, avatar: creator.avatar || "", banner: creator.banner || "" };
      setSavedOwnerType(creator.owner_type || "user");

      setLoaded(true);

    }

    if (creatorId) {

      loadCreator();

    }

  }, [creatorId]);

  /* --------------------------------
     CHANGE
  -------------------------------- */

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {

    const name =
      e.target.name;

    const value =
      e.target.value;

    /* SOCIALS */
    if (
      name.startsWith(
        "socials."
      )
    ) {

      const socialKey =
        name.replace(
          "socials.",
          ""
        );

      setForm((prev) => ({

        ...prev,

        socials: {

          ...prev.socials,

          [socialKey]:
            value,

        },

      }));

      return;

    }

    /* NORMAL FIELDS */
    setForm((prev) => ({

      ...prev,

      [name]:
        value,

    }));

  }

  /* --------------------------------
     SAVE
  -------------------------------- */

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setLoading(true);
    setSaveError(null);
    try {
      if (form.owner_type !== savedOwnerType) {
        throw new Error("Profile type cannot be changed here. Use the Create Team flow to create a Team profile.");
      }
      if (savedOwnerType === "team" && !form.team_id) {
        throw new Error("This Team profile is missing its team link. Contact support before saving.");
      }

      const urls: Record<string, string> = { ...form.socials, avatar: form.avatar, banner: form.banner };
      const changedUrls = [...profileSocialFields, "avatar", "banner", "patreon", "kofi", "store"]
        .filter(field => urls[field] !== (savedUrls.current[field] ?? ""));
      normalizeProfileLinks(urls, changedUrls);

      const { data: updatedCreator, error: updateError } = await supabase
        .from("creators")
        .update({
          name: form.name,
          tagline: form.tagline,
          bio: form.bio,
          status: form.status,
          ...(savedOwnerType === "team" ? { owner_id: form.team_id } : {}),
          avatar: form.avatar,
          banner: form.banner,
          specialization: form.specialization,
          location: form.location,
          socials: form.socials,
        })
        .eq("id", creatorId)
        .select("id")
        .maybeSingle();

      if (updateError) throw new Error(updateError.message);
      if (!updatedCreator) {
        throw new Error("No profile was updated. Check that you still own this creator profile and try again.");
      }

      const { error: aliasesDeleteError } = await supabase
        .from("creator_aliases")
        .delete()
        .eq("creator_id", creatorId);
      if (aliasesDeleteError) {
        throw new Error(`Profile details were saved, but aliases could not be updated: ${aliasesDeleteError.message}`);
      }

      const uniqueAliases = [...new Set(
        form.aliases.map((alias: string) => alias.trim()).filter((alias: string) => alias !== ""),
      )];
      if (uniqueAliases.length > 0) {
        const { error: aliasesInsertError } = await supabase
          .from("creator_aliases")
          .insert(uniqueAliases.map((alias: string) => ({ creator_id: creatorId, alias })));
        if (aliasesInsertError) {
          throw new Error(`Profile details were saved, but aliases could not be updated: ${aliasesInsertError.message}`);
        }
      }

      router.push(`/creator/${creatorId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred while saving.";
      console.warn("CREATOR SETTINGS SAVE ERROR:", message);
      setSaveError(message);
    } finally {
      setLoading(false);
    }
  }

    return {

    form,

    setForm,

    loading,

    saveError,

    loaded,

    handleChange,

    handleSubmit,

  };

}
