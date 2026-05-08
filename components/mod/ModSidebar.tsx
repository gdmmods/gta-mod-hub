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
    <>
      {/* MAIN SIDEBAR */}
      <div
        className="
          rounded-3xl
          border
          border-zinc-800
          bg-zinc-900/70
          backdrop-blur-2xl
          p-8
        "
      >

        {/* TITLE */}
        <div className="flex items-start justify-between gap-4">

          <h1 className="text-5xl font-black leading-[1.05] tracking-tight">
            {mod.title}
          </h1>

          {mod.verified && (
            <div className="shrink-0">

              <div
                className="
                  px-3
                  py-1.5
                  rounded-xl
                  bg-blue-600
                  text-white
                  text-xs
                  font-medium
                "
              >
                ✔ Verified
              </div>

            </div>
          )}

        </div>

        {/* CREATORS */}
        <div className="mt-5 text-lg text-zinc-400">

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
                    className="text-purple-400 hover:text-purple-300 transition"
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

        {/* STATS */}
        <div className="flex flex-wrap gap-3 mt-7">

          <div className="px-4 py-2 rounded-xl border border-zinc-800 bg-black/40 text-sm text-zinc-300">
            ⬇ {mod.downloads ?? 0} downloads
          </div>

          <div className="px-4 py-2 rounded-xl border border-zinc-800 bg-black/40 text-sm text-zinc-300">
            ❤️ {mod.likes ?? 0} likes
          </div>

          <div className="px-4 py-2 rounded-xl border border-zinc-800 bg-black/40 text-sm text-zinc-300">
            ❤ {favoritesCount} favorites
          </div>

        </div>

        {/* META GRID */}
        <ModMetaGrid
          mod={mod}
          creators={creators}
          images={images}
        />

        {/* ACTIONS */}
        <div className="mt-8 space-y-4">

          <DownloadButton
            url={mod.source_url}
            id={mod.id}
          />

          <div className="grid grid-cols-2 gap-3">

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
              w-full
              flex
              justify-center
              items-center
              rounded-2xl
              border
              border-zinc-700
              bg-zinc-900
              hover:bg-zinc-800
              transition
              py-4
              text-zinc-300
            "
          >
            Visit Source
          </a>

        </div>

      </div>
    </>
  );
}