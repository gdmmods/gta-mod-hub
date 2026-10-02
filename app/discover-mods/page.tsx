"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase/client";

import Navbar from "@/components/layout/Navbar";

type Identity = {
  id: string;
  username: string;
  profile_url: string | null;
  verification_status: string;
  connected_at: string;
  platform: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export default function DiscoverModsPage() {

  const [identities, setIdentities] =
    useState<Identity[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [discovering, setDiscovering] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [projects, setProjects] =
  useState<any[]>([]);

  const [existingMods, setExistingMods] =
  useState<any[]>([]);

  const [discoveryError, setDiscoveryError] =
  useState<string | null>(null);

  const [currentCreatorId, setCurrentCreatorId] =
  useState<string | null>(null);

  useEffect(() => {

    async function loadConnectedPlatforms() {

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select(
            "default_creator_id"
          )
          .eq(
            "id",
            session.user.id
          )
          .single();

      if (profileError) {

        console.error(
          "PROFILE LOAD ERROR:",
          profileError
        );

        setLoading(false);
        return;
      }

      if (!profile?.default_creator_id) {

        setIdentities([]);
        setLoading(false);
        return;
      }

      setCurrentCreatorId(
        profile.default_creator_id
      );

      const {
        data,
        error,
      } =
        await supabase
          .from("external_identities")
          .select(`
            id,
            username,
            profile_url,
            verification_status,
            connected_at,
            platform:platforms (
              id,
              name,
              slug
            )
          `)
          .eq(
            "creator_id",
            profile.default_creator_id
          )
          .order(
            "connected_at",
            {
              ascending: false,
            }
          );

      if (error) {

        console.error(
          "IDENTITIES LOAD ERROR:",
          error
        );

        setLoading(false);
        return;
      }

      setIdentities(
        (data || []) as any[]
        );

      setLoading(false);
    }

    loadConnectedPlatforms();

  }, []);

  async function handleDiscovery() {

    if (identities.length === 0) {
      return;
    }

    setDiscovering(true);
    setMessage(null);

    setDiscoveryError(null);
    setMessage(null);
    setProjects([]);

        let existingMods: any[] = [];

    if (currentCreatorId) {

      const {
        data: existingModsData,
        error: existingModsError,
      } = await supabase
        .from("mods")
        .select(`
          id,
          title,
          source_url,
          status,
          origin,
          is_paid,
          access_type,
          price_label,
          external_purchase_url
        `)
        .eq(
          "creator_id",
          currentCreatorId
        );

      if (existingModsError) {

        console.error(
          "EXISTING MODS LOAD ERROR:",
          existingModsError
        );

      } else {

        existingMods =
          existingModsData || [];

      }

    }


  try {

  const allProjects: any[] = [];

  for (
    const identity of identities
  ) {

    const connector =
      identity.platform?.slug;

    if (!connector) {
      continue;
    }

    /*
      Only discover from the profile URL
      the creator explicitly connected.
    */

    if (!identity.profile_url) {
      continue;
    }

    const response =
      await fetch(
        "/api/discover-platform",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            connector,
            profileUrl:
              identity.profile_url,
          }),
        }
      );

    const result =
      await response.json();

    if (!response.ok) {

      console.error(
        "DISCOVERY ERROR:",
        result
      );

      continue;
    }

    allProjects.push(
      ...(result.projects || [])
    );

  }

  const enrichedProjects =
  allProjects.map(
    (project: any) => {

      const existingMod =
        existingMods.find(
          (mod: any) =>
            mod.source_url ===
            project.projectUrl
        );

      return {

        ...project,

        matchStatus:
          existingMod
            ? "existing"
            : "new",

        existingMod:
          existingMod || null,

      };
      
    }
  );

  setProjects(
  enrichedProjects
);

  setMessage(
    `Discovery complete. Found ${allProjects.length} project${allProjects.length === 1 ? "" : "s"}.`
  );

} catch (error) {

  console.error(
    "DISCOVERY ERROR:",
    error
  );

  setDiscoveryError(
    "We couldn't complete platform discovery."
  );

} finally {

  setDiscovering(false);

}
  }

  return (
    <>
      <Navbar />

      <main
        className="
          min-h-screen
          bg-black
          text-white
        "
      >

        <div
          className="
            max-w-5xl
            mx-auto
            px-6
            py-24
          "
        >

          <p
            className="
              text-purple-400
              uppercase
              tracking-[0.3em]
              text-sm
              mb-4
            "
          >
            Creator Onboarding
          </p>

          <h1
            className="
              text-5xl
              font-bold
              mb-6
            "
          >
            Discover Your Mods
          </h1>

          <p
            className="
              text-zinc-400
              max-w-2xl
              mb-10
            "
          >
            Find the creative work connected to
            your external platforms. ModVault will
            compare discovered projects with your
            existing work before anything is added
            or updated.
          </p>

          {/* CONNECTED PLATFORMS */}

          <section
            className="
              rounded-[32px]
              border
              border-zinc-800
              bg-zinc-950
              p-8
              mb-8
            "
          >

            <div className="mb-8">

              <p
                className="
                  text-purple-400
                  uppercase
                  tracking-[0.2em]
                  text-xs
                  mb-3
                "
              >
                Connected Sources
              </p>

              <h2
                className="
                  text-2xl
                  font-bold
                  mb-2
                "
              >
                Your Platforms
              </h2>

              <p
                className="
                  text-zinc-500
                  text-sm
                "
              >
                These are the external identities
                ModVault can use for discovery.
              </p>

            </div>

            {loading ? (

              <p className="text-zinc-500">
                Loading connected platforms...
              </p>

            ) : identities.length === 0 ? (

              <div
                className="
                  rounded-2xl
                  border
                  border-zinc-800
                  bg-black
                  p-6
                "
              >

                <p
                  className="
                    text-zinc-400
                    mb-4
                  "
                >
                  You haven't connected any
                  external platforms yet.
                </p>

                <a
                  href="/connect-platforms"
                  className="
                    inline-flex
                    px-5
                    py-3
                    rounded-xl
                    bg-purple-600
                    hover:bg-purple-500
                    transition
                    font-medium
                  "
                >
                  Connect a Platform
                </a>

              </div>

            ) : (

              <div
                className="
                  space-y-3
                "
              >

                {identities.map(
                  (identity) => (

                    <div
                      key={identity.id}
                      className="
                        flex
                        items-center
                        justify-between
                        gap-6
                        rounded-2xl
                        border
                        border-zinc-800
                        bg-zinc-900
                        p-5
                      "
                    >

                      <div>

                        <h3
                          className="
                            font-semibold
                            text-lg
                          "
                        >
                          {identity.platform?.name ||
                            "Unknown Platform"}
                        </h3>

                        <p
                          className="
                            text-sm
                            text-zinc-500
                            mt-1
                          "
                        >
                          {identity.username}
                        </p>

                      </div>

                      <span
                        className="
                          text-xs
                          uppercase
                          tracking-wider
                          text-zinc-500
                        "
                      >
                        {identity.verification_status ||
                          "pending"}
                      </span>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

          {/* DISCOVERY ACTION */}

          {identities.length > 0 && (

            <section
              className="
                rounded-[32px]
                border
                border-zinc-800
                bg-zinc-950
                p-8
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-6
                "
              >

                <div>

                  <h2
                    className="
                      text-xl
                      font-bold
                      mb-2
                    "
                  >
                    Find Your Existing Work
                  </h2>

                  <p
                    className="
                      text-zinc-500
                      text-sm
                      max-w-xl
                    "
                  >
                    ModVault will discover projects
                    from your connected platforms.
                    Nothing will be imported automatically.
                  </p>

                </div>

                <button
                  onClick={
                    handleDiscovery
                  }
                  disabled={discovering}
                  className="
                    shrink-0
                    px-5
                    py-3
                    rounded-xl
                    bg-purple-600
                    hover:bg-purple-500
                    disabled:opacity-40
                    disabled:cursor-not-allowed
                    transition
                    font-medium
                  "
                >
                  {discovering
                    ? "Discovering..."
                    : "Discover Mods"}
                </button>

              </div>

              {message && (

                <div
                  className="
                    mt-6
                    rounded-2xl
                    border
                    border-zinc-800
                    bg-black
                    p-5
                    text-sm
                    text-zinc-400
                  "
                >
                  {message}
                </div>

              )}

            </section>

          )}

          {projects.length > 0 && (

  <section
    className="
      mt-8
      rounded-[32px]
      border
      border-zinc-800
      bg-zinc-950
      p-8
    "
  >

    <p
      className="
        text-purple-400
        uppercase
        tracking-[0.2em]
        text-xs
        mb-3
      "
    >
      Discovery Results
    </p>

    <h2
      className="
        text-2xl
        font-bold
        mb-2
      "
    >
      Projects Found
    </h2>

    <p
      className="
        text-zinc-500
        text-sm
        mb-6
      "
    >
      Nothing has been imported. Review these
      projects before choosing what to add.
    </p>

    <div className="space-y-3">

      {projects.map(
        (project, index) => (

          <div
            key={`${project.platform}-${project.externalId}-${index}`}
            className="
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-900
              p-5
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-6
              "
            >

              <div>

                <h3
                  className="
                    text-lg
                    font-semibold
                  "
                >
                  {project.title}
                </h3>

                <p
                  className="
                    text-sm
                    text-zinc-500
                    mt-1
                  "
                >
                  {project.platform}
                </p>

                {project.matchStatus === "existing" ? (
                  <p className="text-sm text-zinc-400 mt-2">
                    Already in ModVault
                  </p>
                ) : (
                  <p className="text-sm text-emerald-400 mt-2">
                    New project
                  </p>
                )}

              </div>

              <a
                href={
                  project.projectUrl
                }
                target="_blank"
                rel="noreferrer"
                className="
                  text-purple-400
                  hover:text-purple-300
                  text-sm
                  shrink-0
                "
              >
                View Project →
              </a>

            </div>

          </div>

        )
      )}

    </div>

  </section>

)}

        </div>

      </main>
    </>
  );
}