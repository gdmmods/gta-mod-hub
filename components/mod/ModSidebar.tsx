import Link from "next/link";

import DownloadButton from "@/components/DownloadButton";
import LikeButton from "@/components/LikeButton";
import FavoriteModButton from "@/components/FavoriteModButton";
import ProtectedDownloadButton from "@/components/mod/ProtectedDownloadButton";
import PremiumBadge from "@/components/mod/PremiumBadge";

export default function ModSidebar({
  mod,
  creators,
  favoritesCount,
}: any) {

  return (
    <div
      className="
        flex
        flex-col
        justify-between
        rounded-[30px]
        border
        border-zinc-900
        bg-zinc-950/85
        backdrop-blur-2xl
        p-5
        min-h-[620px]
        h-full
      "
    >

      {/* TOP CONTENT */}
      <div>

        {/* HEADER */}
        <div
          className="
            flex
            items-start
            justify-between
            gap-3
          "
        >

          <div className="min-w-0">

            <div
              className="
                flex
                items-center
                gap-2
                text-[11px]
                uppercase
                tracking-[0.3em]
                text-zinc-500
                mb-4
              "
            >

              <div className="w-2 h-2 rounded-full bg-emerald-400" />

              Active Mod

            </div>

            <h1
              className="
  text-[25px]
  md:text-[20px]
  xl:text-[32px]
  font-black
  leading-[0.95]
  tracking-[-0.03em]
  break-words
"
            >
              {mod.title}
            </h1>

          </div>

          {mod.verified && (

            <div
              className="
                shrink-0
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

          )}

        </div>

        {/* PREMIUM STATUS */}
        <div className="mt-5">

          <PremiumBadge
            visibility={mod.visibility}
            isPaid={mod.is_paid}
          />

        </div>

        {/* CREATORS */}
        <div
          className="
            mt-5
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
                      hover:text-purple-300
                      transition
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

        {/* STATS */}
        <div
          className="
            grid
            grid-cols-3
            gap-3
            mt-7
          "
        >

          <div
            className="
              rounded-2xl
              border
              border-zinc-900
              bg-black/40
              p-4
            "
          >

            <p
              className="
                text-xs
                text-zinc-500
              "
            >
              Downloads
            </p>

            <p
              className="
                text-3xl
                font-bold
                mt-2
              "
            >
              {mod.downloads ?? 0}
            </p>

          </div>

          <div
            className="
              rounded-2xl
              border
              border-zinc-900
              bg-black/40
              p-4
            "
          >

            <p
              className="
                text-xs
                text-zinc-500
              "
            >
              Likes
            </p>

            <p
              className="
                text-3xl
                font-bold
                mt-2
                text-pink-500
              "
            >
              {mod.likes ?? 0}
            </p>

          </div>

          <div
            className="
              rounded-2xl
              border
              border-zinc-900
              bg-black/40
              p-4
            "
          >

            <p
              className="
                text-xs
                text-zinc-500
              "
            >
              Favorites
            </p>

            <p
              className="
                text-3xl
                font-bold
                mt-2
              "
            >
              {favoritesCount}
            </p>

          </div>

        </div>

      </div>

      {/* ACTIONS */}
      <div className="mt-8 space-y-3">

        {/* --------------------------------
   DOWNLOAD / ACCESS
-------------------------------- */}

{mod.protected_file ? (

  <ProtectedDownloadButton
    modId={mod.id}
  />

) : mod.external_purchase_url ? (

  <a
    href={
      mod.external_purchase_url
    }
    target="_blank"
    className="
      w-full
      flex
      justify-center
      items-center

      rounded-2xl

      bg-gradient-to-r
      from-purple-600
      to-purple-500

      py-4

      font-semibold
      text-white

      shadow-[0_0_40px_rgba(168,85,247,0.25)]

      hover:opacity-90
      transition
    "
  >
    Get Premium Access
  </a>

) : (

  <DownloadButton
    url={
      mod.download_url ||
      mod.source_url
    }
    id={mod.id}
  />

)}

{/* SUPPORT CREATOR */}
{mod.support_url && (

  <a
    href={mod.support_url}
    target="_blank"
    className="
      w-full
      flex
      justify-center
      items-center

      rounded-2xl

      border
      border-purple-500/20

      bg-purple-500/10

      hover:bg-purple-500/20

      transition

      py-3

      text-sm
      font-medium

      text-purple-300
    "
  >
    Support Creator
  </a>

)}

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
            border-zinc-800
            bg-zinc-900
            hover:bg-zinc-800
            transition
            py-3
            text-sm
            text-zinc-300
          "
        >
          Visit Source
        </a>

      </div>

    </div>
  );
}