import Link from "next/link";

interface Props {
  creator: any;
  premiumMods: any[];
}

export default function ModMonetizationHub({
  creator,
  premiumMods,
}: Props) {

  if (!premiumMods?.length) {
    return null;
  }

  return (

    <section
      className="
        max-w-[1450px]
        mx-auto
        px-6
        mt-16
      "
    >

      {/* HEADER */}

            <p
        className="
          text-sm
          uppercase
          tracking-[0.2em]
          text-purple-400
        "
      >
        Release Documentation
      </p>

      <h2
        className="
          text-3xl
          font-bold
          mt-2
        "
      >
        Restricted Releases
      </h2>

      <p
        className="
          mt-3
          text-zinc-400
        "
      >
        Projects from {creator?.name} that have been documented as restricted or externally released.
      </p>

      {/* GRID */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-2
          gap-6
        "
      >

        {premiumMods.map(
          (mod: any) => {

            if (!mod) {
              return null;
            }

            return (

              <div
                key={mod.id}
                className="
                  relative
                  h-[340px]
                  rounded-[34px]
                  overflow-hidden
                  border
                  border-zinc-800
                  group
                "
              >

                {/* IMAGE */}

                <img
                  src={
                    mod.image ||
                    mod.cover_image ||
                    mod.thumbnail ||
                    "/placeholder.jpg"
                  }
                  alt={mod.title}
                  className="
                    absolute
                    inset-0
                    w-full
                    h-full
                    object-cover
                    group-hover:scale-[1.03]
                    transition
                    duration-700
                  "
                />

                {/* OVERLAY */}

                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-black
                    via-black/75
                    to-black/30
                  "
                />

                {/* CONTENT */}

                <div
                  className="
                    absolute
                    inset-0
                    p-8
                    flex
                    flex-col
                    justify-end
                    gap-1
                  "
                >

                  {/* LABEL */}

                  <p
                    className="
                      text-sm
                      uppercase
                      tracking-[0.2em]
                      text-purple-300
                      mb-4
                    "
                  >
                    External / Restricted Release
                  </p>

                  {/* TITLE */}

                  <h3
                    className="
                      text-2l
                      lg:text-3xl
                      font-black
                      leading-tight
                      line-clamp-2
                      max-w-[70%]
                      drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]
                    "
                  >
                    {mod.title}
                  </h3>

                 
                  {/* STATS */}

                  <div
                    className="
                      flex
                      items-center
                      gap-5
                      mt-5
                      text-sm
                      text-zinc-300
                    "
                  >


                    <span>
                      ❤️ {mod.likes || 0}
                    </span>

                  </div>

                  {/* BUTTONS */}

                  <div
                    className="
                      flex
                      items-center
                      gap-4
                      mt-6
                    "
                  >

                    <Link
                      href={`/mods/${mod.id}`}
                      className="
                        px-5
                        py-3
                        rounded-2xl
                        bg-gradient-to-r
                        from-purple-600
                        to-fuchsia-500
                        text-sm
                        font-bold
                        text-white
                        hover:opacity-90
                        transition
                      "
                    >
                      View Mod
                    </Link>                  

                  </div>

                </div>

              </div>

            );

          }
        )}

      </div>

    </section>

  );

}