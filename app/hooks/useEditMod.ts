"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase/client";

export default function useEditMod(
  modId: any
) {

  const [loading, setLoading] =
    useState(false);

  const [loaded, setLoaded] =
    useState(false);

  const [form, setForm] =
    useState({

      title: "",
      description: "",

      image: "",
      images: [],

      source_url: "",
      download_url: "",

      features: "",
      requirements: "",
      notes: "",
      credits: "",

    });

  /* --------------------------------
     LOAD MOD
  -------------------------------- */

  useEffect(() => {

    async function loadMod() {

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (!session) {

        alert(
          "You must be logged in."
        );

        return;

      }

      const {
        data: memberships,
      } = await supabase
        .from("creator_members")
        .select(`
          creator_id
        `)
        .eq(
          "profile_id",
          session.user.id
        )
        .eq(
          "status",
          "approved"
        );

      const creatorIds =
        memberships?.map(
          (m: any) =>
            m.creator_id
        ) || [];

      const {
        data: relation,
      } = await supabase
        .from("mod_creators")
        .select(`
          mod_id,
          creator_id
        `)
        .eq(
          "mod_id",
          modId
        )
        .in(
          "creator_id",
          creatorIds
        )
        .maybeSingle();

      if (!relation) {

        alert(
          "No permission."
        );

        window.location.href =
          "/dashboard";

        return;

      }

      const {
        data,
        error,
      } = await supabase
        .from("mods")
        .select("*")
        .eq(
          "id",
          modId
        )
        .single();

      if (error) {

        console.error(error);

        return;

      }

      setForm({

        title:
          data.title || "",

        description:
          data.description || "",

        image:
          data.image || "",

        images:
          data.images || [],

        source_url:
          data.source_url || "",

        download_url:
          data.download_url || "",

        features:
          data.features || "",

        requirements:
          data.requirements || "",

        notes:
          data.notes || "",

        credits:
          data.credits || "",

      });

      setLoaded(true);

    }

    if (modId) {

      loadMod();

    }

  }, [modId]);

  /* --------------------------------
     INPUT
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

    const {
      error,
    } = await supabase
      .from("mods")
      .update({

        title:
          form.title,

        description:
          form.description,

        image:
          form.image,

        images:
          form.images,

        source_url:
          form.source_url,

        download_url:
          form.download_url,

        features:
          form.features,

        requirements:
          form.requirements,

        notes:
          form.notes,

        credits:
          form.credits,

      })
      .eq(
        "id",
        modId
      );

    if (error) {

      console.error(error);

      alert(
        "Update failed"
      );

    } else {

      alert(
        "Mod updated"
      );

    }

    setLoading(false);

  }

  /* --------------------------------
     DELETE
  -------------------------------- */

  async function handleDelete() {

    const confirmed =
      confirm(
        "Delete this mod permanently?"
      );

    if (!confirmed)
      return;

    setLoading(true);

    await supabase
      .from("mod_creators")
      .delete()
      .eq(
        "mod_id",
        modId
      );

    const {
      error,
    } = await supabase
      .from("mods")
      .delete()
      .eq(
        "id",
        modId
      );

    if (error) {

      console.error(error);

      alert(
        "Delete failed"
      );

    } else {

      alert(
        "Mod deleted"
      );

      window.location.href =
        "/dashboard";

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
    handleDelete,

  };

}