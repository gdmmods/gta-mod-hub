"use client";

import { useState } from "react";

import Navbar from "@/components/layout/Navbar";

import UploadHero from "@/components/upload/UploadHero";

import ModFormContainer
from "@/components/mod-form/ModFormContainer";

import ModForm
from "@/components/mod-form/ModForm";

import UploadCreatorSelector
from "@/components/upload/UploadCreatorSelector";

import UploadCollaboratorsSection
from "@/components/upload/UploadCollaboratorsSection";

import useUploadCreators
from "@/app/hooks/useUploadCreators";

import useUploadSubmit
from "@/app/hooks/useUploadSubmit";

import { defaultModForm }
from "@/lib/forms/defaultModForm";

export default function UploadPage() {

  /* --------------------------------
     CREATORS
  -------------------------------- */

  const {

    creators,
    allCreators,

    selectedCreator,
    setSelectedCreator,

  } = useUploadCreators();

  /* --------------------------------
     FORM
  -------------------------------- */

  const [
    form,
    setForm,
  ] = useState(defaultModForm);

  /* --------------------------------
     COLLABORATORS
  -------------------------------- */

  const [
    collaborators,
    setCollaborators,
  ] = useState<any[]>([]);

  /* --------------------------------
     FILTERED SEARCH
  -------------------------------- */

  const [
    filteredCreators,
    setFilteredCreators,
  ] = useState<any[]>([]);

  /* --------------------------------
     INPUT CHANGE
  -------------------------------- */

  function handleChange(
    e: any
  ) {

    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((prev: any) => ({

      ...prev,

      [name]:
        type === "checkbox"
          ? checked
          : value,

    }));

  }

  /* --------------------------------
     SUBMIT
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

          creatorSelector={

            <UploadCreatorSelector

              creators={creators}

              selectedCreator={
                selectedCreator || ""
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