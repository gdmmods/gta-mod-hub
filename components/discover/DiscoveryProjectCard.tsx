"use client";

import { useState } from "react";
import DiscoveryProjectPreview from "./DiscoveryProjectPreview";
import DiscoveryUpdateComparison, { type Comparison } from "./DiscoveryUpdateComparison";
import type { DiscoveryResultProject } from "./types";

interface DiscoveryProjectCardProps {
  project: DiscoveryResultProject;
  action: string | undefined;
  comparison: Comparison | null;
  onAction: (project: DiscoveryResultProject, action: string) => void;
  actionsDisabled?: boolean;
  currentCreatorId?: string | null;
}

function safeSourceLink(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function displayValue(value: string | null | undefined): string {
  return value?.trim() || "Not available";
}

export default function DiscoveryProjectCard({
  project,
  action,
  comparison,
  onAction,
  actionsDisabled = false,
  currentCreatorId = null,
}: DiscoveryProjectCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMetadata, setPreviewMetadata] = useState<DiscoveryResultProject | null>(null);
  const [compareRequested, setCompareRequested] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmSeparate, setConfirmSeparate] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const isExisting = project.matchStatus === "existing";
  const isAdditionalSource = project.matchSource === "additional";
  const needsSourceReview = project.matchSource === "review";
  const candidates = project.matchCandidates ?? [];
  const selectedCandidate = candidates.find((candidate) => candidate.id === selectedCandidateId) ?? candidates[0];
  const reviewPanelId = `source-review-${project.platform}-${project.externalId}`.replace(/[^a-zA-Z0-9_-]/g, "-");

  const reviewDifferences = selectedCandidate ? [
    ["Title", project.title, selectedCandidate.title],
    ["Creator", project.author, selectedCandidate.creator],
    ["Category", project.category, selectedCandidate.category],
    ["Description", project.description, selectedCandidate.description],
  ] as const : [];

  function isDifferent(incoming: string | null | undefined, saved: string | null | undefined) {
    return Boolean(incoming?.trim() && saved?.trim() && incoming.trim() !== saved.trim());
  }

  function withPreviewMetadata() {
    return previewMetadata ?? project;
  }

  function beginComparison() {
    setPreviewOpen(true);
    if (previewMetadata) {
      onAction(withPreviewMetadata(), "compare");
    } else {
      setCompareRequested(true);
    }
  }

  return (
    <div className="border-b border-zinc-800 p-5 last:border-b-0">
      <div className="grid grid-cols-1 gap-2">
        <div>
          <h3 className="text-lg font-semibold">{project.title}</h3>
          <p className="mt-1 text-sm text-zinc-500">{project.platform}</p>
          {needsSourceReview ? (
            <p className="text-sm text-amber-400">Potential match needs review</p>
          ) : isExisting ? (
            <p className="text-sm text-zinc-400">
              {isAdditionalSource ? "Matched to an existing ModVault mod" : "Already in ModVault"}
            </p>
          ) : (
            <p className="text-sm text-emerald-400">New project</p>
          )}
          {isAdditionalSource && (
            <p className={`mt-1 text-sm ${project.sourceLinkStatus === "linked" || project.sourceLinkStatus === "already_linked" ? "text-emerald-400" : "text-amber-400"}`}>
              {project.sourceLinkStatus === "linked" ? "GTAInside source added to Other Sources" :
                project.sourceLinkStatus === "already_linked" ? "GTAInside source is already linked" :
                  project.sourceLinkStatus === "forbidden" ? "Matched mod belongs to another creator; source needs review" :
                    project.sourceLinkStatus === "linked_elsewhere" ? "This source is already attached to another ModVault mod; review required" :
                    "Matched mod found; source link needs review"}
            </p>
          )}
          {needsSourceReview && (
            <p className="mt-1 text-sm text-amber-400">
              {project.matchCandidates?.length
                ? `Possible matches: ${project.matchCandidates.map((candidate) => candidate.title).filter(Boolean).join(", ")}. Review before adding.`
                : "The creator is missing or a possible match is ambiguous. Review the source before adding a separate mod."}
            </p>
          )}
          {action === "add" && <p className="mt-1 text-sm text-emerald-400">Added ✓</p>}
          {action === "update" && <p className="mt-1 text-sm text-emerald-400">Updated ✓</p>}
          {action === "ignore" && <p className="mt-1 text-sm text-red-400">Ignored</p>}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            {needsSourceReview ? (
              <button
                type="button"
                aria-expanded={reviewOpen}
                aria-controls={reviewPanelId}
                onClick={() => { setReviewOpen((current) => !current); setConfirmSeparate(false); }}
                disabled={actionsDisabled}
                className="rounded-lg border border-amber-700/70 px-3 py-2 text-sm text-amber-300 hover:bg-amber-950/40 disabled:opacity-60"
              >
                {reviewOpen ? "Close review" : "Review required"}
              </button>
            ) : isAdditionalSource ? (
              <>
                <span className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-500" aria-live="polite">
                  {project.sourceLinkStatus === "linked" || project.sourceLinkStatus === "already_linked" ? "Source linked" :
                    project.sourceLinkStatus === "linked_elsewhere" ? "Linked to another mod" :
                      project.sourceLinkStatus === "forbidden" ? "Ownership review required" : "Review required"}
                </span>
                {project.sourceLinkStatus === "review" && project.existingMod?.id && (
                  <button
                    type="button"
                    onClick={() => onAction(withPreviewMetadata(), "attach-source")}
                    disabled={actionsDisabled || action === "attaching"}
                    className="rounded-lg bg-purple-600 px-3 py-2 text-sm hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {action === "attaching" ? "Attaching…" : "Attach Source"}
                  </button>
                )}
              </>
            ) : isExisting ? (
              <button
                type="button"
                onClick={beginComparison}
                disabled={actionsDisabled || action === "comparing" || action === "applying" || action === "update"}
                className={`rounded-lg px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                  action === "update" ? "bg-emerald-600" : "bg-purple-600 hover:bg-purple-500"
                }`}
              >
                {action === "update" ? "Updated ✓" : action === "comparing" ? "Comparing…" : action === "applying" ? "Applying…" : "Compare & Update"}
              </button>
            ) : (
              <button
                type="button"
                disabled={actionsDisabled || action === "adding"}
                onClick={() => {
                  if (!previewMetadata) {
                    setPreviewOpen(true);
                    return;
                  }
                  onAction(withPreviewMetadata(), "add");
                }}
                className={`rounded-lg px-3 py-2 text-sm ${action === "add" ? "bg-emerald-600" : "bg-purple-600 hover:bg-purple-500"}`}
              >
                {action === "add" ? "Added ✓" : previewMetadata ? "Add" : "Preview to Add"}
              </button>
            )}

            <button
              type="button"
              disabled={actionsDisabled}
              onClick={() => setPreviewOpen((current) => !current)}
              className={`rounded-lg border px-3 py-2 text-sm ${previewOpen ? "border-purple-500 bg-purple-900/30 text-purple-300" : "border-zinc-700 hover:bg-zinc-800"}`}
            >
              {previewOpen ? "Hide Preview" : "Preview"}
            </button>

            <button
              type="button"
              disabled={actionsDisabled}
              onClick={() => onAction(project, "ignore")}
              className={`rounded-lg border px-3 py-2 text-sm ${action === "ignore" ? "border-red-500 bg-red-900/30 text-red-400" : "border-zinc-700 hover:bg-zinc-800"}`}
            >
              {action === "ignore" ? "Ignored" : "Ignore"}
            </button>
          </div>

          <a href={project.projectUrl} target="_blank" rel="noreferrer" className="ml-4 shrink-0 text-sm text-purple-400 hover:text-purple-300">
            View Project →
          </a>
        </div>
      </div>

      {needsSourceReview && reviewOpen && (
        <section id={reviewPanelId} aria-label="Review potential ModVault matches" className="mt-5 rounded-2xl border border-amber-900/70 bg-zinc-950 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Verify before linking</p>
              <p className="mt-1 text-sm text-zinc-400">No source will be attached until you confirm a candidate. Review can be closed without changing anything.</p>
            </div>
            <button type="button" onClick={() => { setReviewOpen(false); setConfirmSeparate(false); }} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">Cancel review</button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-black/50 p-4">
              <h4 className="font-semibold text-white">Incoming GTAInside listing</h4>
              <p className="mt-2 text-sm text-zinc-300">{project.title}</p>
              <p className="mt-1 text-sm text-zinc-500">Creator: {displayValue(project.author)}</p>
              <p className="mt-1 text-sm text-zinc-500">Category: {displayValue(project.category)}</p>
              {safeSourceLink(project.projectUrl) && <a href={safeSourceLink(project.projectUrl)!} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block break-all text-sm text-purple-300 underline">Open original source page</a>}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black/50 p-4">
              <h4 className="font-semibold text-white">Potential ModVault match</h4>
              {candidates.length > 1 && (
                <label className="mt-2 block text-sm text-zinc-400">
                  Select a candidate
                  <select value={selectedCandidate?.id ?? ""} onChange={(event) => setSelectedCandidateId(event.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white">
                    {candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title || "Untitled mod"} · {candidate.id.slice(0, 8)}</option>)}
                  </select>
                </label>
              )}
              {selectedCandidate ? (
                <>
                  <p className="mt-2 text-sm text-zinc-300">{selectedCandidate.title || "Untitled mod"}</p>
                  <p className="mt-1 text-sm text-zinc-500">Creator: {displayValue(selectedCandidate.creator)}</p>
                  <p className="mt-1 text-sm text-zinc-500">Status: {displayValue(selectedCandidate.status)}{selectedCandidate.visibility ? ` · ${selectedCandidate.visibility}` : ""}</p>
                  <p className="mt-1 text-sm text-zinc-500">Category: {displayValue(selectedCandidate.category)}</p>
                  {safeSourceLink(selectedCandidate.primarySourceUrl) && <a href={safeSourceLink(selectedCandidate.primarySourceUrl)!} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block break-all text-sm text-purple-300 underline">Open primary source page</a>}
                  {!!selectedCandidate.otherSources?.length && (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Other linked source pages</p>
                      <ul className="mt-1 space-y-1">
                        {selectedCandidate.otherSources.map((source) => safeSourceLink(source.url) && <li key={`${source.platform}:${source.url}`}><a href={safeSourceLink(source.url)!} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-purple-300 underline">{source.platform}: {source.url}</a></li>)}
                      </ul>
                    </div>
                  )}
                </>
              ) : <p className="mt-2 text-sm text-zinc-400">No specific existing record could be loaded. The listing remains unlinked.</p>}
            </div>
          </div>

          {selectedCandidate && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500"><tr><th className="p-3">Field</th><th className="p-3">Incoming listing</th><th className="p-3">Existing record</th><th className="p-3">Difference</th></tr></thead>
                <tbody>{reviewDifferences.map(([label, incoming, saved]) => (
                  <tr key={label} className="border-t border-zinc-800 align-top">
                    <th scope="row" className="p-3 font-medium text-zinc-400">{label}</th>
                    <td className="max-w-[240px] whitespace-pre-wrap break-words p-3 text-zinc-200">{displayValue(incoming)}</td>
                    <td className="max-w-[240px] whitespace-pre-wrap break-words p-3 text-zinc-200">{displayValue(saved)}</td>
                    <td className={`p-3 ${isDifferent(incoming, saved) ? "text-amber-300" : "text-zinc-500"}`}>{isDifferent(incoming, saved) ? "Different" : incoming?.trim() && saved?.trim() ? "Same" : "Not comparable"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {selectedCandidate && selectedCandidate.creator_id === currentCreatorId ? (
              <button type="button" disabled={actionsDisabled || action === "attaching"} onClick={() => onAction({ ...project, reviewSelectedModId: selectedCandidate.id }, "review-attach")} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50">
                {action === "attaching" ? "Attaching source…" : "Confirm match & attach source"}
              </button>
            ) : (
              <p className="text-sm text-zinc-500">You can attach a source only to a mod managed by this creator.</p>
            )}

            {!confirmSeparate ? (
              <button type="button" disabled={actionsDisabled} onClick={() => setConfirmSeparate(true)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50">Dismiss suggestion</button>
            ) : (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirm separate project decision">
                <span className="text-sm text-amber-300">The later Add will create a separate project.</span>
                <button type="button" onClick={() => { setConfirmSeparate(false); setReviewOpen(false); onAction(project, "dismiss-review"); }} className="rounded-lg bg-amber-700 px-3 py-2 text-sm text-white hover:bg-amber-600">Keep separate</button>
                <button type="button" onClick={() => setConfirmSeparate(false)} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300">Cancel</button>
              </div>
            )}
          </div>
        </section>
      )}

      {project.allowSeparateAfterReview === true && (
        <p className="mt-3 text-sm text-amber-300">Suggestion dismissed. Adding this listing will create a separate ModVault project.</p>
      )}

      {previewOpen && (
        <DiscoveryProjectPreview
          project={project}
          onClose={() => setPreviewOpen(false)}
          onMetadataLoaded={(metadata) => {
            setPreviewMetadata(metadata);
            if (compareRequested) {
              setCompareRequested(false);
              onAction(metadata, "compare");
            }
          }}
        />
      )}

      {comparison && action !== "update" && (
        <DiscoveryUpdateComparison
          comparison={comparison}
          applying={action === "applying"}
          onApply={(acceptedFields) =>
            onAction({ ...withPreviewMetadata(), acceptedFields }, "apply-update")
          }
        />
      )}
    </div>
  );
}
