import Link from "next/link";

import DownloadButton from "@/components/DownloadButton";
import LikeButton from "@/components/LikeButton";
import FavoriteModButton from "@/components/FavoriteModButton";

import ModMetaGrid from "./ModMetaGrid";

export default function ModSidebar({
  mod,
  creators,
  favoritesCount,
  images,
}: any) {

  return (
    <div
      className="
        overflow-hidden
        rounded-[30px]
        border
        border-zinc-900
        bg-gradient-to-b
        from-zinc-950/95
        to-black/80
        backdrop-blur-2xl
      "
    >

      {/* TOP STRIP */}
      <div
        className="
          border-b
          border-zinc-900
          bg-gradient-to-r
          from-purple-500/5
          via-transparent
          to-pink-500/5
          px-5
          py-3
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
              text-[11px]
              uppercase
              tracking-[0.25em]
              text-zinc-500
            "
          >

            <div
              className="
                h-2
                w-2
                rounded-full
                bg-emerald-400
              "
            />

            Active Mod

          </div>

          {mod.verified && (

            <div
              className="
                rounded-xl
                bg-blue-600
                px-3
                py-1
                text-[11px]
                font-medium
                text-white
              "
            >
              ✔ Verified
            </div>

          )}

        </div>

      </div>

      {/* CONTENT */}
      <div className="p-5">

        {/* TITLE */}
        <div>

          <h1
            className="
              text-3xl
              xl:text-[38px]
              font-black
              leading-[0.95]
              tracking-tight
              text-white
            "
          >
            {mod.title}
          </h1>

          {/* CREATORS */}
          <div
            className="
              mt-4
              text-sm
              text-zinc-500
            "
          >

            by{" "}

            {creators.length ? (

              creators.map(
                (
                  creator: any,
                  i: number
                ) => (

                  <span key={creator.id}>

                    <Link
                      href={`/creator/${creator.id}`}
                      className="
                        text-purple-400
                        transition
                        hover:text-purple-300
                      "
                    >
                      {creator.name}
                    </Link>

                    {i <
                      creators.length - 1 &&
                      " • "}

                  </span>

                )
              )

            ) : (
              "Unknown"
            )}

          </div>

        </div>

        {/* STATS */}
        <div
          className="
            mt-6
            grid
            grid-cols-3
            gap-3
          "
        >

          <div
            className="
              rounded-2xl
              border
              border-zinc-800
              bg-black/40
              p-3
            "
          >

            <div className="text-xs text-zinc-500">
              Downloads
            </div>

            <div
              className="
                mt-1
                text-lg
                font-bold
                text-white
              "
            >
              {mod.downloads ?? 0}
            </div>

          </div>

          <div
            className="
              rounded-2xl
              border
              border-zinc-800
              bg-black/40
              p-3
            "
          >

            <div className="text-xs text-zinc-500">
              Likes
            </div>

            <div
              className="
                mt-1
                text-lg
                font-bold
                text-pink-400
              "
            >
              {mod.likes ?? 0}
            </div>

          </div>

          <div
            className="
              rounded-2xl
              border
              border-zinc-800
              bg-black/40
              p-3
            "
          >

            <div className="text-xs text-zinc-500">
              Favorites
            </div>

            <div
              className="
                mt-1
                text-lg
                font-bold
                text-white
              "
            >
              {favoritesCount}
            </div>

          </div>

        </div>

        {/* META */}
        <div className="mt-6">

          <ModMetaGrid
            mod={mod}
            creators={creators}
            images={images}
          />

        </div>

        {/* ACTIONS */}
        <div className="mt-6 space-y-3">

          <DownloadButton
            url={mod.source_url}
            id={mod.id}
          />

          <div
            className="
              grid
              grid-cols-2
              gap-3
            "
          >

            <LikeButton
              id={mod.id}
              initialLikes={mod.likes ?? 0}
            />

            <FavoriteModButton
              modId={mod.id}
              initialCount={
                favoritesCount
              }
            />

          </div>

          <a
            href={mod.source_url}
            target="_blank"
            className="
              flex
              w-full
              items-center
              justify-center
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-900/80
              py-3
              text-sm
              text-zinc-300
              transition-all
              duration-300
              hover:border-zinc-700
              hover:bg-zinc-800
              hover:text-white
            "
          >
            Visit Source
          </a>

        </div>

      </div>

    </div>
  );
}