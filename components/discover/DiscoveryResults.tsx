"use client";

import DiscoveryProjectCard from "./DiscoveryProjectCard";

interface DiscoveryResultsProps {
  projects: any[];
  projectActions: Record<string, string>;
  creatorId: string | null;
  onProjectAction: (
    project: any,
    action: string
  ) => void;
}

export default function DiscoveryResults({
  projects,
  projectActions,
  creatorId,
  onProjectAction,
}: DiscoveryResultsProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
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

      <div
        className="
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-900
          overflow-hidden
        "
      >
        {projects.map(
          (project, index) => {
            const key =
              `${project.platform}-${project.externalId}`;

            return (
              <DiscoveryProjectCard
                key={`${key}-${index}`}
                project={project}
                action={projectActions[key]}
                creatorId={creatorId}
                onAction={onProjectAction}
                />
            );
          }
        )}
      </div>
    </section>
  );
}