"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase/client";

import UploadBasicSection from "@/components/upload/UploadBasicSection";
import UploadMediaSection from "@/components/upload/UploadMediaSection";
import UploadLinksSection from "@/components/upload/UploadLinksSection";
import UploadDetailsSection from "@/components/upload/UploadDetailsSection";
import UploadSidebar from "@/components/upload/UploadSidebar";

export default function UploadPage() {

  const [loading, setLoading] =
    useState(false);

  /* --------------------------------
     OWNED CREATOR PROFILES
  -------------------------------- */

  const [creators, setCreators] =
    useState<any[]>([]);

  /* --------------------------------
     ALL PLATFORM CREATORS
  -------------------------------- */

  const [
    allCreators,
    setAllCreators,
  ] = useState<any[]>([]);

  const [
    filteredCreators,
    setFilteredCreators,
  ] = useState<any[] | null>(null);

  /* --------------------------------
     PRIMARY CREATOR
  -------------------------------- */

  const [
    selectedCreator,
    setSelectedCreator,
  ] = useState("");

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
     LOAD CREATOR DATA
  -------------------------------- */

  useEffect(() => {

    async function loadCreators() {

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!session)
        return;

      /* -----------------------------
         OWNED CREATOR MEMBERSHIPS
      ----------------------------- */

      const {
        data: memberships,
        error,
      } = await supabase
        .from(
          "creator_members"
        )
        .select(`
          creator_id,
          role,
          status,
          creators (
            id,
            name
          )
        `)
        .eq(
          "profile_id",
          session.user.id
        )
        .eq(
          "status",
          "approved"
        );

      if (error) {

        console.error(
          "CREATOR LOAD ERROR:",
          error
        );

        return;

      }

      const mapped =
        memberships?.map(
          (m: any) => ({
            id:
              m.creators.id,
            name:
              m.creators.name,
          })
        ) || [];

      setCreators(mapped);

      if (
        mapped.length > 0
      ) {

        setSelectedCreator(
          mapped[0].id
        );

      }

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
          name
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

        setAllCreators(
          creatorData || []
        );

      }

    }

    loadCreators();

  }, []);

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
     SUBMIT
  -------------------------------- */

  async function handleSubmit(
    e: any
  ) {

    e.preventDefault();

    setLoading(true);

    try {

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!session) {

        alert(
          "You must be logged in."
        );

        setLoading(false);

        return;

      }

      if (
        !selectedCreator
      ) {

        alert(
          "No creator profile available."
        );

        setLoading(false);

        return;

      }

      const res =
        await fetch(
          "/api/upload",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({
              ...form,

              creator_id:
                selectedCreator,

              collaborators,
            }),
          }
        );

      if (!res.ok) {

        const error =
          await res.json();

        console.error(
          error
        );

        alert(
          "Upload failed"
        );

      } else {

        alert(
          "Mod uploaded!"
        );

        window.location.href =
          "/";

      }

    } catch (err) {

      console.error(
        "UPLOAD ERROR:",
        err
      );

      alert(
        "Error uploading"
      );

    }

    setLoading(false);

  }

  return (

    <main
      className="
        min-h-screen
        bg-black
        text-white
      "
    >

      {/* NAVBAR */}
      <div
        className="
          flex
          justify-between
          items-center
          px-10
          py-6
          border-b
          border-zinc-800
        "
      >

        <Link
          href="/"
          className="
            text-xl
            font-bold
            tracking-tight
          "
        >
          ModVault
        </Link>

        <div
          className="
            flex
            gap-6
            text-sm
            text-gray-400
          "
        >

          <Link
            href="/"
            className="
              hover:text-white
              transition
            "
          >
            Mods
          </Link>

          <Link
            href="/creators"
            className="
              hover:text-white
              transition
            "
          >
            Creators
          </Link>

        </div>

      </div>

      {/* HERO */}
      <div
        className="
          max-w-6xl
          mx-auto
          px-6
          pt-16
        "
      >

        <p
          className="
            text-purple-400
            text-sm
            tracking-[0.2em]
            mb-3
          "
        >
          CREATOR UPLOAD
        </p>

        <h1
          className="
            text-5xl
            font-bold
            leading-tight
          "
        >
          Publish your mod.
          <br />
          Showcase your work properly.
        </h1>

        <p
          className="
            mt-6
            text-lg
            text-gray-400
            max-w-3xl
            leading-relaxed
          "
        >
          Creator-owned uploads,
          structured metadata,
          premium presentation,
          and long-term preservation.
        </p>

      </div>

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

          {/* PRIMARY CREATOR */}
          <div className="mb-10">

            <label
              className="
                block
                text-sm
                font-medium
                mb-3
              "
            >
              Upload As
            </label>

            <select
              value={
                selectedCreator
              }
              onChange={(e) =>
                setSelectedCreator(
                  e.target.value
                )
              }
              className="
                w-full
                p-4
                bg-black
                border
                border-zinc-800
                rounded-xl
                text-white
                focus:outline-none
                focus:border-purple-500
              "
            >

              {creators.length === 0 && (

                <option value="">
                  No approved creator profiles
                </option>

              )}

              {creators.map(
                (
                  creator
                ) => (

                  <option
                    key={
                      creator.id
                    }
                    value={
                      creator.id
                    }
                  >
                    {
                      creator.name
                    }
                  </option>

                )
              )}

            </select>

            <p
              className="
                text-xs
                text-gray-500
                mt-2
              "
            >
              Upload ownership
              comes from verified
              creator profiles.
            </p>

          </div>

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

            {/* COLLABORATORS */}
            <div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  mb-4
                "
              >

                <h2
                  className="
                    text-xl
                    font-semibold
                  "
                >
                  Additional Creators
                </h2>

                <span
                  className="
                    text-xs
                    text-gray-500
                  "
                >
                  Multi-creator support
                </span>

              </div>

              {/* SEARCH */}
              <input
                type="text"
                placeholder="
                  Search creator profiles...
                "
                onChange={(e) => {

                  const value =
                    e.target.value
                      .trim()
                      .toLowerCase();

                  if (!value) {

                    setFilteredCreators(
                      null
                    );

                    return;

                  }

                  const filtered =
                    allCreators
                      .filter(
                        (creator) =>
                          creator.name
                            .toLowerCase()
                            .includes(value)
                      )
                      .slice(0, 5);

                  setFilteredCreators(
                    filtered
                  );

                }}
                className="
                  w-full
                  p-4
                  bg-black
                  border
                  border-zinc-800
                  rounded-xl
                  text-white
                  focus:outline-none
                  focus:border-purple-500
                  mb-4
                "
              />

              {/* RESULTS */}
              <div className="space-y-3">

                {filteredCreators &&
                  filteredCreators
                    .filter(
                      (creator) =>
                        creator.id !== selectedCreator
                    )
                    .map((creator) => {

                      const active =
                        collaborators.includes(
                          creator.id
                        );

                      return (

                        <button
                          key={creator.id}
                          type="button"
                          onClick={() => {

                            if (active) {

                              setCollaborators(
                                collaborators.filter(
                                  (id) =>
                                    id !== creator.id
                                )
                              );

                            } else {

                              setCollaborators([
                                ...collaborators,
                                creator.id,
                              ]);

                            }

                          }}
                          className={`
                            w-full
                            flex
                            items-center
                            justify-between
                            p-4
                            rounded-xl
                            border
                            transition

                            ${
                              active
                                ? `
                                  border-purple-500
                                  bg-purple-500/10
                                `
                                : `
                                  border-zinc-800
                                  bg-black
                                `
                            }
                          `}
                        >

                          <span>
                            {creator.name}
                          </span>

                          <span
                            className="
                              text-xs
                              text-gray-500
                            "
                          >
                            {active
                              ? "Added"
                              : "Add"}
                          </span>

                        </button>

                      );

                    })}

              </div>

              {/* SELECTED */}
              {collaborators.length > 0 && (

                <div className="mt-6">

                  <p
                    className="
                      text-sm
                      text-gray-400
                      mb-3
                    "
                  >
                    Selected collaborators
                  </p>

                  <div
                    className="
                      flex
                      flex-wrap
                      gap-3
                    "
                  >

                    {collaborators.map(
                      (id) => {

                        const creator =
                          allCreators.find(
                            (c) =>
                              c.id === id
                          );

                        if (!creator)
                          return null;

                        return (

                          <button
                            key={id}
                            type="button"
                            onClick={() =>
                              setCollaborators(
                                collaborators.filter(
                                  (c) =>
                                    c !== id
                                )
                              )
                            }
                            className="
                              px-4
                              py-2
                              rounded-full
                              bg-purple-500/10
                              border
                              border-purple-500
                              text-sm
                            "
                          >
                            {creator.name} ×
                          </button>

                        );

                      }
                    )}

                  </div>

                </div>

              )}

              <p
                className="
                  text-xs
                  text-gray-500
                  mt-4
                "
              >
                Collaborators are linked
                structurally and can later
                claim ownership of their
                creator profiles.
              </p>

            </div>

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

            {/* SUBMIT */}
            <div className="pt-2">

              <button
                type="submit"
                disabled={
                  loading
                }
                className="
                  w-full
                  bg-gradient-to-r
                  from-purple-600
                  to-purple-500
                  text-white
                  font-semibold
                  px-6
                  py-4
                  rounded-xl
                  hover:opacity-90
                  transition
                "
              >

                {loading
                  ? "Uploading..."
                  : "Publish Mod"}

              </button>

            </div>

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