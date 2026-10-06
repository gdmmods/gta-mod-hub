"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase/client";

import Navbar from "@/components/layout/Navbar";

import DiscoverPlatforms from "@/components/discover/DiscoverPlatforms";
import DiscoveryResults from "@/components/discover/DiscoveryResults";

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

  const [selectedIdentityIds, setSelectedIdentityIds] =
    useState<string[]>([]);

  const [projectActions, setProjectActions] =
    useState<Record<string, string>>({});

  const hasVerifiedIdentity =
    identities.some(
      (identity) =>
        identity.verification_status ===
        "verified"
    );

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

      const loadedIdentities =
        (data || []).map(
          (identity: any) => ({
            ...identity,
            platform:
              Array.isArray(
                identity.platform
              )
                ? identity.platform[0] || null
                : identity.platform,
          })
        ) as Identity[];

      setIdentities(
        loadedIdentities
      );

      setSelectedIdentityIds(
        loadedIdentities
          .filter(
            (identity) =>
              identity.verification_status ===
              "verified"
          )
          .map(
            (identity) =>
              identity.id
          )
      );

      setLoading(false);
    }

    loadConnectedPlatforms();

  }, []);

  function handleToggleIdentity(
    identityId: string
  ) {

    setSelectedIdentityIds(
      (current) =>
        current.includes(identityId)
          ? current.filter(
              (id) =>
                id !== identityId
            )
          : [
              ...current,
              identityId,
            ]
    );

  }

  async function handleProjectAction(
  project: any,
  action: string
) {

  const key =
    `${project.platform}-${project.externalId}`;

  /*
    Ignore is still a local discovery action.
  */

  if (action === "ignore") {

  setProjectActions(
    current => ({
      ...current,
      [`${project.platform}-${project.externalId}`]:
        "ignore",
    })
  );

  return;
}

  /*
    Update will be wired separately.
  */

  if (action === "update") {

  if (!project.existingMod?.id) {
    console.error(
      "UPDATE ERROR: Missing existing mod ID."
    );

    return;
  }

  const {
    data: {
      session,
    },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    setMessage(
      "Your session has expired. Please sign in again."
    );

    return;
  }

  const response =
    await fetch(
      "/api/update-mod",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${session.access_token}`,
        },

        body: JSON.stringify({
          modId:
            project.existingMod.id,

          project,
        }),
      }
    );

  const result =
    await response.json();

  if (!response.ok) {

    console.error(
      "UPDATE ERROR:",
      {
        result,
        status:
          response.status,
        statusText:
          response.statusText,
      }
    );

    return;
  }

  setProjectActions(
    current => ({
      ...current,
      [`${project.platform}-${project.externalId}`]:
        "update",
    })
  );

  return;
}

  /*
    Add = explicit creator-authorized import.
  */

  if (
    action === "add" &&
    !currentCreatorId
  ) {
    return;
  }

  try {

    const {
      data: {
        session,
      },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setMessage(
        "Your session has expired. Please sign in again."
      );

      return;
    }

    const response =
      await fetch(
        "/api/import-mod",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            creatorId:
              currentCreatorId,

            project,
          }),
        }
      );

    const responseText =
  await response.text();

let result: any = {};

try {
  result =
    JSON.parse(responseText);
} catch {
  result = {
    raw: responseText,
  };
}

if (!response.ok) {

  console.error(
    "IMPORT ERROR:",
    {
      status: response.status,
      statusText: response.statusText,
      result,
    }
  );

  setMessage(
    result.error ||
      `Import failed (${response.status}).`
  );

  return;
}

    /*
      Only mark the project as added
      after the API confirms success.
    */

    setProjectActions(
      (current) => ({
        ...current,
        [key]: "add",
      })
    );

    /*
      Update the local project so it
      immediately behaves like an
      imported ModVault record.
    */

    setProjects(
      (current) =>
        current.map(
          (item) => {

            const itemKey =
              `${item.platform}-${item.externalId}`;

            if (
              itemKey !== key
            ) {
              return item;
            }

            return {
              ...item,

              matchStatus:
                "existing",

              existingMod:
                result.mod || null,
            };
          }
        )
    );

  } catch (error) {

    console.error(
      "IMPORT REQUEST ERROR:",
      error
    );

    setMessage(
      "Could not import this project."
    );
  }
}

  async function handleDiscovery() {

    if (identities.length === 0) {
      return;
    }

    setDiscovering(true);
    setMessage(null);
    setDiscoveryError(null);
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

        if (
          identity.verification_status !==
          "verified"
        ) {
          continue;
        }

        if (
          !selectedIdentityIds.includes(
            identity.id
          )
        ) {
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
                  mod.source_url?.split("#")[0] ===
                  project.projectUrl?.split("#")[0]
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

          <DiscoverPlatforms
            identities={identities}
            loading={loading}
            selectedIdentityIds={
              selectedIdentityIds
            }
            discovering={discovering}
            hasVerifiedIdentity={
              hasVerifiedIdentity
            }
            message={message}
            onToggleIdentity={
              handleToggleIdentity
            }
            onDiscover={
              handleDiscovery
            }
          />

          <DiscoveryResults
            projects={projects}
            projectActions={projectActions}
            creatorId={currentCreatorId}
            onProjectAction={handleProjectAction}
          />

        </div>

      </main>
    </>
  );
}