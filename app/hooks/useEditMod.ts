"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

import { defaultModForm }from "@/lib/forms/defaultModForm";
import { editPublicationStatus, modSubmitAction } from "@/lib/forms/mod-publication";
import { isPublicModRelease } from "@/lib/server/public-creator-mods";
import { parseCreatorBackupUrl } from "@/lib/server/creatorBackupUrl";
import { normalizeModCategory } from "@/lib/vehicle-subcategories";

import { filterOperationalCreators } from '@/lib/team/operational-creators';

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

  const [form, setForm] =
  useState(defaultModForm);
  const [firstPublicationPending, setFirstPublicationPending] = useState(false);
  const [notifyFollowers, setNotifyFollowers] = useState(false);
  const firstPublicSave = firstPublicationPending && (form.status === "draft" || form.status === "published") &&
    isPublicModRelease({ ...form, status: "published" });

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

    setFirstPublicationPending(data.first_publication_pending === true && !isPublicModRelease(data));
    setNotifyFollowers(false);
    setForm({
  ...defaultModForm,
  ...data,
  category: normalizeModCategory(data.category, {
    title: data.title,
    description: data.description,
    tags: data.tags,
  }).category,
});

    setLoaded(true);
  }

  async function fetchCreators() {

  const {
    data: userData,
  } = await supabase.auth.getUser();

  const userId =
    userData.user?.id;

  if (!userId) return;

  const { data, error } =
    await supabase
      .from("creator_members")
      .select(`
        creator:creators (*)
      `)
      .eq(
        "profile_id",
        userId
      )
      .eq(
        "status",
        "approved"
      );

  if (error) {
    console.error(error);
    return;
  }

  const creators =
    data?.map(
      (item: any) =>
        item.creator
    ) || [];

  setCreators(await filterOperationalCreators(supabase, creators));

  /* -----------------------------
   ALL CREATORS
  ----------------------------- */

  const {
    data: creatorData,
    error: creatorError,
  } = await supabase
    .from("creators")
    .select(`
      id,
      name,
      owner_type,
      team_id
    `)
    .order(
      "name",
      {
        ascending: true,
      }
    );

  if (creatorError) {

    console.error(
      creatorError
    );

  } else {

    const operationalCreators = await filterOperationalCreators(supabase, creatorData ?? []);
    setAllCreators(operationalCreators);
    setFilteredCreators(operationalCreators);

  }

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
      ...(name === "visibility" && prev.release_state === "supporters" ? { release_state: value } : {}),

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
    const action = modSubmitAction(e.nativeEvent);
    const status = editPublicationStatus(form.status, action);
    if (action === "archive" && status === "archived" && !confirm("Archive this mod? It will be removed from public access.")) return;

    const backup = parseCreatorBackupUrl(form.creator_backup_url);
    if (!backup.valid) {
      alert("Creator Backup must be a valid HTTPS URL.");
      return;
    }

    setLoading(true);

    const { data: saved, error } =
      await supabase
        .from("mods")
        .update({
          ...(firstPublicSave && status === "published" ? { notify_followers_on_publication: notifyFollowers } : {}),
          status,

          title:
            form.title,

          description:
            form.description,

          category:
            normalizeModCategory(form.category, {
              title: form.title,
              description: form.description,
            }).category,

          image:
            form.image,

          images:
            form.images,

          source_url:
            form.source_url,

          download_url:
            form.download_url,

          creator_backup_url:
            backup.url,

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
        .eq("id", modId)
        .eq("status", form.status)
        .select("id")
        .maybeSingle();

    setLoading(false);

    if (error || !saved) {
      console.error(error);
      alert("Could not save this mod. Check your editing permissions and try again.");
      return;
    }

    window.location.href = action === "version-update"
      ? "/mods/" + modId + "?compose=version#announcements"
      : "/dashboard";
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
    firstPublicSave,
    notifyFollowers,
    setNotifyFollowers,

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
