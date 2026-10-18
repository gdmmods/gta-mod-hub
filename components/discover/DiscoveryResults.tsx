"use client";

import DiscoveryProjectCard from "./DiscoveryProjectCard";
import type { Comparison } from "./DiscoveryUpdateComparison";
import type { DiscoveryResultProject } from "./types";

export interface BulkUpdateCandidate {
  project: DiscoveryResultProject;
  comparison: Comparison;
}

export interface BulkActionStatus {
  action: "add" | "update";
  stage?: "compare" | "apply";
  phase: "working" | "review" | "done";
  current: number;
  total: number;
  success: number;
  skipped: number;
  failed: number;
  failures: string[];
}

const UPDATE_FIELDS = [
  ["title", "Title"], ["description", "Description"], ["category", "Category"],
  ["creator", "External author"], ["image", "Primary image"], ["images", "Screenshots"],
  ["features", "Features"], ["requirements", "Requirements"], ["notes", "Notes / Known Bugs"],
  ["credits", "Credits"], ["download_url", "Download link"],
] as const;

interface DiscoveryResultsProps {
  projects: DiscoveryResultProject[];
  projectActions: Record<string, string>;
  comparisons: Record<string, Comparison>;
  onProjectAction: (project: DiscoveryResultProject, action: string) => void;
  onBulkAdd: () => void;
  canAdd: boolean;
  onBulkUpdate: () => void;
  bulkStatus: BulkActionStatus | null;
  bulkCandidates: BulkUpdateCandidate[];
  selectedBulkFields: string[];
  onToggleBulkField: (field: string) => void;
  onConfirmBulkUpdate: () => void;
  onCancelBulkUpdate: () => void;
}

export default function DiscoveryResults({
  projects, projectActions, comparisons, onProjectAction,
  onBulkAdd, onBulkUpdate, bulkStatus, bulkCandidates, selectedBulkFields,
  canAdd,
  onToggleBulkField, onConfirmBulkUpdate, onCancelBulkUpdate,
}: DiscoveryResultsProps) {
  if (projects.length === 0) return null;

  const busy = bulkStatus?.phase === "working" || bulkStatus?.phase === "review";
  const eligibleAdd = projects.filter((project) => {
    const key = `${project.platform}-${project.externalId}`;
    return project.matchStatus !== "existing" && !["ignore", "add", "adding", "comparing", "applying"].includes(projectActions[key]);
  }).length;
  const eligibleUpdate = projects.filter((project) => {
    const key = `${project.platform}-${project.externalId}`;
    return project.matchStatus === "existing" && !["ignore", "update", "comparing", "applying"].includes(projectActions[key]);
  }).length;

  return (
    <section className="mt-8 rounded-[32px] border border-zinc-800 bg-zinc-950 p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-purple-400">Discovery Results</p>
          <h2 className="mb-2 text-2xl font-bold">Projects Found</h2>
          <p className="text-sm text-zinc-500">Review discovered projects before adding or updating them.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onBulkAdd} disabled={busy || !canAdd || eligibleAdd === 0}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50">
            {bulkStatus?.action === "add" && bulkStatus.phase === "working" ? "ADDING…" : `ADD ALL${eligibleAdd ? ` (${eligibleAdd})` : ""}`}
          </button>
          <button type="button" onClick={onBulkUpdate} disabled={busy || eligibleUpdate === 0}
            className="rounded-lg border border-purple-500 px-4 py-2 text-sm font-semibold text-purple-300 hover:bg-purple-900/30 disabled:cursor-not-allowed disabled:opacity-50">
            {bulkStatus?.action === "update" && bulkStatus.phase === "working"
              ? bulkStatus.stage === "compare" ? "COMPARING…" : "UPDATING…"
              : `UPDATE ALL${eligibleUpdate ? ` (${eligibleUpdate})` : ""}`}
          </button>
        </div>
      </div>

      {bulkStatus && (
        <div className="mb-5 rounded-xl border border-zinc-800 bg-black/50 p-4" role="status" aria-live="polite">
          {bulkStatus.phase === "working" ? (
            <p className="text-sm text-zinc-300">{bulkStatus.action === "add" ? "Adding" : bulkStatus.stage === "compare" ? "Comparing" : "Updating"} {bulkStatus.current} of {bulkStatus.total} eligible project{bulkStatus.total === 1 ? "" : "s"}…</p>
          ) : bulkStatus.phase === "review" ? (
            <p className="text-sm text-zinc-300">Comparison is ready for {bulkCandidates.length} project{bulkCandidates.length === 1 ? "" : "s"}. Choose the fields to accept across these projects.</p>
          ) : (
            <p className="text-sm text-zinc-300">Batch finished: {bulkStatus.success} succeeded, {bulkStatus.skipped} skipped, {bulkStatus.failed} failed.</p>
          )}
          {bulkStatus.phase === "working" && <progress className="mt-3 h-2 w-full accent-purple-500" max={bulkStatus.total || 1} value={bulkStatus.current} />}
          {bulkStatus.phase !== "working" && <p className="mt-2 text-xs text-zinc-400">{bulkStatus.success} succeeded · {bulkStatus.skipped} skipped · {bulkStatus.failed} failed</p>}
          {bulkStatus.failures.length > 0 && <ul className="mt-2 list-inside list-disc text-xs text-amber-300">{bulkStatus.failures.map((failure, index) => <li key={`${failure}-${index}`}>{failure}</li>)}</ul>}
        </div>
      )}

      {bulkStatus?.phase === "review" && (
        <div className="mb-5 rounded-2xl border border-purple-900/70 bg-zinc-950 p-5">
          <h3 className="font-semibold">Choose fields for UPDATE ALL</h3>
          <p className="mt-1 text-sm text-zinc-400">Only changed fields with valid source values are available. Each selected field will use that project’s compared value; the existing update endpoint revalidates every change.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {UPDATE_FIELDS.map(([field, label]) => {
              const count = bulkCandidates.filter(({ comparison }) => comparison.proposed[field] !== undefined && comparison.current[field] !== comparison.proposed[field]).length;
              if (!count) return null;
              return <label key={field} className="flex items-center gap-2 rounded-lg border border-zinc-800 p-3 text-sm text-zinc-200">
                <input type="checkbox" checked={selectedBulkFields.includes(field)} onChange={() => onToggleBulkField(field)} />
                <span>{label} <span className="text-zinc-500">({count})</span></span>
              </label>;
            })}
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onCancelBulkUpdate} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm">Cancel</button>
            <button type="button" onClick={onConfirmBulkUpdate} disabled={selectedBulkFields.length === 0} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium disabled:opacity-50">Apply selected fields to all eligible mods</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        {projects.map((project, index) => {
          const key = `${project.platform}-${project.externalId}`;
          return <DiscoveryProjectCard key={`${key}-${index}`} project={project} action={projectActions[key]} comparison={comparisons[key] ?? null} onAction={onProjectAction} actionsDisabled={busy} />;
        })}
      </div>
    </section>
  );
}
