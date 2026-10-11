"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Navbar from "@/components/layout/Navbar";

import UploadHero from "@/components/upload/UploadHero";

import ModFormContainer from "@/components/mod-form/ModFormContainer";
import ModForm from "@/components/mod-form/ModForm";

import FormLoader from "@/components/mod-form/FormLoader";

import useEditMod from "@/app/hooks/useEditMod";

import UploadCreatorSelector from "@/components/upload/UploadCreatorSelector";

import UploadCollaboratorsSection from "@/components/upload/UploadCollaboratorsSection";

import ModHero from "@/components/mod/ModHero";
import ModTabs from "@/components/mod/ModTabs";
import ModMetaGrid from "@/components/mod/ModMetaGrid";

export default function EditModPage() {

    const router = useRouter();

  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  if (params.get("preview") === "true") {
    setPreviewMode(true);
  }
}, []);

  const params =
    useParams();

  const modId = Array.isArray(params.id)
  ? params.id[0]
  : params.id || "";

  const {

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

  } = useEditMod(
    modId
  );

  if (!loaded) {

    return <FormLoader />;

  }

    const images: string[] = (() => {

    if (Array.isArray(form.images)) {

      return form.images.filter(
        (image: unknown): image is string =>
          typeof image === "string" &&
          image.length > 0
      );

    }

    if (
  typeof form.images === "string" &&
  (form.images as string).length > 0
) {

      try {

        const parsed = JSON.parse(form.images);

        return Array.isArray(parsed)
          ? parsed.filter(
              (image: unknown): image is string =>
                typeof image === "string" &&
                image.length > 0
            )
          : [];

      } catch {

        return [];

      }

    }

    return [];

  })();

  const previewMod = {
    ...form,
    id: modId,
    title: form.title || "Untitled Mod",
    image: form.image || "",
  };

  return (

    <main
      className="
        min-h-screen
        bg-black
        text-white
      "
    >

      <Navbar />

            {!previewMode && <UploadHero />}

      {!previewMode && (
        <div className="flex justify-end px-6 pt-6">
        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className="
            rounded-xl
            border
            border-purple-500/30
            bg-purple-500/10
            px-5
            py-3
            text-sm
            font-medium
            text-purple-300
            transition
            hover:bg-purple-500/20
          "
        >
          Preview Mod
                </button>
        </div>
      )}

      {!previewMode && (
      <ModFormContainer>

          <ModForm

            form={form}
            setForm={setForm}

            handleChange={
              handleChange
            }

            handleSubmit={
              handleSubmit
            }

            loading={loading}

            dangerZone={true}

            handleDelete={
              handleDelete
            }

            creatorSelector={

              <UploadCreatorSelector
                creators={creators}
                selectedCreator={
                  selectedCreator
                }
                setSelectedCreator={
                  setSelectedCreator
                }
              />

            }

            collaboratorsSection={

              <UploadCollaboratorsSection
                allCreators={allCreators}
                filteredCreators={
                  filteredCreators
                }
                setFilteredCreators={
                  setFilteredCreators
                }
                selectedCreator={
                  selectedCreator
                }
                collaborators={collaborators}
                setCollaborators={
                  setCollaborators
                }
              />

            }

          />

        </ModFormContainer>
      )}

          {previewMode && (
        <div className="mx-auto max-w-[1450px] space-y-6 px-4 py-6 md:px-6">

          {/* PREVIEW NOTICE */}
          <div className="flex flex-col gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                Draft Preview — Not Published
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                Previewing current form data. Changes have not been saved automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm transition hover:bg-zinc-800"
            >
              Back to Editor
            </button>
          </div>

          {/* TITLE */}
          <section className="rounded-3xl border border-zinc-900 bg-zinc-950/70 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-purple-400">
              {previewMod.category || "Uncategorized"}
            </p>

            <h1 className="mt-3 break-words text-3xl font-black tracking-tight md:text-5xl">
              {previewMod.title}
            </h1>
          </section>

          {/* GALLERY */}
          <ModHero
            key={`${modId}-${previewMod.image}-${images.join("|")}`}
            mod={previewMod}
            images={images}
          />

          {/* CONTENT AND METADATA */}
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">

            <div className="min-w-0">
              <ModTabs mod={previewMod} />
            </div>

            <section className="rounded-[30px] border border-zinc-900 bg-zinc-950/75 p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                Mod Information
              </p>

              <h2 className="mb-5 mt-2 text-xl font-semibold">
                Details
              </h2>

              <ModMetaGrid
                mod={previewMod}
                creators={
                  selectedCreator
                    ? [selectedCreator]
                    : []
                }
                images={images}
              />
            </section>

          </div>

        </div>
      )}

   </main>

  );

}