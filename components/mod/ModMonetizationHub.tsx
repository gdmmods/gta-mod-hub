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

  const spotlight =
    premiumMods[0];

  const secondary =
    premiumMods.slice(1, 5);

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

      {/* SPOTLIGHT */}

      <Link
        href={`/mods/${spotlight.id}`}
      >

        <div
          className="
            relative
            h-[420px]
            rounded-[36px]
            overflow-hidden
            border
            border-purple-500/20
            group
            mb-6
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
              group-hover:scale-[1.03]
              transition
              duration-700
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

              <span
                className="
                  text-purple-300
                "
              >
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
    inline-flex
    items-center
    rounded-2xl
    bg-purple-600
    hover:bg-purple-500
    px-6
    py-3
    text-sm
    font-semibold
    text-white
    transition
  "
>
  Support Creator
</button>

              </div>

            )}

          </div>

        </div>

      </Link>

      {/* SECONDARY PREMIUM MODS */}

      {secondary.length > 0 && (

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-4
            gap-5
          "
        >

          {secondary.map((mod) => (

            <Link
              key={mod.id}
              href={`/mods/${mod.id}`}
            >

              <div
                className="
                  relative
                  h-[280px]
                  rounded-[28px]
                  overflow-hidden
                  border
                  border-zinc-800
                  group
                "
              >

                <img
                  src={mod.image}
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

                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-black
                    via-black/50
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
                      inline-flex
                      w-fit
                      rounded-full
                      bg-purple-500/20
                      border
                      border-purple-500/30
                      px-3
                      py-1
                      text-xs
                      font-medium
                      text-purple-200
                      mb-4
                    "
                  >
                    Premium
                  </div>

                  <h4
                    className="
                      text-xl
                      font-bold
                      leading-snug
                      line-clamp-2
                    "
                  >
                    {mod.title}
                  </h4>

                  <div
                    className="
                      flex
                      items-center
                      gap-4
                      mt-4
                      text-xs
                      text-zinc-300
                    "
                  >

                    <span>
                      ⬇ {mod.downloads}
                    </span>

                    <span>
                      ❤️ {mod.likes}
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