"use client";

import { useParams } from "next/navigation";

import Navbar from "@/components/layout/Navbar";

import UploadHero from "@/components/upload/UploadHero";

import ModFormContainer from "@/components/mod-form/ModFormContainer";
import ModForm from "@/components/mod-form/ModForm";

import FormLoader from "@/components/mod-form/FormLoader";

import useEditMod from "@/app/hooks/useEditMod";

export default function EditModPage() {

  const params =
    useParams();

  const modId =
    params.id;

  const {

    form,
    setForm,

    loading,
    loaded,

    handleChange,
    handleSubmit,
    handleDelete,

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

        />

      </ModFormContainer>

    </main>

  );

}