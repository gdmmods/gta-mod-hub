import CreatorModsGrid from "./CreatorModsGrid";

interface CreatorModsSectionProps {
  mods: any[];
}

export default function CreatorModsSection({
  mods,
}: CreatorModsSectionProps) {

  return (

    <section
      className="
        max-w-[1450px]
        mx-auto
        px-6
        mt-12
        pb-24
      "
    >

      <div
        className="
          relative
          overflow-hidden
          rounded-[32px]
          border
          border-zinc-900
          bg-gradient-to-b
          from-zinc-950/70
          to-black/40
          backdrop-blur-xl
          p-7
          xl:p-8
        "
      >

        {/* subtle atmosphere */}
        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.08),transparent_55%)]
            pointer-events-none
          "
        />

        {/* HEADER */}
        <div
          className="
            relative
            flex
            flex-col
            md:flex-row
            md:items-end
            md:justify-between
            gap-6
            mb-10
          "
        >

          <div>

            <p
              className="
                text-[11px]
                uppercase
                tracking-[0.22em]
                text-zinc-500
              "
            >
              Creator Collection
            </p>

            <h2
              className="
                mt-3
                text-3xl
                xl:text-4xl
                font-black
                tracking-tight
                text-white
              "
            >
              Published Mods
            </h2>

            <p
              className="
                mt-3
                text-sm
                text-zinc-500
                max-w-2xl
              "
            >
              Explore the creator’s published projects,
              releases, and ecosystem contributions.
            </p>

          </div>

          <div
            className="
              flex
              items-center
              gap-3
              text-sm
              text-zinc-500
            "
          >

            <div
              className="
                rounded-2xl
                border
                border-zinc-800
                bg-black/30
                px-4
                py-2
              "
            >
              {mods.length} Mods
            </div>

          </div>

        </div>

        {/* GRID */}
        <div className="relative">

          <CreatorModsGrid
            mods={mods}
          />

        </div>

      </div>

    </section>

  );

}