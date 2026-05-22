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

  console.log(
    "PREMIUM HUB DATA:",
    premiumMods
  );

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

      <div className="mb-6">

        <p
          className="
            text-sm
            uppercase
            tracking-[0.2em]
            text-purple-400
          "
        >
          Supporter Access
        </p>

        <h2
          className="
            text-3xl
            font-bold
            mt-2
          "
        >
          Premium Releases
        </h2>

        <p
          className="
            mt-3
            text-zinc-400
          "
        >
          Exclusive supporter creations from{" "}
          {creator?.name}.
        </p>

      </div>

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

            console.log(
              "MOD:",
              mod
            );

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
                    Supporter Exclusive
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

                  {/* DESCRIPTION */}
{/*

                  <p
                    className="
                      mt-4
                      text-sm
                      text-zinc-300
                      leading-relaxed
                      line-clamp-2
                      max-w-[75%]
                    "
                  >
                    {mod.description}
                  </p>
*/}
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

                    {mod.external_purchase_url && (

                      <a
                        href={
                          mod.external_purchase_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          px-5
                          py-3
                          rounded-2xl
                          border
                          border-zinc-700
                          bg-black/40
                          text-sm
                          font-semibold
                          text-white
                          hover:opacity-90
                          transition
                        "
                      >
                        View Store
                      </a>

                    )}

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