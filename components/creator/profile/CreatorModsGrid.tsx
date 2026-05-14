import ModsGridClient from "@/components/ui/ModsGridClient";

interface CreatorModsGridProps {
  mods: any[];
}

export default function CreatorModsGrid({
  mods,
}: CreatorModsGridProps) {

  if (mods.length === 0) {

    return (

      <div
        className="
          rounded-[30px]
          border
          border-zinc-900
          bg-zinc-950/50
          py-24
          text-center
          text-zinc-500
        "
      >
        No mods published yet.
      </div>

    );

  }

  return (
    <ModsGridClient mods={mods} />
  );

}