"use client";

import { useState } from "react";

import Navbar from "@/components/layout/Navbar";

import UploadHero from "@/components/upload/UploadHero";

import UploadBasicSection from "@/components/upload/UploadBasicSection";
import UploadMediaSection from "@/components/upload/UploadMediaSection";
import UploadLinksSection from "@/components/upload/UploadLinksSection";
import UploadDetailsSection from "@/components/upload/UploadDetailsSection";
import UploadSidebar from "@/components/upload/UploadSidebar";

import UploadCreatorSelector from "@/components/upload/UploadCreatorSelector";
import UploadCollaboratorsSection from "@/components/upload/UploadCollaboratorsSection";
import UploadSubmitSection from "@/components/upload/UploadSubmitSection";

import useUploadCreators from "@/app/hooks/useUploadCreators";
import useUploadSubmit from "@/app/hooks/useUploadSubmit";

export default function UploadPage() {

  /* --------------------------------
     CREATOR HOOK
  -------------------------------- */

  const {

    creators,
    allCreators,

    selectedCreator,
    setSelectedCreator,

  } = useUploadCreators();

  /* --------------------------------
     SEARCH RESULTS
  -------------------------------- */

  const [
    filteredCreators,
    setFilteredCreators,
  ] = useState<any[] | null>(null);

  /* --------------------------------
     COLLABORATORS
  -------------------------------- */

  const [
    collaborators,
    setCollaborators,
  ] = useState<string[]>([]);

  /* --------------------------------
     FORM
  -------------------------------- */

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
     INPUT CHANGE
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
     SUBMIT HOOK
  -------------------------------- */

  const {

    loading,
    handleSubmit,

  } = useUploadSubmit({

    form,
    selectedCreator,
    collaborators,

  });

  return (

    <main
      className="
        min-h-screen
        overflow-hidden
        bg-[#040404]
        text-white
      "
    >

      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <UploadHero />

      {/* CONTENT */}
      <div
        className="
          max-w-6xl
          mx-auto
          px-6
          py-14
          grid
          lg:grid-cols-[1fr_320px]
          gap-8
        "
      >

        {/* FORM */}
        <div
          className="
            bg-zinc-900/60
            border
            border-zinc-800
            rounded-3xl
            p-8
            backdrop-blur-xl
          "
        >

          {/* CREATOR */}
          <UploadCreatorSelector
            creators={creators}
            selectedCreator={
              selectedCreator
            }
            setSelectedCreator={
              setSelectedCreator
            }
          />

          {/* FORM */}
          <form
            onSubmit={
              handleSubmit
            }
            className="
              space-y-10
            "
          >

            <UploadBasicSection
              form={form}
              handleChange={
                handleChange
              }
            />

            <UploadCollaboratorsSection
              allCreators={
                allCreators
              }
              filteredCreators={
                filteredCreators
              }
              setFilteredCreators={
                setFilteredCreators
              }
              selectedCreator={
                selectedCreator
              }
              collaborators={
                collaborators
              }
              setCollaborators={
                setCollaborators
              }
            />

            <UploadMediaSection
              form={form}
              setForm={setForm}
            />

            <UploadLinksSection
              form={form}
              handleChange={
                handleChange
              }
            />

            <UploadDetailsSection
              form={form}
              handleChange={
                handleChange
              }
            />

            <UploadSubmitSection
              loading={loading}
            />

          </form>

        </div>

        {/* SIDEBAR */}
        <UploadSidebar
          form={form}
        />

      </div>

    </main>

  );

}