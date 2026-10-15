"use client";

import { useEffect, useState } from "react";
import type { Gta5ModsDetails } from "@/lib/connectors/gta5ModsDetails";
import { getGta5ModsPreviewDescription } from "@/lib/connectors/gta5ModsDescriptionPreview";
import type { DiscoveryResultProject } from "./types";

interface DiscoveryMetadata {
  title: string | null;
  description: string | null;
  author: string | null;
  category: string | null;
  imageUrl: string | null;
  screenshots: string[];
  projectUrl: string;
  parsedDetails: Gta5ModsDetails | null;
}

interface PreviewMetadata extends DiscoveryMetadata {
  parsedDetails: Gta5ModsDetails | null;
}

interface DiscoveryProjectPreviewProps {
  project: DiscoveryResultProject;
  onClose: () => void;
  onMetadataLoaded: (metadata: DiscoveryMetadata) => void;
}

export default function DiscoveryProjectPreview({
  project,
  onClose,
  onMetadataLoaded,
}: DiscoveryProjectPreviewProps) {
  const [metadata, setMetadata] =
    useState<PreviewMetadata | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMetadata() {
      setLoading(true);
      setError(null);
      setMetadata(null);

      try {
        const response = await fetch(
          "/api/discover-platform/preview",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              projectUrl: project.projectUrl,
            }),
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ?? "Unable to load project metadata."
          );
        }

        const loadedMetadata = result.metadata as PreviewMetadata;
        setMetadata(loadedMetadata);
        onMetadataLoaded({
          title: loadedMetadata.title,
          description: loadedMetadata.parsedDetails?.description ?? loadedMetadata.description,
          author: loadedMetadata.author,
          category: loadedMetadata.category,
          imageUrl: loadedMetadata.imageUrl,
          screenshots: loadedMetadata.screenshots,
          projectUrl: loadedMetadata.projectUrl,
          parsedDetails: loadedMetadata.parsedDetails,
        });
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === "AbortError"
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load project metadata."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadMetadata();

    return () => controller.abort();
  }, [project.projectUrl]);

  const screenshots = [
    ...new Set(
      [
        metadata?.imageUrl,
        ...(metadata?.screenshots ?? []),
        project.imageUrl,
      ].filter(
        (image): image is string =>
          typeof image === "string" &&
          image.length > 0
      )
    ),
  ];

  const fullDescription = metadata?.parsedDetails
    ? getGta5ModsPreviewDescription(
        metadata.parsedDetails.description,
        metadata.parsedDetails
      )
    : metadata?.description;

  const parsedSections: Array<[string, string | null]> = [
    ["Features", metadata?.parsedDetails?.features ?? null],
    ["Notes / Known Bugs", metadata?.parsedDetails ? [
      metadata.parsedDetails.notes ? `Notes:\n${metadata.parsedDetails.notes}` : null,
      metadata.parsedDetails.knownBugs ? `Known Bugs:\n${metadata.parsedDetails.knownBugs}` : null,
    ].filter(Boolean).join("\n\n") || "None found in source description" : null],
    ["Requirements", metadata?.parsedDetails ? metadata.parsedDetails.requirements ?? "None found in source description" : null],
    ["Credits", metadata?.parsedDetails?.credits ?? null],
  ].filter((section): section is [string, string] =>
    typeof section[1] === "string" && section[1].trim().length > 0
  );

  return (
    <div className="mt-4 rounded-2xl border border-zinc-800 bg-black p-5">
      <div className="mb-5 flex items-start justify-between gap-6">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-purple-400">
            Project Preview
          </p>

          <h4 className="text-lg font-semibold">
            {metadata?.title ?? project.title}
          </h4>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-sm text-zinc-500 transition hover:text-white"
        >
          Close
        </button>
      </div>

      {loading && (
        <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">
            Loading source project metadata…
          </p>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-amber-900/60 bg-amber-950/20 p-4">
          <p className="text-sm text-amber-300">
            {error}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            The original discovery information is still available below.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoCard label="Platform">
          {project.platform}
        </InfoCard>

        <InfoCard label="Status">
          {project.matchStatus === "existing"
            ? "Already in ModVault"
            : "New project"}
        </InfoCard>

        <InfoCard label="Author">
          {metadata?.author ?? "Not available"}
        </InfoCard>

        <InfoCard label="Category">
          {metadata?.category ?? "Not available"}
        </InfoCard>

        <InfoCard label="External ID">
          <span className="break-all">
            {project.externalId}
          </span>
        </InfoCard>

        <InfoCard label="Source">
          <a
            href={project.projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-purple-400 hover:text-purple-300"
          >
            Open original project →
          </a>
        </InfoCard>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <p className="mb-2 text-xs uppercase tracking-wider text-zinc-600">
          Description
        </p>

        {fullDescription ? (
          <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">
            {fullDescription}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">
            {loading
              ? "Retrieving description…"
              : "No description available."}
          </p>
        )}
      </div>

      {parsedSections.map(([label, value]) => (
        <div key={label} className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-zinc-600">
            {label}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">
            {value}
          </p>
        </div>
      ))}

      {screenshots.length > 0 && (
        <div className="mt-4">
          <p className="mb-3 text-xs uppercase tracking-wider text-zinc-600">
            Source Images
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {screenshots.map((src, index) => (
              <a
                key={`${src}-${index}`}
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
              >
                <img
                  src={src}
                  alt={`${project.title} source image ${index + 1}`}
                  loading="lazy"
                  className="h-48 w-full object-contain"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {project.existingMod && (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-zinc-600">
            Existing ModVault Record
          </p>

          <p className="text-sm text-zinc-300">
            {project.existingMod.title}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            {project.existingMod.status || "No status"}
          </p>
        </div>
      )}

      <p className="mt-5 text-xs text-zinc-600">
        Preview only. Nothing will be imported or changed in ModVault.
      </p>
    </div>
  );
}

function InfoCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="mb-1 text-xs uppercase tracking-wider text-zinc-600">
        {label}
      </p>

      <p className="text-sm text-zinc-300">
        {children}
      </p>
    </div>
  );
}
