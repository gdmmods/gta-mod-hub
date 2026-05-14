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
        mt-14
        pb-20
      "
    >

      <div
        className="
          flex
          items-center
          justify-between
          mb-8
        "
      >

        <div>

          <p
            className="
              text-sm
              uppercase
              tracking-[0.2em]
              text-zinc-500
            "
          >
            Collection
          </p>

          <h2
            className="
              text-4xl
              font-black
              mt-2
            "
          >
            Creator Mods
          </h2>

        </div>

      </div>

      <CreatorModsGrid
        mods={mods}
      />

    </section>

  );

}