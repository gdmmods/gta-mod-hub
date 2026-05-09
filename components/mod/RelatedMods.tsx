"use client";

import ModCard from "./ModCard";

type RelatedModsProps = {
  mods: any[];
};

export default function RelatedMods({
  mods,
}: RelatedModsProps) {

  if (!mods?.length) {
    return null;
  }

  return (
    <section className="mt-14">

      {/* HEADER */}
      <div className="mb-6">

        <h2 className="text-3xl font-bold">
          Related Mods
        </h2>

        <p className="text-zinc-500 mt-1">
          Discover similar content
        </p>

      </div>

      {/* GRID */}
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-3
          gap-6
        "
      >

        {mods.map((mod) => (

          <ModCard
  key={mod.id}
  mod={mod}
  likes={mod.likes ?? 0}
  downloads={mod.downloads ?? 0}
  variant="featured"
/>

        ))}

      </div>

    </section>
  );
}