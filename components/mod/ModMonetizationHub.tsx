import Link from "next/link";

interface Props {
  creator: any;
  premiumMods?: any[];
}

export default function ModMonetizationHub({
  creator,
  premiumMods = [],
}: Props) {

  const featured =
    premiumMods[0];

  const sideMods =
    premiumMods.slice(1, 5);

  if (!featured) {
    return null;
  }

  return (

    <section
      className="
        max-w-[1450px]
        mx-auto
        px-6
        mt-14
      "
    >

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-[1.2fr_0.8fr]
          gap-6
        "
      >

        {/* FEATURED PREMIUM */}
        <div
          className="
            relative
            overflow-hidden
            rounded-[34px]
            border
            border-zinc-800
            bg-black
            min-h-[420px]
          "
        >

          <img
            src={featured.image}
            alt={featured.title}
            className="
              absolute
              inset-0
              w-full
              h-full
              object-cover
              opacity-70
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
              relative
              z-10
              h-full
              flex
              flex-col
              justify-end
              p-10
            "
          >

            <div
              className="
                flex
                flex-wrap
                gap-2
                mb-5
              "
            >

              <div
                className="
                  rounded-full
                  bg-purple-500/20
                  border
                  border-purple-500/20
                  px-4
                  py-1.5
                  text-sm
                  text-purple-300
                "
              >
                Premium
              </div>

              {featured.early_access && (

                <div
                  className="
                    rounded-full
                    bg-amber-500/20
                    border
                    border-amber-500/20
                    px-4
                    py-1.5
                    text-sm
                    text-amber-300
                  "
                >
                  Early Access
                </div>

              )}

            </div>

            <p
              className="
                text-sm
                uppercase
                tracking-[0.2em]
                text-zinc-400
              "
            >
              Support {creator.name}
            </p>

            <h2
              className="
                text-5xl
                font-black
                leading-tight
                mt-4
                max-w-3xl
              "
            >
              {featured.title}
            </h2>

            <p
              className="
                mt-5
                text-zinc-300
                max-w-2xl
                line-clamp-3
              "
            >
              {featured.description}
            </p>

            <div
              className="
                flex
                flex-wrap
                gap-4
                mt-8
              "
            >

              {featured.support_url && (

                <a
                  href={
                    featured.support_url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    rounded-2xl
                    bg-purple-600
                    hover:bg-purple-500
                    transition
                    px-6
                    py-3
                    font-semibold
                  "
                >
                  Support Creator
                </a>

              )}

              {featured.external_purchase_url && (

                <a
                  href={
                    featured.external_purchase_url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    rounded-2xl
                    border
                    border-zinc-700
                    bg-black/30
                    hover:border-purple-500/30
                    transition
                    px-6
                    py-3
                    font-semibold
                  "
                >
                  Get Premium Access
                </a>

              )}

            </div>

          </div>

        </div>

        {/* SIDE GRID */}
        <div
          className="
            grid
            grid-cols-2
            gap-4
          "
        >

          {sideMods.map((mod) => (

            <Link
              key={mod.id}
              href={`/mods/${mod.id}`}
            >

              <div
                className="
                  relative
                  overflow-hidden
                  rounded-[26px]
                  border
                  border-zinc-800
                  bg-zinc-950
                  aspect-[1/1.05]
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
                    opacity-70
                    group-hover:scale-[1.04]
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
                    p-5
                    flex
                    flex-col
                    justify-end
                  "
                >

                  <div
                    className="
                      rounded-full
                      bg-purple-500/20
                      border
                      border-purple-500/20
                      px-3
                      py-1
                      text-xs
                      text-purple-300
                      w-fit
                      mb-3
                    "
                  >
                    Premium
                  </div>

                  <h3
                    className="
                      text-lg
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
                      gap-3
                      mt-3
                      text-xs
                      text-zinc-400
                    "
                  >

                    {mod.price > 0 && (
                      <span>
                        ${mod.price}
                      </span>
                    )}

                    <span>
                      ❤️ {mod.likes}
                    </span>

                  </div>

                </div>

              </div>

            </Link>

          ))}

        </div>

      </div>

    </section>

  );

}