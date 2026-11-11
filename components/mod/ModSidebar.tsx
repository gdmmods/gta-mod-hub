import Link from "next/link";

import LikeButton from "@/components/LikeButton";
import FavoriteModButton from "@/components/FavoriteModButton";
import ReleaseStatusBadge from "@/components/mod/ReleaseStatusBadge";
import DownloadButton from "@/components/DownloadButton";
import ModSourceButtons, { type ModAdditionalSource } from "@/components/mod/ModSourceButtons";

export default function ModSidebar({
  mod,
  creators,
  favoritesCount,
  sources,
  totalExternalDownloads,
  canEdit = false,
  clicks,
}: {
  mod: {
    id: string;
    title: string;
    verified?: string | boolean | null;
    visibility?: string;
    downloads?: number | null;
    likes?: number | null;
    download_url?: string | null;
    source_url?: string | null;
    creator_backup_url?: string | null;
  };
  creators: { id: string; name: string }[];
  favoritesCount?: number | null;
  sources: ModAdditionalSource[];
  totalExternalDownloads?: number | null;
  canEdit?: boolean;
  clicks?: number | null;
}) {

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

            <div className="flex flex-wrap items-start justify-between gap-3">
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
            {canEdit && (
              <Link
                href={`/dashboard/mods/${mod.id}/edit`}
                className="shrink-0 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-200 transition hover:border-purple-400/50 hover:bg-purple-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                aria-label={`Edit ${mod.title}`}
              >
                Edit
              </Link>
            )}
            </div>

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

        {/* RELEASE STATUS */}
        <div className="mt-5">
          <ReleaseStatusBadge
            visibility={mod.visibility}
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
                creator,
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
              Clicks
            </p>

            <p
              className="
                text-3xl
                font-bold
                mt-2
              "
            >
              {clicks ?? mod.downloads ?? 0}
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

        <div className="mt-3 rounded-2xl border border-purple-900/50 bg-purple-950/20 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-400">Total External Downloads</p>
            <p className="text-xl font-bold text-purple-200">
              {typeof totalExternalDownloads === "number" ? totalExternalDownloads.toLocaleString() : "—"}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-zinc-600">Combined counts from connected source pages</p>
        </div>

      </div>

      {/* DOWNLOAD */}

{(
  mod.visibility === "public" ||
  mod.visibility === "early_access"
) && (
  <div className="mt-4 space-y-3">

    {mod.download_url && (
      <DownloadButton
        url={mod.download_url}
        id={mod.id}
      />
    )}

  </div>
)}

      {/* COMMUNITY ACTIONS */}
      <div className="mt-8 space-y-3">

        {/* --------------------------------
            DOWNLOAD / ACCESS
          -------------------------------- */}


        <div className="grid grid-cols-2 gap-3">

          <LikeButton
            id={mod.id}
            initialLikes={mod.likes ?? 0}
          />

          <FavoriteModButton
            modId={mod.id}
            initialCount={
              favoritesCount ?? 0
            }
          />

        </div>

        {(mod.visibility === "public" || mod.visibility === "early_access") && (
          <ModSourceButtons
            modId={mod.id}
            primarySourceUrl={mod.source_url}
            creatorBackupUrl={mod.creator_backup_url}
            sources={sources}
          />
        )}

      </div>

    </div>
  );
}
