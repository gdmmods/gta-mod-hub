"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

export default function useEditMod(modId: string | string[]) {
  const [loading, setLoading] =
    useState(false);

  const [loaded, setLoaded] =
    useState(false);

  const [creators, setCreators] =
    useState<any[]>([]);

  const [allCreators, setAllCreators] =
    useState<any[]>([]);

  const [selectedCreator, setSelectedCreator] =
    useState<any>("");

  const [collaborators, setCollaborators] =
    useState<any[]>([]);

  const [filteredCreators, setFilteredCreators] =
    useState<any[]>([]);

  const [form, setForm] = useState({
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

    // Monetization

    visibility: "public",

    delivery_mode: "external",

    support_url: "",

    external_purchase_url: "",

    ownership_required: false,

    release_state: "public",

    is_paid: false,

    price: 0,
  });

  useEffect(() => {
    if (!modId) return;

    fetchMod();
    fetchCreators();
  }, [modId]);

  async function fetchMod() {
    const { data, error } =
      await supabase
        .from("mods")
        .select("*")
        .eq("id", modId)
        .single();

    if (error) {
      console.error(error);
      return;
    }

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

      // Monetization

      visibility:
        data.visibility || "public",

      delivery_mode:
        data.delivery_mode || "external",

      support_url:
        data.support_url || "",

      external_purchase_url:
        data.external_purchase_url || "",

      ownership_required:
        data.ownership_required || false,

      release_state:
        data.release_state || "public",

      is_paid:
        data.is_paid || false,

      price:
        data.price || 0,
    });

    setLoaded(true);
  }

  async function fetchCreators() {
    const { data, error } =
      await supabase
        .from("creators")
        .select("*");

    if (error) {
      console.error(error);
      return;
    }

    setCreators(data || []);
    setAllCreators(data || []);
    setFilteredCreators(data || []);
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) {
    const { name, value, type } =
      e.target;

    setForm((prev) => ({
      ...prev,

      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement)
              .checked
          : value,
    }));
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);

    const { error } =
      await supabase
        .from("mods")
        .update({
          status:
            form.status,

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

          // Monetization

          visibility:
            form.visibility,

          delivery_mode:
            form.delivery_mode,

          support_url:
            form.support_url,

          external_purchase_url:
            form.external_purchase_url,

          ownership_required:
            form.ownership_required,

          release_state:
            form.release_state,

          is_paid:
            form.is_paid,

          price:
            form.price,
        })
        .eq("id", modId);

    setLoading(false);

    if (error) {
      console.error(error);
      return;
    }

    alert("Mod updated successfully.");
  }

  async function handleDelete() {
    const confirmed =
      confirm(
        "Are you sure you want to delete this mod?"
      );

    if (!confirmed) return;

    const { error } =
      await supabase
        .from("mods")
        .delete()
        .eq("id", modId);

    if (error) {
      console.error(error);
      return;
    }

    window.location.href = "/";
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