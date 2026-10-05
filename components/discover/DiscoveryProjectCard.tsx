"use client";

import { useState } from "react";

import DiscoveryProjectPreview from "./DiscoveryProjectPreview";

interface DiscoveryProjectCardProps {
  project: any;
  action: string | undefined;
  creatorId: string | null;
  onAction: (project: any, action: string) => void;
}

export default function DiscoveryProjectCard({
  project,
  action,
  creatorId,
  onAction,
}: DiscoveryProjectCardProps) {

  const [previewOpen, setPreviewOpen] =
    useState(false);

  const isExisting =
    project.matchStatus === "existing";

  return (
    <div
      className="
        p-5
        border-b
        border-zinc-800
        last:border-b-0
      "
    >
      <div
        className="
          grid
          grid-cols-1
          gap-2
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

          {isExisting ? (
            <p className="text-sm text-zinc-400">
              Already in ModVault
            </p>
          ) : (
            <p className="text-sm text-emerald-400">
              New project
            </p>
          )}

          {action === "add" && (
            <p className="text-sm text-emerald-400 mt-1">
              Queued to be added
            </p>
          )}

          {action === "update" && (
            <p className="text-sm text-emerald-400 mt-1">
              Queued for update
            </p>
          )}

          {action === "ignore" && (
            <p className="text-sm text-red-400 mt-1">
              Ignored
            </p>
          )}

        </div>

        <div
          className="
            flex
            items-center
            justify-end
            gap-2
            shrink-0
          "
        >

          <div className="flex items-center gap-2">

            {isExisting ? (

              <button
                type="button"
                onClick={() =>
                    onAction(
                    project,
                    "update"
                    )
                }
                className={`
                    px-3
                    py-2
                    rounded-lg
                    text-sm
                    ${
                    action === "update"
                        ? "bg-emerald-600 hover:bg-emerald-500"
                        : "bg-purple-600 hover:bg-purple-500"
                    }
                `}
                >
                {action === "update"
                    ? "Updated ✓"
                    : "Update"}
                </button>

            ) : (

              <button
                type="button"
                onClick={() =>
                  onAction(
                    project,
                    "add"
                  )
                }
                className={`
                  px-3
                  py-2
                  rounded-lg
                  text-sm
                  ${
                    action === "add"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-purple-600 hover:bg-purple-500"
                  }
                `}
              >
                {action === "add"
                  ? "Added ✓"
                  : "Add"}
              </button>

            )}

            <button
              type="button"
              onClick={() =>
                setPreviewOpen(
                  (current) => !current
                )
              }
              className={`
                px-3
                py-2
                rounded-lg
                text-sm
                border
                ${
                  previewOpen
                    ? "border-purple-500 bg-purple-900/30 text-purple-300"
                    : "border-zinc-700 hover:bg-zinc-800"
                }
              `}
            >
              {previewOpen
                ? "Hide Preview"
                : "Preview"}
            </button>

            <button
              type="button"
              onClick={() =>
                onAction(
                  project,
                  "ignore"
                )
              }
              className={`
                px-3
                py-2
                rounded-lg
                text-sm
                border
                ${
                  action === "ignore"
                    ? "border-red-500 bg-red-900/30 text-red-400 hover:bg-red-900/50"
                    : "border-zinc-700 hover:bg-zinc-800"
                }
              `}
            >
              {action === "ignore"
                ? "Ignored"
                : "Ignore"}
            </button>

          </div>

          <a
            href={project.projectUrl}
            target="_blank"
            rel="noreferrer"
            className="
              text-purple-400
              hover:text-purple-300
              text-sm
              shrink-0
              ml-4
            "
          >
            View Project →
          </a>

        </div>

      </div>

      {previewOpen && (
        <DiscoveryProjectPreview
          project={project}
          onClose={() =>
            setPreviewOpen(false)
          }
        />
      )}

    </div>
  );
}