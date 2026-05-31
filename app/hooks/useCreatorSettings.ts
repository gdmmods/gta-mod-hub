"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase/client";

import {
  useRouter,
} from "next/navigation";

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

  const [form, setForm] =
    useState({

      name: "",

      tagline: "",

      bio: "",

      status: "",

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
    e: any
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

      setForm((prev: any) => ({

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
    setForm((prev: any) => ({

      ...prev,

      [name]:
        value,

    }));

  }

  /* --------------------------------
     SAVE
  -------------------------------- */

  async function handleSubmit(
    e: any
  ) {

    e.preventDefault();

    setLoading(true);

    console.log(
      "FINAL FORM:"
    );

    console.log(form);

    console.log(
      "FINAL SOCIALS:"
    );

    console.log(
      form.socials
    );

    const {
      data,
      error,
    } = await supabase
      .from("creators")
      .update({

        name:
          form.name,

        tagline:
          form.tagline,

        bio:
          form.bio,

        status:
          form.status,

        avatar:
          form.avatar,

        banner:
          form.banner,

        specialization:
          form.specialization,

        location:
          form.location,

        socials:
          form.socials,

      })
      .eq(
        "id",
        creatorId
      )
      .select();

      if (!error) {

        await supabase
          .from("creator_aliases")
          .delete()
          .eq(
            "creator_id",
            creatorId
          );

        const uniqueAliases =
          [...new Set(
            form.aliases
              .map((a) => a.trim())
              .filter((a) => a !== "")
          )];

        const aliasesToInsert =
          uniqueAliases.map(
            (alias) => ({
              creator_id:
                creatorId,
              alias,
            })
          );
        

        if (
          aliasesToInsert.length > 0
        ) {

          const {
            error:
              aliasesError,
          } = await supabase
            .from(
              "creator_aliases"
            )
            .insert(
              aliasesToInsert
            );

          if (aliasesError) {

            console.error(
              "ALIASES SAVE ERROR:",
              aliasesError
            );

            alert(
              "Failed to save aliases."
            );

}

        }

      }

    console.log(
      "UPDATE RESULT:"
    );

    console.log(data);

    console.log(
      "UPDATE ERROR:"
    );

    console.log(error);

    if (!error) {

  router.push(
    `/creator/${creatorId}`
  );

}

    setLoading(false);

  }

    return {

    form,

    setForm,

    loading,

    loaded,

    handleChange,

    handleSubmit,

  };

}