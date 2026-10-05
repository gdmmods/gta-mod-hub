"use client";

interface DiscoveryProjectPreviewProps {
  project: any;
  onClose: () => void;
}

export default function DiscoveryProjectPreview({
  project,
  onClose,
}: DiscoveryProjectPreviewProps) {
  return (
    <div
      className="
        mt-4
        rounded-2xl
        border
        border-zinc-800
        bg-black
        p-5
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-6
          mb-5
        "
      >
        <div>
          <p
            className="
              text-purple-400
              uppercase
              tracking-[0.2em]
              text-xs
              mb-2
            "
          >
            Project Preview
          </p>

          <h4
            className="
              text-lg
              font-semibold
            "
          >
            {project.title}
          </h4>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="
            text-sm
            text-zinc-500
            hover:text-white
            transition
          "
        >
          Close
        </button>
      </div>

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-4
        "
      >
        <div
          className="
            rounded-xl
            border
            border-zinc-800
            bg-zinc-950
            p-4
          "
        >
          <p className="text-xs uppercase tracking-wider text-zinc-600 mb-1">
            Platform
          </p>

          <p className="text-sm text-zinc-300">
            {project.platform}
          </p>
        </div>

        <div
          className="
            rounded-xl
            border
            border-zinc-800
            bg-zinc-950
            p-4
          "
        >
          <p className="text-xs uppercase tracking-wider text-zinc-600 mb-1">
            Status
          </p>

          <p className="text-sm text-zinc-300">
            {project.matchStatus === "existing"
              ? "Already in ModVault"
              : "New project"}
          </p>
        </div>

        <div
          className="
            rounded-xl
            border
            border-zinc-800
            bg-zinc-950
            p-4
          "
        >
          <p className="text-xs uppercase tracking-wider text-zinc-600 mb-1">
            External ID
          </p>

          <p className="text-sm text-zinc-300 break-all">
            {project.externalId}
          </p>
        </div>

        <div
          className="
            rounded-xl
            border
            border-zinc-800
            bg-zinc-950
            p-4
          "
        >
          <p className="text-xs uppercase tracking-wider text-zinc-600 mb-1">
            Source
          </p>

          <a
            href={project.projectUrl}
            target="_blank"
            rel="noreferrer"
            className="
              text-sm
              text-purple-400
              hover:text-purple-300
              break-all
            "
          >
            {project.projectUrl}
          </a>
        </div>
      </div>

      {project.imageUrl && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-zinc-600 mb-2">
            Source Image
          </p>

          <img
            src={project.imageUrl}
            alt={project.title}
            className="
              max-h-48
              rounded-xl
              border
              border-zinc-800
              object-contain
            "
          />
        </div>
      )}

      {project.existingMod && (
        <div
          className="
            mt-4
            rounded-xl
            border
            border-zinc-800
            bg-zinc-950
            p-4
          "
        >
          <p className="text-xs uppercase tracking-wider text-zinc-600 mb-2">
            Existing ModVault Record
          </p>

          <p className="text-sm text-zinc-300">
            {project.existingMod.title}
          </p>

          <p className="text-xs text-zinc-600 mt-1">
            {project.existingMod.status || "No status"}
          </p>
        </div>
      )}

      <p
        className="
          text-xs
          text-zinc-600
          mt-5
        "
      >
        Preview only. Nothing will be imported or changed in ModVault.
      </p>
    </div>
  );
}