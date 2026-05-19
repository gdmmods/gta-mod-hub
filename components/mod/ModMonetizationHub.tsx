
"use client";

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

  const spotlight = premiumMods[0];

  const secondary = premiumMods.slice(1, 5);

  const mostDownloaded =
    premiumMods
      .slice()
      .sort(
        (a, b) =>
          (b.downloads || 0) -
          (a.downloads || 0)
      )[0];

  const mostLiked =
    premiumMods
      .slice()
      .sort(
        (a, b) =>
          (b.likes || 0) -
          (a.likes || 0)
      )[0];

  return (

    <section
      className="
        max-w-[1450px]
        mx-auto
        px-6
        mt-10
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
          Premium
        </p>

        <h2
          className="
            text-3xl
            font-bold
            mt-2
          "
        >
          Supporter Access
        </h2>

        <p
          className="
            mt-3
            text-zinc-400
            max-w-2xl
          "
        >
          Exclusive releases, supporter drops,
          early access builds, and premium
          creations from {creator.name}.
        </p>

      </div>

      {/* MAIN GRID */}

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-3
          gap-6
        "
      >

        {/* SPOTLIGHT */}

        <Link
          href={`/mods/${spotlight.id}`}
          className="xl:col-span-2 group"
        >

          <div
            className="
              relative
              h-[520px]
              rounded-[36px]
              overflow-hidden
              border
              border-purple-500/20
              transition
              duration-300
              hover:border-purple-500/40
              hover:-translate-y-1
            "
          >

            <img
              src={spotlight.image}
              alt={spotlight.title}
              className="
                absolute
                inset-0
                w-full
                h-full
                object-cover
                transition
                duration-700
                group-hover:scale-[1.03]
              "
            />

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-t
                from-black
                via-black/70
                to-black/20
              "
            />

            <div
              className="
                absolute
                inset-0
                p-10
                flex
                flex-col
                justify-end
              "
            >

              <div
                className="
                  inline-flex
                  items-center
                  w-fit
                  rounded-full
                  bg-purple-500/20
                  border
                  border-purple-500/30
                  px-4
                  py-1.5
                  text-sm
                  font-medium
                  text-purple-200
                  backdrop-blur-xl
                  mb-5
                "
              >
                Premium Access
              </div>

              <h3
                className="
                  text-5xl
                  font-black
                  leading-tight
                  max-w-4xl
                  line-clamp-3
                "
              >
                {spotlight.title}
              </h3>

              <p
                className="
                  mt-5
                  max-w-3xl
                  text-zinc-300
                  text-lg
                  line-clamp-4
                "
              >
                {spotlight.description}
              </p>

              <div
                className="
                  flex
                  items-center
                  gap-5
                  mt-6
                  text-sm
                  text-zinc-300
                "
              >

                <span>
                  ⬇ {spotlight.downloads}
                </span>

                <span>
                  ❤️ {spotlight.likes}
                </span>

                <span className="text-purple-300">
                  {spotlight.release_state}
                </span>

              </div>

              {spotlight.support_url && (

                <div className="mt-7">

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(
                        spotlight.support_url,
                        "_blank"
                      );
                    }}
                    className="
                      rounded-2xl
                      bg-gradient-to-r
                      from-purple-600
                      to-fuchsia-500
                      px-8
                      py-4
                      text-base
                      font-bold
                      text-white
                      shadow-lg
                      shadow-purple-900/40
                      transition
                      hover:scale-[1.03]
                    "
                  >
                    Support Creator
                  </button>

                </div>

              )}

            </div>

          </div>

        </Link>

        {/* SIDE GRID */}

        <div className="grid gap-6">

          {/* MOST DOWNLOADED */}

          {mostDownloaded && (

            <Link
              href={`/mods/${mostDownloaded.id}`}
              className="group"
            >

              <div
                className="
                  relative
                  h-[247px]
                  overflow-hidden
                  rounded-[30px]
                  border
                  border-zinc-800
                  transition
                  duration-300
                  hover:border-purple-500/40
                  hover:-translate-y-1
                "
              >

                <img
                  src={mostDownloaded.image}
                  alt={mostDownloaded.title}
                  className="
                    absolute
                    inset-0
                    w-full
                    h-full
                    object-cover
                    transition
                    duration-700
                    group-hover:scale-105
                  "
                />

                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-black
                    via-black/70
                    to-black/20
                  "
                />

                <div
                  className="
                    absolute
                    inset-0
                    p-8
                    flex
                    flex-col
                    justify-end
                  "
                >

                  <p
                    className="
                      text-sm
                      uppercase
                      tracking-[0.2em]
                      text-purple-300
                      mb-4
                    "
                  >
                    Most Downloaded
                  </p>

                  <h3
                    className="
                      text-3xl
                      font-black
                      leading-tight
                      line-clamp-2
                    "
                  >
                    {mostDownloaded.title}
                  </h3>

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
                      ⬇ {mostDownloaded.downloads}
                    </span>

                    <span>
                      ❤️ {mostDownloaded.likes}
                    </span>

                  </div>

                </div>

              </div>

            </Link>

          )}

          {/* MOST LIKED */}

          {mostLiked && (

            <Link
              href={`/mods/${mostLiked.id}`}
              className="group"
            >

              <div
                className="
                  relative
                  h-[247px]
                  overflow-hidden
                  rounded-[30px]
                  border
                  border-zinc-800
                  transition
                  duration-300
                  hover:border-pink-500/40
                  hover:-translate-y-1
                "
              >

                <img
                  src={mostLiked.image}
                  alt={mostLiked.title}
                  className="
                    absolute
                    inset-0
                    w-full
                    h-full
                    object-cover
                    transition
                    duration-700
                    group-hover:scale-105
                  "
                />

                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-black
                    via-black/70
                    to-black/20
                  "
                />

                <div
                  className="
                    absolute
                    inset-0
                    p-8
                    flex
                    flex-col
                    justify-end
                  "
                >

                  <p
                    className="
                      text-sm
                      uppercase
                      tracking-[0.2em]
                      text-pink-300
                      mb-4
                    "
                  >
                    Community Favorite
                  </p>

                  <h3
                    className="
                      text-3xl
                      font-black
                      leading-tight
                      line-clamp-2
                    "
                  >
                    {mostLiked.title}
                  </h3>

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
                      ❤️ {mostLiked.likes}
                    </span>

                    <span>
                      ⬇ {mostLiked.downloads}
                    </span>

                  </div>

                </div>

              </div>

            </Link>

          )}

        </div>

      </div>

      {/* EXTRA PREMIUM MODS */}

      {secondary.length > 1 && (

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-4
            gap-5
            mt-6
          "
        >

          {secondary.map((mod) => (

            <Link
              key={mod.id}
              href={`/mods/${mod.id}`}
              className="group"
            >

              <div
                className="
                  relative
                  h-[320px]
                  overflow-hidden
                  rounded-[28px]
                  border
                  border-zinc-800
                  bg-black
                  transition
                  duration-300
                  hover:border-purple-500/40
                  hover:-translate-y-1
                "
              >

                <img
                  src={mod.image}
                  alt={mod.title}
                  className="
                    absolute
                    inset-0
                    h-full
                    w-full
                    object-cover
                    transition
                    duration-700
                    group-hover:scale-105
                  "
                />

                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-black
                    via-black/60
                    to-black/10
                  "
                />

                <div
                  className="
                    absolute
                    inset-0
                    p-6
                    flex
                    flex-col
                    justify-end
                  "
                >

                  <div
                    className="
                      text-[11px]
                      uppercase
                      tracking-[0.25em]
                      text-purple-300
                      mb-3
                    "
                  >
                    Premium Release
                  </div>

                  <h3
                    className="
                      text-2xl
                      font-bold
                      leading-tight
                      line-clamp-2
                    "
                  >
                    {mod.title}
                  </h3>

                  <div
                    className="
                      flex
                      items-center
                      gap-4
                      mt-4
                      text-sm
                      text-zinc-300
                    "
                  >

                    <span>
                      ❤️ {mod.likes}
                    </span>

                    <span>
                      ⬇ {mod.downloads}
                    </span>

                  </div>

                </div>

              </div>

            </Link>

          ))}

        </div>

      )}

    </section>

  );

}