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

            {creators.map((creator) => (

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

                  <img
                    src={
                      creator.avatar ||
                      "/placeholder-avatar.jpg"
                    }
                    alt={creator.name}
                    className="
                      w-14
                      h-14
                      rounded-full
                      object-cover

                      border
                      border-zinc-700
                    "
                  />

                  <div>

                    <h3
                      className="
                        text-lg
                        font-semibold
                      "
                    >
                      {creator.name}
                    </h3>

                  </div>

                </div>

              </Link>

            ))}

          </div>

        </div>

      )}

    </div>

  );

}