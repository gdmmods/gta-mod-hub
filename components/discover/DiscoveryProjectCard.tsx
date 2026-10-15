"use client";

import { useState } from "react";
import DiscoveryProjectPreview from "./DiscoveryProjectPreview";
import DiscoveryUpdateComparison, { type Comparison } from "./DiscoveryUpdateComparison";
import type { DiscoveryPreviewMetadata, DiscoveryResultProject } from "./types";

interface DiscoveryProjectCardProps {
  project: DiscoveryResultProject;
  action: string | undefined;
  comparison: Comparison | null;
  onAction: (project: DiscoveryResultProject, action: string) => void;
}

export default function DiscoveryProjectCard({
  project,
  action,
  comparison,
  onAction,
}: DiscoveryProjectCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMetadata, setPreviewMetadata] = useState<DiscoveryPreviewMetadata | null>(null);
  const [compareRequested, setCompareRequested] = useState(false);
  const isExisting = project.matchStatus === "existing";

  function withPreviewMetadata() {
    return { ...project, ...previewMetadata, title: previewMetadata?.title ?? project.title };
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
          {isExisting ? (
            <p className="text-sm text-zinc-400">Already in ModVault</p>
          ) : (
            <p className="text-sm text-emerald-400">New project</p>
          )}
          {action === "add" && <p className="mt-1 text-sm text-emerald-400">Added ✓</p>}
          {action === "update" && <p className="mt-1 text-sm text-emerald-400">Updated ✓</p>}
          {action === "ignore" && <p className="mt-1 text-sm text-red-400">Ignored</p>}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            {isExisting ? (
              <button
                type="button"
                onClick={beginComparison}
                disabled={action === "comparing" || action === "applying" || action === "update"}
                className={`rounded-lg px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                  action === "update" ? "bg-emerald-600" : "bg-purple-600 hover:bg-purple-500"
                }`}
              >
                {action === "update" ? "Updated ✓" : action === "comparing" ? "Comparing…" : action === "applying" ? "Applying…" : "Compare & Update"}
              </button>
            ) : (
              <button
                type="button"
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
              onClick={() => setPreviewOpen((current) => !current)}
              className={`rounded-lg border px-3 py-2 text-sm ${previewOpen ? "border-purple-500 bg-purple-900/30 text-purple-300" : "border-zinc-700 hover:bg-zinc-800"}`}
            >
              {previewOpen ? "Hide Preview" : "Preview"}
            </button>

            <button
              type="button"
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

      {previewOpen && (
        <DiscoveryProjectPreview
          project={project}
          onClose={() => setPreviewOpen(false)}
          onMetadataLoaded={(metadata) => {
            setPreviewMetadata(metadata);
            if (compareRequested) {
              setCompareRequested(false);
              onAction({ ...project, ...metadata, title: metadata.title ?? project.title }, "compare");
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
