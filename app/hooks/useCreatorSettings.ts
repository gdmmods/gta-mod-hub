"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase/client";

export default function useCreatorSettings(
  creatorId: string
) {

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

      avatar: "",

      banner: "",

      specialization: "",

      location: "",

      discord: "",

      youtube: "",

      website: "",

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
            JSON.stringify(error, null, 2)
            );

        return;

      }

      const socials =
        creator.socials || {};

      setForm({

        name:
          creator.name || "",

        tagline:
          creator.tagline || "",

        bio:
          creator.bio || "",

        avatar:
          creator.avatar || "",

        banner:
          creator.banner || "",

        specialization:
          creator.specialization || "",

        location:
          creator.location || "",

        discord:
          socials.discord || "",

        youtube:
          socials.youtube || "",

        website:
          socials.website || "",

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

    setForm({

      ...form,

      [e.target.name]:
        e.target.value,

    });

  }

  /* --------------------------------
     SAVE
  -------------------------------- */

  async function handleSubmit(
    e: any
  ) {

    e.preventDefault();

    setLoading(true);

    const socials = {

      discord:
        form.discord,

      youtube:
        form.youtube,

      website:
        form.website,

    };

    const { error } =
      await supabase
        .from("creators")
        .update({

          name:
            form.name,

          tagline:
            form.tagline,

          bio:
            form.bio,

          avatar:
            form.avatar,

          banner:
            form.banner,

          specialization:
            form.specialization,

          location:
            form.location,

          socials,

        })
        .eq(
          "id",
          creatorId
        );

    if (error) {

      console.error(error);

      alert(
        "Failed to save creator profile."
      );

    } else {

      alert(
        "Creator profile updated."
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