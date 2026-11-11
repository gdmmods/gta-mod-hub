"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

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

  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [notifyFollowers, setNotifyFollowers] = useState(true);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      setAuthenticated(Boolean(user));
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthenticated(Boolean(session?.user));
      setAuthChecked(true);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
    notifyFollowers,

  });

  if (!authChecked) {
    return <main className="min-h-screen bg-black text-white"><Navbar /><p className="mx-auto max-w-3xl px-6 py-20 text-zinc-400">Checking your account…</p></main>;
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-3xl font-bold">Sign in to upload a mod</h1>
          <p className="mt-3 text-zinc-400">Connect your ModVault account to publish a mod.</p>
          <Link href="/login" className="mt-7 inline-flex rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-500">Sign in or create an account</Link>
        </section>
      </main>
    );
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
          publicationOptions={form.visibility !== "supporters" && form.release_state !== "supporters" && <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={notifyFollowers} onChange={event => setNotifyFollowers(event.target.checked)} />
            Notify my followers about this new mod
          </label>}

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