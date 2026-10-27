"use client";

import {
  useEffect,
  useState,
  useRef,
} from "react";

import { supabase } from "@/lib/supabase/client";
import { useCreatorContext } from "@/app/contexts/CreatorContext";

import Navbar from "@/components/layout/Navbar";

import DiscoverPlatforms from "@/components/discover/DiscoverPlatforms";
import DiscoveryResults, { type BulkActionStatus, type BulkUpdateCandidate } from "@/components/discover/DiscoveryResults";
import type { Comparison } from "@/components/discover/DiscoveryUpdateComparison";
import type { DiscoveryResultProject } from "@/components/discover/types";
import { mergeDiscoveryPreview } from "@/components/discover/mergeDiscoveryPreview";
import { isGtaInsideSourceRecord, normalizeGtaInsideProjectUrl } from "@/lib/connectors/gtainside";
import { getSourceMatchTitleSearchPatterns, isDiscoveryMatchCandidateVisible, resolveGtaInsideSourceMatch } from "@/lib/connectors/modSourceMatch";
import { normalizeGta5ModsProjectUrl } from "@/lib/connectors/sourceProjectUrl";

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

type MatchCandidate = {
  id: string;
  title: string | null;
  creator: string | null;
  creator_id: string | null;
  source_url: string | null;
  status: string | null;
  visibility: string | null;
  origin: string | null;
  category?: string | null;
  description?: string | null;
  image?: string | null;
  otherSources?: Array<{ url: string; platform: string }>;
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

  const [discoveryError, setDiscoveryError] =
    useState<string | null>(null);

  const { activeCreatorId: currentCreatorId, loading: creatorContextLoading } = useCreatorContext();

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
    let cancelled = false;
    async function loadConnectedPlatforms() {
      setLoading(true);
      setIdentities([]);
      if (creatorContextLoading) return;
      if (!currentCreatorId) { setLoading(false); return; }
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { setLoading(false); return; }
      const { data: membership, error: membershipError } = await supabase.from("creator_members")
        .select("creator_id").eq("profile_id", user.id).eq("creator_id", currentCreatorId).eq("status", "approved").maybeSingle();
      if (cancelled) return;
      if (membershipError || !membership) { setLoading(false); return; }
      const { data, error } = await supabase.from("external_identities").select(`id,username,profile_url,verification_status,connected_at,platform:platforms(id,name,slug)`)
        .eq("creator_id", currentCreatorId).order("connected_at", { ascending: false });
      if (cancelled) return;
      if (error) console.error("IDENTITIES LOAD ERROR:", error);
      const loaded = (data || []).map((identity: any) => ({ ...identity, platform: Array.isArray(identity.platform) ? identity.platform[0] || null : identity.platform })) as Identity[];
      setIdentities(loaded);
      setSelectedIdentityIds(loaded.filter((identity) => identity.verification_status === "verified").map((identity) => identity.id));
      setLoading(false);
    }
    void loadConnectedPlatforms();
    return () => { cancelled = true; };
  }, [currentCreatorId, creatorContextLoading]);
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

  function applyImportConflict(project: DiscoveryResultProject, result: Record<string, unknown>) {
    const key = getProjectKey(project);
    const reviewRequired = result.code === "SOURCE_MATCH_REVIEW_REQUIRED" || result.reviewRequired === true;
    const matchSource = reviewRequired
      ? "review"
      : result.matchSource === "additional" ? "additional" : "primary";
    const existingCandidates = new Map((project.matchCandidates ?? []).map((candidate) => [candidate.id, candidate]));
    const matchCandidates = Array.isArray(result.matchCandidates)
      ? (result.matchCandidates as Array<{ id: string; title: string | null; creator?: string | null; creator_id?: string | null; status?: string | null; visibility?: string | null; primarySourceUrl?: string | null }>)
        .map((candidate) => ({ ...existingCandidates.get(candidate.id), ...candidate }))
      : project.matchCandidates;
    setProjects((current) => current.map((item) => getProjectKey(item) === key
      ? {
          ...item,
          matchStatus: reviewRequired ? "new" : "existing",
          matchSource,
          sourceLinkStatus: matchSource === "additional" ? "review" : undefined,
          existingMod: result.mod && typeof result.mod === "object"
            ? result.mod as DiscoveryResultProject["existingMod"]
            : null,
          matchCandidates,
        }
      : item));
    setProjectActions((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleProjectAction(
  project: any,
  action: string
) {

  const key =
    `${project.platform}-${project.externalId}`;

  if (action === "dismiss-review") {
    setProjects((current) => current.map((item) => getProjectKey(item) === key
      ? { ...item, matchSource: undefined, allowSeparateAfterReview: true }
      : item));
    setMessage(null);
    return;
  }

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

  if (action === "attach-source" || action === "review-attach") {
    const reviewSelectedModId = typeof project.reviewSelectedModId === "string" ? project.reviewSelectedModId : null;
    const selectedCandidate = project.matchCandidates?.find((candidate: NonNullable<DiscoveryResultProject["matchCandidates"]>[number]) => candidate.id === reviewSelectedModId);
    const modId = action === "review-attach" ? reviewSelectedModId : project.existingMod?.id;
    if (!modId) {
      setMessage("Select a ModVault match before attaching this source.");
      return;
    }
    setProjectActions((current) => ({ ...current, [key]: "attaching" }));
    setMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Your session has expired. Please sign in again.");
      const response = await fetch("/api/mod-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ links: [{
          modId,
          platform: project.platform,
          projectUrl: project.projectUrl,
          externalId: project.externalId,
        }] }),
      });
      const result = await response.json();
      const status = result.results?.[0]?.status;
      if (!response.ok || !["linked", "already_linked"].includes(status)) {
        if (["linked_elsewhere", "forbidden"].includes(status)) {
          setProjects((current) => current.map((item) => getProjectKey(item) === key
            ? { ...item, sourceLinkStatus: status }
            : item));
        }
        throw new Error(status === "linked_elsewhere"
          ? "This source is already attached to another ModVault mod. Review required."
          : result.error || "Could not attach this source.");
      }
      setProjects((current) => current.map((item) => getProjectKey(item) === key
        ? {
            ...item,
            matchStatus: "existing",
            matchSource: "additional",
            sourceLinkStatus: status,
            existingMod: selectedCandidate ? {
              id: selectedCandidate.id,
              title: selectedCandidate.title,
              creator_id: selectedCandidate.creator_id,
              status: selectedCandidate.status,
            } : item.existingMod,
          }
        : item));
      setProjectActions((current) => { const next = { ...current }; delete next[key]; return next; });
    } catch (error) {
      setProjectActions((current) => { const next = { ...current }; delete next[key]; return next; });
      setMessage(error instanceof Error ? error.message : "Could not attach this source.");
    }
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

  if (result.code === "CROSS_SOURCE_DUPLICATE" || result.code === "SAME_SOURCE_DUPLICATE" || result.code === "SOURCE_MATCH_REVIEW_REQUIRED") {
    applyImportConflict(project, result);
  }

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
    const eligible = projects.filter((project) => project.matchStatus !== "existing" && project.matchSource !== "review" && project.allowSeparateAfterReview !== true &&
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
            if (result.code === "CROSS_SOURCE_DUPLICATE" || result.code === "SAME_SOURCE_DUPLICATE" || result.code === "SOURCE_MATCH_REVIEW_REQUIRED") {
              applyImportConflict(project, result);
            }
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
    const eligible = projects.filter((project) => project.matchStatus === "existing" && project.matchSource !== "additional" &&
      !["ignore", "update", "comparing", "applying"].includes(projectActions[getProjectKey(project)]));
    const failures: string[] = [];
    const skipped = projects.filter((project) => project.matchStatus === "existing" && project.matchSource !== "additional").length - eligible.length;
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

    try {

      const allProjects: DiscoveryResultProject[] = [];

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

      const projectsByIdentity = new Map<string, DiscoveryResultProject>();
      for (const project of allProjects) {
        projectsByIdentity.set(`${project.platform}-${project.externalId}`, project);
      }
      const deduplicatedProjects = [...projectsByIdentity.values()];
      const normalizedUrl = (project: DiscoveryResultProject) => project.platform === "gtainside"
        ? normalizeGtaInsideProjectUrl(project.projectUrl)
        : project.platform === "gta5mods"
          ? normalizeGta5ModsProjectUrl(project.projectUrl)
          : null;
      const projectUrls = [...new Set(deduplicatedProjects.map(normalizedUrl).filter((url): url is string => !!url))];
      const titlePatterns = [...new Set(deduplicatedProjects
        .filter((project) => project.platform === "gtainside")
        .flatMap((project) => getSourceMatchTitleSearchPatterns(project.title, project.projectUrl)))];
      const patternGroups = Array.from({ length: Math.ceil(titlePatterns.length / 20) }, (_, index) =>
        titlePatterns.slice(index * 20, index * 20 + 20));
      const loadCandidates = async (query: (from: number) => PromiseLike<{ data: MatchCandidate[] | null; error: unknown }>) => {
        const rows: MatchCandidate[] = [];
        for (let from = 0; ; from += 500) {
          const result = await query(from);
          if (result.error) return { data: rows, error: result.error };
          rows.push(...(result.data ?? []));
          if ((result.data ?? []).length < 500) return { data: rows, error: null };
        }
      };
      const candidateQueries = await Promise.all(patternGroups.flatMap((patterns) => {
        const patternFilter = patterns.map((pattern) => `title.ilike.${pattern}`).join(",");
        return [
          loadCandidates((from) => supabase.from("mods")
            .select("id, title, creator, creator_id, source_url, status, visibility, origin")
            .or(patternFilter).eq("status", "published").in("visibility", ["public", "early_access"])
            .range(from, from + 499)),
          loadCandidates((from) => supabase.from("mods")
            .select("id, title, creator, creator_id, source_url, status, visibility, origin")
            .or(patternFilter).eq("status", "draft").eq("creator_id", currentCreatorId ?? "")
            .range(from, from + 499)),
        ];
      }));
      const candidateQueryFailed = candidateQueries.some((result) => !!result.error);
      const candidateRows = candidateQueries.flatMap((result) => result.data);
      if (candidateQueryFailed) console.error("SOURCE MATCH CANDIDATE LOAD ERROR:", candidateQueries.find((result) => result.error)?.error);

      const primaryQuery = projectUrls.length
        ? await supabase.from("mods")
          .select("id, title, creator, creator_id, source_url, status, visibility, origin")
          .in("source_url", projectUrls).eq("status", "published").in("visibility", ["public", "early_access"])
        : { data: [], error: null };
      if (primaryQuery.error) console.error("PRIMARY SOURCE MATCH LOAD ERROR:", primaryQuery.error);
      const ownedPrimaryQuery = projectUrls.length
        ? await supabase.from("mods")
          .select("id, title, creator, creator_id, source_url, status, visibility, origin")
          .in("source_url", projectUrls).eq("status", "draft").eq("creator_id", currentCreatorId ?? "")
        : { data: [], error: null };
      if (ownedPrimaryQuery.error) console.error("OWNED PRIMARY SOURCE MATCH LOAD ERROR:", ownedPrimaryQuery.error);

      const sourceQuery = projectUrls.length
        ? await supabase.from("mod_sources").select("mod_id, canonical_url").in("canonical_url", projectUrls)
        : { data: [], error: null };
      if (sourceQuery.error) console.error("ADDITIONAL SOURCE MATCH LOAD ERROR:", sourceQuery.error);

      const linkedModIds = [...new Set((sourceQuery.data ?? []).map((source) => source.mod_id))];
      const linkedModsQuery = linkedModIds.length
        ? await supabase.from("mods")
          .select("id, title, creator, creator_id, source_url, status, visibility, origin")
          .in("id", linkedModIds).eq("status", "published").in("visibility", ["public", "early_access"])
        : { data: [], error: null };
      if (linkedModsQuery.error) console.error("LINKED SOURCE MOD LOAD ERROR:", linkedModsQuery.error);
      const ownedLinkedModsQuery = linkedModIds.length
        ? await supabase.from("mods")
          .select("id, title, creator, creator_id, source_url, status, visibility, origin")
          .in("id", linkedModIds).eq("status", "draft").eq("creator_id", currentCreatorId ?? "")
        : { data: [], error: null };
      if (ownedLinkedModsQuery.error) console.error("OWNED LINKED SOURCE MOD LOAD ERROR:", ownedLinkedModsQuery.error);
      const sourceMatchLookupFailed = candidateQueryFailed || !!primaryQuery.error || !!ownedPrimaryQuery.error || !!sourceQuery.error || !!linkedModsQuery.error || !!ownedLinkedModsQuery.error;

      const allCandidateRows = [
        ...candidateRows,
        ...(primaryQuery.data ?? []),
        ...(ownedPrimaryQuery.data ?? []),
        ...(linkedModsQuery.data ?? []),
        ...(ownedLinkedModsQuery.data ?? []),
      ];
      type SourceMatchMod = {
        id: string;
        title: string | null;
        creator: string | null;
        creator_id: string | null;
        source_url: string | null;
        status: string | null;
        visibility: string | null;
        origin: string | null;
      };
      const candidateMods: SourceMatchMod[] = [...new Map<string, SourceMatchMod>(allCandidateRows
        .filter((mod) => isDiscoveryMatchCandidateVisible(mod, currentCreatorId))
        .map((mod) => [mod.id, mod] as const)).values()];

      type SourceMatchResult = { match: SourceMatchMod | null; ambiguous: boolean; candidates: SourceMatchMod[] };
      const matchResultsByProject = new Map<string, SourceMatchResult>();
      const reviewCandidateIds = new Set<string>();
      for (const project of deduplicatedProjects) {
        if (project.platform !== "gtainside" || sourceMatchLookupFailed) continue;
        const projectUrl = normalizedUrl(project);
        const hasPrimary = candidateMods.some((mod) => isGtaInsideSourceRecord(mod.origin, project.externalId, projectUrl, mod.source_url));
        const linkedSource = (sourceQuery.data ?? []).find((source) => source.canonical_url === projectUrl);
        if (hasPrimary || linkedSource) continue;
        const result = resolveGtaInsideSourceMatch<SourceMatchMod>(project, candidateMods, deduplicatedProjects);
        matchResultsByProject.set(getProjectKey(project), result);
        if (result.ambiguous) result.candidates.forEach((candidate) => reviewCandidateIds.add(candidate.id));
      }
      const reviewIds = [...reviewCandidateIds];
      const [candidateDetailsQuery, candidateLinksQuery] = reviewIds.length
        ? await Promise.all([
            supabase.from("mods").select("id, category, description, image").in("id", reviewIds),
            supabase.from("mod_sources").select("mod_id, canonical_url, platform_id").in("mod_id", reviewIds),
          ])
        : [{ data: [], error: null }, { data: [], error: null }];
      if (candidateDetailsQuery.error) console.error("REVIEW MATCH DETAILS LOAD ERROR:", candidateDetailsQuery.error);
      if (candidateLinksQuery.error) console.error("REVIEW MATCH SOURCE LOAD ERROR:", candidateLinksQuery.error);
      const reviewPlatformIds = [...new Set((candidateLinksQuery.data ?? []).map((source) => source.platform_id))];
      const reviewPlatformsQuery = reviewPlatformIds.length
        ? await supabase.from("platforms").select("id, slug, name").in("id", reviewPlatformIds)
        : { data: [], error: null };
      if (reviewPlatformsQuery.error) console.error("REVIEW MATCH PLATFORM LOAD ERROR:", reviewPlatformsQuery.error);
      const reviewDetailsById = new Map((candidateDetailsQuery.data ?? []).map((mod) => [mod.id, mod]));
      const reviewPlatformsById = new Map((reviewPlatformsQuery.data ?? []).map((platform) => [platform.id, platform.name]));
      const reviewSourcesByModId = new Map<string, Array<{ url: string; platform: string }>>();
      for (const source of candidateLinksQuery.data ?? []) {
        const platform = reviewPlatformsById.get(source.platform_id);
        if (!platform || !source.canonical_url) continue;
        const rows = reviewSourcesByModId.get(source.mod_id) ?? [];
        rows.push({ url: source.canonical_url, platform });
        reviewSourcesByModId.set(source.mod_id, rows);
      }

      const enrichedProjects = deduplicatedProjects.map((project) => {
        const projectUrl = normalizedUrl(project);
        const existingPrimary = candidateMods.find((mod) => project.platform === "gtainside"
          ? isGtaInsideSourceRecord(mod.origin, project.externalId, projectUrl, mod.source_url)
          : project.platform === "gta5mods" && normalizeGta5ModsProjectUrl(mod.source_url) === projectUrl);
        const linkedSource = (sourceQuery.data ?? []).find((source) => source.canonical_url === projectUrl);
        const linkedMod = linkedSource
          ? candidateMods.find((mod) => mod.id === linkedSource.mod_id)
          : null;
        const secondaryMatch = existingPrimary || linkedMod
          ? { match: null, ambiguous: false, candidates: [] }
          : sourceMatchLookupFailed && project.platform === "gtainside"
            ? { match: null, ambiguous: true, candidates: [] }
            : matchResultsByProject.get(getProjectKey(project)) ?? resolveGtaInsideSourceMatch<SourceMatchMod>(project, candidateMods, deduplicatedProjects);
        const existingMod = existingPrimary ?? linkedMod ?? secondaryMatch.match;

        return {
          ...project,
          projectUrl: projectUrl ?? project.projectUrl,
          matchStatus: existingMod ? "existing" : "new",
          matchSource: existingMod ? (existingPrimary ? "primary" : "additional") :
            secondaryMatch.ambiguous ? "review" : undefined,
          sourceLinkStatus: linkedSource ? "already_linked" : secondaryMatch.match ? "review" : undefined,
          existingMod: existingMod ?? null,
          matchCandidates: secondaryMatch.ambiguous ? secondaryMatch.candidates.map((candidate) => {
            const details = reviewDetailsById.get(candidate.id);
            return {
              id: candidate.id,
              title: candidate.title,
              creator: candidate.creator,
              creator_id: candidate.creator_id,
              status: candidate.status,
              visibility: candidate.visibility,
              category: details?.category,
              description: details?.description,
              image: details?.image,
              primarySourceUrl: candidate.source_url,
              otherSources: (reviewSourcesByModId.get(candidate.id) ?? []).filter((source) => source.url !== candidate.source_url),
            };
          }) : undefined,
        };
      });

      const linksToAttach = enrichedProjects.filter((project) =>
        project.matchSource === "additional" && project.sourceLinkStatus === "review" && project.existingMod?.creator_id
      );
      if (linksToAttach.length > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const response = await fetch("/api/mod-sources", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ links: linksToAttach.map((project) => ({
              modId: project.existingMod?.id,
              platform: project.platform,
              projectUrl: project.projectUrl,
              externalId: project.externalId,
            })) }),
          });
          const result = await response.json() as { results?: unknown[] };
          if (response.ok && Array.isArray(result.results)) {
            const statuses = new Map<string, string>();
            for (const value of result.results) {
              if (value && typeof value === "object") {
                const row = value as Record<string, unknown>;
                if (typeof row.projectUrl === "string" && typeof row.status === "string") {
                  statuses.set(row.projectUrl, row.status);
                }
              }
            }
            for (const project of enrichedProjects) {
              if (project.matchSource !== "additional") continue;
              const status = statuses.get(project.projectUrl);
              if (status === "linked" || status === "already_linked" || status === "linked_elsewhere" || status === "forbidden") {
                project.sourceLinkStatus = status;
              } else if (status) {
                project.sourceLinkStatus = "review";
              }
            }
          } else {
            console.error("ADDITIONAL SOURCE ATTACHMENT FAILED:", result);
          }
        }
      }

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
            currentCreatorId={currentCreatorId}
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
