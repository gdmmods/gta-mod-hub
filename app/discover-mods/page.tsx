"use client";

import {
  useEffect,
  useState,
  useRef,
} from "react";

import { supabase } from "@/lib/supabase/client";

import Navbar from "@/components/layout/Navbar";

import DiscoverPlatforms from "@/components/discover/DiscoverPlatforms";
import DiscoveryResults, { type BulkActionStatus, type BulkUpdateCandidate } from "@/components/discover/DiscoveryResults";
import type { Comparison } from "@/components/discover/DiscoveryUpdateComparison";
import type { DiscoveryResultProject } from "@/components/discover/types";
import { mergeDiscoveryPreview } from "@/components/discover/mergeDiscoveryPreview";

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

  const [comparisons, setComparisons] =
    useState<Record<string, Comparison>>({});

  const [bulkStatus, setBulkStatus] = useState<BulkActionStatus | null>(null);
  const [bulkCandidates, setBulkCandidates] = useState<BulkUpdateCandidate[]>([]);
  const [selectedBulkFields, setSelectedBulkFields] = useState<string[]>([]);
  const bulkRunning = useRef(false);

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

  if (action === "compare") {
    setProjectActions((current) => ({ ...current, [key]: "comparing" }));
    setMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Your session has expired. Please sign in again.");
      const response = await fetch("/api/update-mod/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ modId: project.existingMod?.id, project }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not compare this mod.");
      setComparisons((current) => ({ ...current, [key]: result }));
      setProjectActions((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    } catch (error) {
      setProjectActions((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setMessage(error instanceof Error ? error.message : "Could not compare this mod.");
    }
    return;
  }

  if (action === "apply-update") {
    setProjectActions((current) => ({ ...current, [key]: "applying" }));
    setMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Your session has expired. Please sign in again.");
      const response = await fetch("/api/update-mod", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          modId: project.existingMod?.id,
          project,
          acceptedFields: project.acceptedFields,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update this mod.");
      setProjectActions((current) => ({ ...current, [key]: "update" }));
      setMessage(result.updatedFields?.length
        ? `Updated ${result.updatedFields.length} selected field${result.updatedFields.length === 1 ? "" : "s"}.`
        : "The selected fields already match the saved values.");
      setComparisons((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    } catch (error) {
      setProjectActions((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setMessage(error instanceof Error ? error.message : "Could not update this mod.");
    }
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

  const getProjectKey = (project: DiscoveryResultProject) => `${project.platform}-${project.externalId}`;

  async function getBulkToken() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Your session has expired. Please sign in again.");
    return session.access_token;
  }

  async function loadBulkSource(project: DiscoveryResultProject): Promise<DiscoveryResultProject> {
    const response = await fetch("/api/discover-platform/preview", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectUrl: project.projectUrl }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load source metadata.");
    return mergeDiscoveryPreview(project, result.metadata);
  }

  async function handleBulkAdd() {
    if (bulkRunning.current || !currentCreatorId) return;
    bulkRunning.current = true;
    const eligible = projects.filter((project) => project.matchStatus !== "existing" &&
      !["ignore", "add", "adding", "comparing", "applying"].includes(projectActions[getProjectKey(project)]));
    const failures: string[] = [];
    const skipped = projects.length - eligible.length;
    let success = 0;
    let failed = 0;
    setBulkCandidates([]);
    setBulkStatus({ action: "add", phase: "working", current: 0, total: eligible.length, success, skipped, failed, failures });
    try {
      const token = await getBulkToken();
      for (let index = 0; index < eligible.length; index += 1) {
        const project = eligible[index];
        const key = getProjectKey(project);
        setProjectActions((current) => ({ ...current, [key]: "adding" }));
        setBulkStatus((current) => current ? { ...current, current: index + 1 } : current);
        try {
          const sourceProject = await loadBulkSource(project);
          const response = await fetch("/api/import-mod", { method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ creatorId: currentCreatorId, project: sourceProject }) });
          const result = await response.json();
          if (!response.ok) {
            if (result.partial && result.mod) {
              setProjects((current) => current.map((item) => getProjectKey(item) === key
                ? { ...item, matchStatus: "existing", existingMod: result.mod } : item));
            }
            throw new Error(result.error || `Import failed (${response.status}).`);
          }
          success += 1;
          setProjectActions((current) => ({ ...current, [key]: "add" }));
          setProjects((current) => current.map((item) => getProjectKey(item) === key
            ? { ...item, matchStatus: "existing", existingMod: result.mod } : item));
        } catch (error) {
          failed += 1;
          failures.push(`${project.title}: ${error instanceof Error ? error.message : "Import failed."}`);
          setProjectActions((current) => { const next = { ...current }; delete next[key]; return next; });
        }
        setBulkStatus((current) => current ? { ...current, success, failed, failures: [...failures] } : current);
      }
    } catch (error) {
      failed += eligible.length || 1;
      failures.push(error instanceof Error ? error.message : "Bulk import could not start.");
    } finally {
      setBulkStatus((current) => current ? { ...current, phase: "done", success, failed, failures: [...failures] } : current);
      bulkRunning.current = false;
    }
  }

  async function handleBulkUpdate() {
    if (bulkRunning.current) return;
    bulkRunning.current = true;
    const eligible = projects.filter((project) => project.matchStatus === "existing" &&
      !["ignore", "update", "comparing", "applying"].includes(projectActions[getProjectKey(project)]));
    const failures: string[] = [];
    const skipped = projects.filter((project) => project.matchStatus === "existing").length - eligible.length;
    const candidates: BulkUpdateCandidate[] = [];
    let failed = 0;
    setBulkCandidates([]);
    setSelectedBulkFields([]);
    setBulkStatus({ action: "update", stage: "compare", phase: "working", current: 0, total: eligible.length, success: 0, skipped, failed, failures });
    try {
      const token = await getBulkToken();
      for (let index = 0; index < eligible.length; index += 1) {
        const project = eligible[index];
        const key = getProjectKey(project);
        setProjectActions((current) => ({ ...current, [key]: "comparing" }));
        setBulkStatus((current) => current ? { ...current, current: index + 1 } : current);
        try {
          const sourceProject = await loadBulkSource(project);
          const response = await fetch("/api/update-mod/compare", { method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ modId: project.existingMod?.id, project: sourceProject }) });
          const comparison = await response.json();
          if (!response.ok) throw new Error(comparison.error || "Could not compare this mod.");
          candidates.push({ project: sourceProject, comparison });
          setComparisons((current) => ({ ...current, [key]: comparison }));
          setProjectActions((current) => { const next = { ...current }; delete next[key]; return next; });
        } catch (error) {
          failed += 1;
          failures.push(`${project.title}: ${error instanceof Error ? error.message : "Comparison failed."}`);
          setProjectActions((current) => { const next = { ...current }; delete next[key]; return next; });
        }
        setBulkStatus((current) => current ? { ...current, failed, failures: [...failures] } : current);
      }
      setBulkCandidates(candidates);
      const hasChanges = candidates.some(({ comparison }) =>
        Object.entries(comparison.proposed).some(([field, value]) =>
          comparison.current[field as keyof Comparison["current"]] !== value));
      if (candidates.length && !hasChanges) {
        setBulkCandidates([]);
        setBulkStatus((current) => current ? {
          ...current, phase: "done", skipped: current.skipped + candidates.length, failed, failures: [...failures],
        } : current);
      } else {
        setBulkStatus((current) => current ? { ...current, phase: candidates.length ? "review" : "done", failed, failures: [...failures] } : current);
      }
    } catch (error) {
      failed += eligible.length || 1;
      failures.push(error instanceof Error ? error.message : "Bulk comparison could not start.");
      setBulkStatus((current) => current ? { ...current, phase: "done", failed, failures: [...failures] } : current);
    } finally {
      bulkRunning.current = false;
    }
  }

  async function confirmBulkUpdate() {
    if (bulkRunning.current || selectedBulkFields.length === 0) return;
    bulkRunning.current = true;
    const failures = [...(bulkStatus?.failures ?? [])];
    let success = 0;
    let failed = bulkStatus?.failed ?? 0;
    let skipped = bulkStatus?.skipped ?? 0;
    const work = bulkCandidates.map(({ project, comparison }) => ({ project,
      acceptedFields: Object.fromEntries(selectedBulkFields.filter((field) => {
        const key = field as keyof Comparison["proposed"];
        return comparison.proposed[key] !== undefined && comparison.proposed[key] !== comparison.current[key];
      }).map((field) => [field, comparison.proposed[field as keyof Comparison["proposed"]]])) }));
    const eligible = work.filter(({ acceptedFields }) => Object.keys(acceptedFields).length > 0);
    skipped += work.length - eligible.length;
    setBulkStatus({ action: "update", stage: "apply", phase: "working", current: 0, total: eligible.length, success, skipped, failed, failures });
    try {
      const token = await getBulkToken();
      for (let index = 0; index < eligible.length; index += 1) {
        const { project, acceptedFields } = eligible[index];
        const key = getProjectKey(project);
        setProjectActions((current) => ({ ...current, [key]: "applying" }));
        setBulkStatus((current) => current ? { ...current, current: index + 1 } : current);
        try {
          const response = await fetch("/api/update-mod", { method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ modId: project.existingMod?.id, project, acceptedFields }) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Could not update this mod.");
          success += 1;
          setProjectActions((current) => ({ ...current, [key]: "update" }));
          setComparisons((current) => { const next = { ...current }; delete next[key]; return next; });
          setProjects((current) => current.map((item) => getProjectKey(item) === key
            ? { ...item, existingMod: { ...item.existingMod, ...result.mod } } : item));
        } catch (error) {
          failed += 1;
          failures.push(`${project.title}: ${error instanceof Error ? error.message : "Update failed."}`);
          setProjectActions((current) => { const next = { ...current }; delete next[key]; return next; });
        }
        setBulkStatus((current) => current ? { ...current, success, failed, skipped, failures: [...failures] } : current);
      }
    } catch (error) {
      failed += eligible.length || 1;
      failures.push(error instanceof Error ? error.message : "Bulk update could not start.");
    } finally {
      setBulkCandidates([]);
      setSelectedBulkFields([]);
      setBulkStatus((current) => current ? { ...current, phase: "done", success, failed, skipped, failures: [...failures] } : current);
      bulkRunning.current = false;
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
          origin
        `)
        .eq(
          "creator_id",
          currentCreatorId
        );

      if (existingModsError) {
  console.error(
    "EXISTING MODS LOAD ERROR:",
    JSON.stringify(
      existingModsError,
      Object.getOwnPropertyNames(existingModsError),
      2
    ),
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
            onProjectAction={handleProjectAction}
            comparisons={comparisons}
            onBulkAdd={handleBulkAdd}
            canAdd={Boolean(currentCreatorId)}
            onBulkUpdate={handleBulkUpdate}
            bulkStatus={bulkStatus}
            bulkCandidates={bulkCandidates}
            selectedBulkFields={selectedBulkFields}
            onToggleBulkField={(field) => setSelectedBulkFields((current) => current.includes(field)
              ? current.filter((item) => item !== field) : [...current, field])}
            onConfirmBulkUpdate={confirmBulkUpdate}
            onCancelBulkUpdate={() => {
              setBulkCandidates([]);
              setBulkStatus((current) => current ? {
                ...current, phase: "done", skipped: current.skipped + bulkCandidates.length,
              } : current);
            }}
          />

        </div>

      </main>
    </>
  );
}
