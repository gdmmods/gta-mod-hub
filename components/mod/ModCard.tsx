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
      ? "h-[190px]"
      : variant === "compact"
      ? "h-28"
      : "h-36";

  return (
    <div
      className="
        group
        relative
        h-full
        min-h-[390px]
        flex
        flex-col
        overflow-hidden
        rounded-[26px]
        border
        border-zinc-800
        bg-gradient-to-b
        from-zinc-900
        to-zinc-950
        transition-all
        duration-300
        hover:-translate-y-1.5
        hover:border-purple-500/40
        hover:shadow-[0_0_35px_rgba(168,85,247,0.18)]
      "
    >

      {/* IMAGE */}
      <Link
        href={
          mod.id
            ? `/mods/${mod.id}`
            : "#"
        }
      >

        <div
          className="
            relative
            overflow-hidden
            cursor-pointer
          "
          onClick={onOpen || undefined}
        >

          <img
            src={
              mod.image ||
              "/placeholder.jpg"
            }
            alt={mod.title}
            className={`
              w-full
              ${imageHeight}
              object-cover
              transition-transform
              duration-700
              group-hover:scale-[1.04]
            `}
          />

          {/* IMAGE OVERLAY */}
          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-black/50
              via-transparent
              to-black/10
            "
          />

          {/* VERIFIED */}
          {mod.verified && (
            <div
              className="
                absolute
                top-3
                right-3
                rounded-xl
                bg-blue-600
                px-3
                py-1
                text-[11px]
                font-medium
                text-white
                shadow-lg
                backdrop-blur-xl
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
              opacity-0
              group-hover:opacity-100
              transition-all
              duration-300
              bg-black/45
              backdrop-blur-[2px]
            "
          >

            <div
              className="
                translate-y-3
                group-hover:translate-y-0
                transition-transform
                duration-300
              "
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

      </Link>

      {/* CONTENT */}
      <div
        className="
          flex
          flex-1
          flex-col
          p-5
        "
      >

        {/* TITLE */}
        <Link
          href={
            mod.id
              ? `/mods/${mod.id}`
              : "#"
          }
        >

          <h2
            className="
              text-[20px]
              font-bold
              leading-snug
              line-clamp-2
              text-white
              transition-colors
              group-hover:text-purple-300
            "
          >
            {mod.title}
          </h2>

        </Link>

        {/* STATS */}
        <div
          className="
            flex
            items-center
            gap-4
            mt-4
            text-sm
          "
        >

          <span className="text-pink-500">
            ❤️ {likes}
          </span>

          <span className="text-blue-400">
            ⬇ {downloads}
          </span>

        </div>

        {/* CATEGORY */}
        {mod.category && (
          <div className="mt-4">

            <span
              className="
                inline-flex
                items-center
                rounded-full
                border
                border-zinc-700
                bg-black/30
                px-3
                py-1
                text-[11px]
                text-zinc-400
              "
            >
              {mod.category}
            </span>

          </div>
        )}

        {/* PUSH CREATOR DOWN */}
        <div className="flex-1" />

        {/* CREATORS */}
        {showCreator && (
          <div
            className="
              pt-5
              text-sm
              text-zinc-500
            "
          >

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
                        transition
                        hover:text-purple-300
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
                      creators.length - 1 &&
                      " • "}

                  </span>
                );
              })

            ) : (
              "Unknown"
            )}

          </div>
        )}

      </div>

    </div>
  );
}