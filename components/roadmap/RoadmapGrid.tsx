import RoadmapCard from "./RoadmapCard";

interface Props {
  phases: any[];
  cols?: string;
}

export default function RoadmapGrid({
  phases,
  cols = "xl:grid-cols-5",
}: Props) {
  return (
    <div
      className={`
        grid
        grid-cols-1
        md:grid-cols-2
        ${cols}
        gap-6
      `}
    >
      {phases.map((phase) => (
        <RoadmapCard
          key={phase.phase}
          phase={phase}
        />
      ))}
    </div>
  );
}