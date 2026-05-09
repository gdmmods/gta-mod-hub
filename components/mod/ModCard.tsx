"use client";

import Link from "next/link";

import HoverActions from "../HoverActionsClient";
import { getCreators } from "@/lib/getCreators";

type Creator = {
  id: string;
  name: string;
};

type Mod = {
  id: string;
  title: string;
  image: string;
  source_url?: string;

  verified?: boolean;
  category?: string;

  mod_creators?: {
    creators: Creator;
  }[];

  creator?: string;
};

export default function ModCard({
  mod,
  likes,
  downloads,
  onLike,
  onOpen,
  onDownload,
  showCreator = true,
  variant = "default",
}: {
  mod: Mod;
  likes: number;
  downloads: number;

  onLike?: () => void;
  onOpen?: () => void;
  onDownload?: () => void;

  showCreator?: boolean;

  variant?:
    | "default"
    | "compact"
    | "featured";
}) {

  const creators = getCreators(mod);

  const imageHeight =
    variant === "featured"
      ? "h-52"
      : variant === "compact"
      ? "h-28"
      : "h-36";

  return (
    <div
      className="
        group
        relative
        bg-neutral-900
        rounded-2xl
        overflow-hidden
        border
        border-zinc-800
        hover:border-pink-500/40
        hover:-translate-y-1
        hover:shadow-[0_0_25px_rgba(236,72,153,0.15)]
        transition-all
        duration-300
      "
    >

      {/* IMAGE */}
      <div
        className="relative cursor-pointer overflow-hidden"
        onClick={onOpen || undefined}
      >

        <img
          src={
            mod.image ||
            "/placeholder.jpg"
          }
          className={`
            w-full
            ${imageHeight}
            object-cover
            group-hover:scale-[1.03]
            transition-transform
            duration-500
          `}
          alt={mod.title}
        />

        {/* OVERLAY */}
        <div
          className="
            absolute
            inset-0
            opacity-0
            group-hover:opacity-100
            transition
            duration-500
            pointer-events-none
            bg-gradient-to-br
            from-pink-500/5
            via-transparent
            to-purple-500/5
          "
        />

        {/* VERIFIED */}
        {mod.verified && (
          <div
            className="
              absolute
              top-3
              right-3
              bg-blue-600
              text-white
              text-[10px]
              px-2.5
              py-1
              rounded-lg
              font-medium
              shadow-lg
            "
          >
            ✔ Verified
          </div>
        )}

        {/* HOVER ACTIONS */}
        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
            bg-black/40
            opacity-0
            group-hover:opacity-100
            transition
          "
        >

          <div
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <HoverActions
              id={mod.id}
              likes={likes}
              source_url={
                mod.source_url || "#"
              }
              onLike={
                onLike || (() => {})
              }
              onDownload={
                onDownload || (() => {})
              }
            />
          </div>

        </div>

      </div>

      {/* CONTENT */}
      <div className="p-4">

        <Link
          href={
            mod.id
              ? `/mods/${mod.id}`
              : "#"
          }
        >

          {/* TITLE */}
          <h2
            className="
              text-sm
              font-semibold
              line-clamp-2
              hover:text-purple-300
              transition
            "
          >
            {mod.title}
          </h2>

          {/* STATS */}
          <div className="flex gap-3 text-xs mt-3">

            <span className="text-pink-500">
              ❤️ {likes}
            </span>

            <span className="text-blue-400">
              ⬇ {downloads}
            </span>

          </div>

          {/* CATEGORY */}
          {mod.category && (
            <div className="mt-3">

              <span
                className="
                  text-[10px]
                  px-2
                  py-1
                  rounded-full
                  border
                  border-zinc-700
                  text-zinc-400
                  bg-black/30
                "
              >
                {mod.category}
              </span>

            </div>
          )}

        </Link>

        {/* CREATORS */}
        {showCreator && (
          <p className="text-xs text-gray-400 mt-3">

            by{" "}

            {creators.length > 0 ? (

              creators.map((c, i) => {

                const isLegacy =
                  c.id.startsWith(
                    "legacy-"
                  );

                return (
                  <span
                    key={
                      c.id ||
                      `${c.name}-${i}`
                    }
                  >

                    <Link
                      href={
                        isLegacy
                          ? "#"
                          : `/creator/${c.id}`
                      }
                      className="
                        text-purple-400
                        hover:underline
                      "
                      onClick={(e) => {

                        if (isLegacy) {
                          e.preventDefault();
                        }

                        e.stopPropagation();

                      }}
                    >
                      {c.name ||
                        "Unknown"}
                    </Link>

                    {i <
                      creators.length -
                        1 &&
                      " • "}

                  </span>
                );
              })

            ) : (
              "Unknown"
            )}

          </p>
        )}

      </div>

    </div>
  );
}