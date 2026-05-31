"use client";

import {
  useParams,
} from "next/navigation";

import Navbar from "@/components/layout/Navbar";

import PageLoader from "@/components/ui/PageLoader";

import CreatorOwnershipGuard from "@/components/creator/edit/CreatorOwnershipGuard";

import CreatorSettingsHeader from "@/components/creator-settings/CreatorSettingsHeader";

import CreatorSettingsForm from "@/components/creator-settings/CreatorSettingsForm";

import useCreatorSettings from "@/app/hooks/useCreatorSettings";

export default function CreatorSettingsPage() {

  const params =
    useParams();

  const creatorId =
    params.id as string;

console.log(
  "CREATOR SETTINGS PARAM:",
  creatorId
);

  const {

    form,
    setForm,

    loading,
    loaded,

    handleChange,
    handleSubmit,

  } = useCreatorSettings(
    creatorId
  );

  if (!loaded) {

    return (
      <PageLoader
        text="Loading creator settings..."
      />
    );

  }

  return (

    <CreatorOwnershipGuard
      creatorId={creatorId}
    >

      <main
        className="
          min-h-screen
          bg-black
          text-white
        "
      >

        <Navbar />

        <div
          className="
            max-w-5xl
            mx-auto
            px-6
            py-16
          "
        >

          <CreatorSettingsHeader />

          <div
            className="
              rounded-3xl
              border
              border-zinc-800
              bg-zinc-900/60
              backdrop-blur-xl
              p-8
            "
          >

            <CreatorSettingsForm
              form={form}
              setForm={setForm}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              loading={loading}
            />

          </div>

        </div>

      </main>

    </CreatorOwnershipGuard>

  );

}