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

    const [
    creators,
    setCreators,
  ] = useState<any[]>([]);

  const [
    allCreators,
    setAllCreators,
  ] = useState<any[]>([]);

  const [
    selectedCreator,
    setSelectedCreator,
  ] = useState("");

  const [
    collaborators,
    setCollaborators,
  ] = useState<string[]>([]);

  const [
    filteredCreators,
    setFilteredCreators,
  ] = useState<any[] | null>(null);

  const [form, setForm] =
    useState({

       status: "published",

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

      /* -----------------------------
         LOAD USER CREATORS
      ----------------------------- */

      const {
        data: ownedCreators,
      } = await supabase
        .from("creators")
        .select(`
          id,
          name
        `)
        .in(
          "id",
          creatorIds
        );

      setCreators(
        ownedCreators || []
      );

      /* -----------------------------
         LOAD ALL CREATORS
      ----------------------------- */

      const {
        data: creatorData,
      } = await supabase
        .from("creators")
        .select(`
          id,
          name
        `)
        .order(
          "name",
          {
            ascending: true,
          }
        );

      setAllCreators(
        creatorData || []
      );

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

            /* -----------------------------
         LOAD MOD CREATOR RELATIONS
      ----------------------------- */

      const {
        data: modCreators,
      } = await supabase
        .from("mod_creators")
        .select(`
          creator_id,
          role
        `)
        .eq(
          "mod_id",
          modId
        );

      const owner =
        modCreators?.find(
          (m: any) =>
            m.role === "owner"
        );

      const collabs =
        modCreators
          ?.filter(
            (m: any) =>
              m.role ===
              "collaborator"
          )
          .map(
            (m: any) =>
              m.creator_id
          ) || [];

      if (owner) {

        setSelectedCreator(
          owner.creator_id
        );

      }

      setCollaborators(
        collabs
      );

      setForm({

        status:
  data.status || "published",

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

        /* -----------------------------
       RESET CREATOR RELATIONS
    ----------------------------- */

    await supabase
      .from("mod_creators")
      .delete()
      .eq(
        "mod_id",
        modId
      );

    /* -----------------------------
       OWNER
    ----------------------------- */

    if (selectedCreator) {

      await supabase
        .from("mod_creators")
        .insert({
          mod_id: modId,
          creator_id:
            selectedCreator,
          role: "owner",
        });

    }

    /* -----------------------------
       COLLABORATORS
    ----------------------------- */

    if (
      collaborators.length > 0
    ) {

      const rows =
        collaborators.map(
          (creatorId) => ({
            mod_id: modId,
            creator_id:
              creatorId,
            role:
              "collaborator",
          })
        );

      await supabase
        .from("mod_creators")
        .insert(rows);

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

        creators,
    allCreators,

    selectedCreator,
    setSelectedCreator,

    collaborators,
    setCollaborators,

    filteredCreators,
    setFilteredCreators,

  };

}