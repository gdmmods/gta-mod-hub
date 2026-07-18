import RoadmapCard from "./RoadmapCard";
import type { RoadmapSection as RoadmapSectionType } from "@/lib/roadmap/types";

interface RoadmapSectionProps {
  section: RoadmapSectionType;
}

export default function RoadmapSection({
  section,
}: RoadmapSectionProps) {
  return (
    <section
      className="
        relative
        max-w-[1600px]
        mx-auto
        px-6
        pt-14
      "
    >
      <div>
        <h2 className="text-3xl font-bold">
          {section.title}
        </h2>

        <p className="mt-2 max-w-3xl py-3 text-muted-foreground">
          {section.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 py-10 md:grid-cols-2 xl:grid-cols-5">
        {section.phases.map((phase) => (
          <RoadmapCard
            key={phase.id}
            phase={phase}
          />
        ))}
      </div>
    </section>
  );
}