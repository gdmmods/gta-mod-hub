import Link from "next/link";

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
    <section className="mt-14">

      {/* HEADER */}
      <div className="mb-6">

        <h2 className="text-3xl font-bold">
          Related Mods
        </h2>

        <p className="text-zinc-500 mt-1">
          Discover similar content
        </p>

      </div>

      {/* GRID */}
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-3
          gap-6
        "
      >

        {mods.map((mod) => (

          <Link
            key={mod.id}
            href={`/mods/${mod.id}`}
            className="
              group
              rounded-3xl
              overflow-hidden
              border
              border-zinc-800
              bg-zinc-900/60
              backdrop-blur-xl
              transition-all
              duration-300
              hover:border-zinc-700
              hover:-translate-y-1
            "
          >

            {/* IMAGE */}
            <div className="relative overflow-hidden">

              <img
                src={mod.image}
                alt={mod.title}
                className="
                  w-full
                  h-52
                  object-cover
                  transition-transform
                  duration-500
                  group-hover:scale-[1.03]
                "
              />

              {/* OVERLAY */}
              <div
                className="
                  absolute
                  inset-0
                  bg-gradient-to-t
                  from-black/70
                  via-transparent
                  to-transparent
                "
              />

              {/* VERIFIED */}
              {mod.verified && (
                <div
                  className="
                    absolute
                    top-4
                    right-4
                    bg-blue-600
                    text-white
                    text-xs
                    px-3
                    py-1.5
                    rounded-xl
                    font-medium
                  "
                >
                  ✔ Verified
                </div>
              )}

            </div>

            {/* CONTENT */}
            <div className="p-5">

              <h3
                className="
                  text-xl
                  font-semibold
                  line-clamp-1
                  group-hover:text-purple-300
                  transition
                "
              >
                {mod.title}
              </h3>

              <p className="text-zinc-500 text-sm mt-2">
                {mod.category || "Mod"}
              </p>

              <div className="flex gap-3 flex-wrap mt-5">

                <div
                  className="
                    px-3
                    py-1.5
                    rounded-xl
                    border
                    border-zinc-800
                    bg-black/30
                    text-xs
                    text-zinc-300
                  "
                >
                  ⬇ {mod.downloads ?? 0}
                </div>

                <div
                  className="
                    px-3
                    py-1.5
                    rounded-xl
                    border
                    border-zinc-800
                    bg-black/30
                    text-xs
                    text-zinc-300
                  "
                >
                  ❤️ {mod.likes ?? 0}
                </div>

              </div>

            </div>

          </Link>

        ))}

      </div>

    </section>
  );
}