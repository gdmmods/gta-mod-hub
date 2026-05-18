import Link from "next/link";

interface CreatorFeaturedModProps {
  mostDownloaded: any;
  mostLiked: any;
}

export default function CreatorFeaturedMod({
  mostDownloaded,
  mostLiked,
}: CreatorFeaturedModProps) {

  return (

    <section
      className="
        max-w-[1450px]
        mx-auto
        px-6
        mt-8
      "
    >

      <div className="mb-6">

        <p
          className="
            text-sm
            uppercase
            tracking-[0.2em]
            text-purple-400
          "
        >
          Highlight
        </p>

        <h2
          className="
            text-3xl
            font-bold
            mt-2
          "
        >
          Featured Creations
        </h2>

      </div>

      <div
        className="
          grid
          grid-cols-2
          gap-6
        "
      >

        {/* MOST DOWNLOADED */}
        <Link
          href={`/mods/${mostDownloaded?.id}`}
        >

          <div
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

            <img
              src={mostDownloaded?.image}
              alt={mostDownloaded?.title}
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
                via-black/55
                to-black/10
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
                {mostDownloaded?.title}
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
                  ⬇ {mostDownloaded?.downloads}
                </span>

                <span>
                  ❤️ {mostDownloaded?.likes}
                </span>

              </div>

            </div>

          </div>

        </Link>

        {/* MOST LIKED */}
        <Link
          href={`/mods/${mostLiked?.id}`}
        >

          <div
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

            <img
              src={mostLiked?.image}
              alt={mostLiked?.title}
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
                via-black/55
                to-black/10
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
                {mostLiked?.title}
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
                  ❤️ {mostLiked?.likes}
                </span>

                <span>
                  ⬇ {mostLiked?.downloads}
                </span>

              </div>

            </div>

          </div>

        </Link>

      </div>

    </section>

  );

}