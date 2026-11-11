import RatingChannels from "@/components/ratings/RatingChannels";
import Link from "next/link";

type FeaturedMod = {
  id: string;
  title: string;
  image: string;
  likes: number | null;
  downloads: number | null;
};

interface CreatorFeaturedModProps {
  mostDownloaded: FeaturedMod | null;
  mostLiked: FeaturedMod | null;
  emptyMessage?: string;
}

export default function CreatorFeaturedMod({
  mostDownloaded,
  mostLiked,
  emptyMessage,
}: CreatorFeaturedModProps) {

  if (!mostDownloaded && !mostLiked) {
    return (
      <section className="mx-auto mt-8 max-w-[1450px] px-6">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-purple-400">Highlight</p>
          <h2 className="mt-2 text-3xl font-bold">Featured Creations</h2>
        </div>
        <p className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center text-sm text-zinc-400">
          {emptyMessage ?? "No published mods are available to feature yet."}
        </p>
      </section>
    );
  }

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
        {!mostDownloaded ? (
          <div className="relative h-[340px] overflow-hidden rounded-[34px] border border-zinc-800 bg-zinc-950">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-zinc-900/40" />
            <div className="absolute inset-0 flex flex-col justify-end p-8">
              <p className="mb-4 text-sm uppercase tracking-[0.2em] text-purple-300">Most Downloaded</p>
              <h3 className="text-2xl font-black leading-tight">External download counts unavailable</h3>
              <p className="mt-3 text-sm text-zinc-400">No reliable platform count is available to rank this card.</p>
            </div>
          </div>
        ) : (
        <div className="relative"
        >
          <Link href={`/mods/${mostDownloaded?.id}`} aria-label={mostDownloaded?.title} className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-400" />

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
                {mostDownloaded?.id && <RatingChannels modId={mostDownloaded.id} />}

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

        </div>
        )}

        {/* MOST LIKED */}
        <div className="relative"
        >
          <Link href={`/mods/${mostLiked?.id}`} aria-label={mostLiked?.title} className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-400" />

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
                {mostLiked?.id && <RatingChannels modId={mostLiked.id} />}

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

                {typeof mostLiked?.downloads === "number" ? <span>⬇ {mostLiked.downloads}</span> : <span className="text-xs text-zinc-400">External downloads unavailable</span>}

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>

  );

}
