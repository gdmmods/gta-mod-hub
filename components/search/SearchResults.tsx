import Link from "next/link";

type Props = {
  mods: any[];
  creators: any[];
  active: string;
};

export default function SearchResults({
  mods,
  creators,
  active,
}: Props) {

  return (

    <div className="space-y-14">

      {/* MODS */}

      {(active === "all" ||
        active === "mods") && (

        <div>

          <h2
            className="
              text-2xl
              font-bold
              mb-6
            "
          >
            Mods
          </h2>

          <div
            className="
              grid
              md:grid-cols-2
              xl:grid-cols-3
              gap-6
            "
          >

            {mods.map((mod) => (

              <Link
                key={mod.id}
                href={`/mods/${mod.id}`}
                className="
                  rounded-3xl
                  overflow-hidden
                  border
                  border-zinc-800
                  bg-zinc-900
                  hover:border-purple-500
                  transition
                "
              >

                <img
                  src={mod.image}
                  alt={mod.title}
                  className="
                    w-full
                    h-52
                    object-cover
                  "
                />

                <div className="p-5">

                  <h3
                    className="
                      text-lg
                      font-semibold
                    "
                  >
                    {mod.title}
                  </h3>

                </div>

              </Link>

            ))}

          </div>

        </div>

      )}

      {/* CREATORS */}

      {(active === "all" ||
        active === "creators") && (

        <div>

          <h2
            className="
              text-2xl
              font-bold
              mb-6
            "
          >
            Creators
          </h2>

          <div
            className="
              grid
              md:grid-cols-2
              xl:grid-cols-3
              gap-6
            "
          >

            {creators.map((creator) => {

              const isTeam =
                creator.owner_type === "team";

              const label =
                isTeam
                  ? "Team"
                  : "Creator";

              const initial =
                creator.name
                  ?.charAt(0)
                  ?.toUpperCase() || "?";

              return (

                <Link
                  key={creator.id}
                  href={`/creator/${creator.id}`}
                  className="
                    p-6
                    rounded-3xl
                    border
                    border-zinc-800
                    bg-zinc-900
                    hover:border-purple-500
                    transition
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-4
                    "
                  >

                    {/* AVATAR */}

                    <div
                      className="
                        w-14
                        h-14
                        shrink-0
                        rounded-full
                        overflow-hidden
                        border
                        border-zinc-700
                        bg-zinc-950
                        flex
                        items-center
                        justify-center
                        text-lg
                        font-semibold
                        text-zinc-400
                      "
                    >

                      {creator.avatar ? (

                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="
                            w-full
                            h-full
                            object-cover
                          "
                          onError={(e) => {
                            e.currentTarget.style.display =
                              "none";

                            e.currentTarget.parentElement
                              ?.classList.add(
                                "avatar-fallback"
                              );
                          }}
                        />

                      ) : (

                        initial

                      )}

                    </div>

                    {/* IDENTITY */}

                    <div>

                      <h3
                        className="
                          text-lg
                          font-semibold
                        "
                      >
                        {creator.name}
                      </h3>

                      <span
                        className="
                          inline-block
                          mt-1
                          text-xs
                          uppercase
                          tracking-wider
                          text-zinc-500
                        "
                      >
                        {label}
                      </span>

                    </div>

                  </div>

                </Link>

              );

            })}

          </div>

        </div>

      )}

    </div>

  );

}