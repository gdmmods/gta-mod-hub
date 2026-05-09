"use client";

import Link from "next/link";

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
    <section className="mt-10">

      <div
        className="
          overflow-hidden
          rounded-[34px]
          border
          border-zinc-900
          bg-gradient-to-b
          from-zinc-950/70
          to-black/50
          backdrop-blur-2xl
        "
      >

        {/* TOP */}
        <div
          className="
            border-b
            border-zinc-900
            px-5
            py-5
            md:px-7
          "
        >

          <div
            className="
              flex
              flex-col
              gap-4
              md:flex-row
              md:items-end
              md:justify-between
            "
          >

            {/* LEFT */}
            <div>

              <div
                className="
                  mb-2
                  flex
                  items-center
                  gap-2
                  text-[11px]
                  uppercase
                  tracking-[0.25em]
                  text-zinc-500
                "
              >

                <div
                  className="
                    h-2
                    w-2
                    rounded-full
                    bg-purple-500
                  "
                />

                Discovery

              </div>

              <h2
                className="
                  text-2xl
                  md:text-3xl
                  font-black
                  tracking-tight
                "
              >
                Related Mods
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  text-zinc-500
                "
              >
                Similar content from the community
              </p>

            </div>

            {/* RIGHT */}
            <div
              className="
                flex
                items-center
                gap-3
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
                  text-sm
                  text-zinc-400
                "
              >
                {mods.length} mods
              </div>

              <Link
                href="/mods"
                className="
                  rounded-2xl
                  border
                  border-zinc-800
                  bg-zinc-900/70
                  px-4
                  py-2
                  text-sm
                  text-zinc-300
                  transition-all
                  duration-300
                  hover:border-zinc-700
                  hover:bg-zinc-800
                  hover:text-white
                "
              >
                Browse All
              </Link>

            </div>

          </div>

        </div>

        {/* GRID */}
        <div
          className="
            p-4
            md:p-5
          "
        >

          <div
            className="
              grid
              grid-cols-2
              gap-4
              md:grid-cols-3
              xl:grid-cols-4
              2xl:grid-cols-5
            "
          >

            {mods.map((mod) => (

              <div
                key={mod.id}
                className="
                  h-full
                "
              >

                <ModCard
                  mod={mod}
                  likes={mod.likes ?? 0}
                  downloads={
                    mod.downloads ?? 0
                  }
                />

              </div>

            ))}

          </div>

        </div>

      </div>

    </section>
  );
}