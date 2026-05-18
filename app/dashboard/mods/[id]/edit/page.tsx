"use client";

import { useParams } from "next/navigation";

import Navbar from "@/components/layout/Navbar";

import UploadHero from "@/components/upload/UploadHero";

import ModFormContainer from "@/components/mod-form/ModFormContainer";
import ModForm from "@/components/mod-form/ModForm";

import FormLoader from "@/components/mod-form/FormLoader";

import useEditMod from "@/app/hooks/useEditMod";

import UploadCreatorSelector from "@/components/upload/UploadCreatorSelector";

import UploadCollaboratorsSection from "@/components/upload/UploadCollaboratorsSection";

export default function EditModPage() {

  const params =
    useParams();

  const modId =
  typeof params.id === "string"
    ? params.id
    : "";

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

  return (

    <main
      className="
        min-h-screen
        bg-black
        text-white
      "
    >

      <Navbar />

      <UploadHero />

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

          }
        />

      </ModFormContainer>

    </main>

  );

}