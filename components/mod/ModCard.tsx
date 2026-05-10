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
      ? "h-[260px]"
      : variant === "compact"
      ? "h-32"
      : "h-[220px]";

  return (
    <div
      className="
        group
        relative
        h-full
        min-h-[460px]
        flex
        flex-col
        overflow-hidden
        rounded-[32px]
        border
        border-zinc-900
        bg-gradient-to-b
        from-[#0d0d0f]
        via-black
        to-black
        transition-all
        duration-500
        hover:-translate-y-2
        hover:border-purple-500/30
        hover:shadow-[0_0_60px_rgba(168,85,247,0.18)]
      "
    >

      {/* BACK GLOW */}
      <div
        className="
          absolute
          inset-0
          opacity-0
          group-hover:opacity-100
          transition-opacity
          duration-500
          pointer-events-none
        "
      >

        <div
          className="
            absolute
            -top-24
            left-1/2
            -translate-x-1/2
            w-[300px]
            h-[200px]
            bg-purple-500/10
            blur-[80px]
          "
        />

      </div>

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
              group-hover:scale-[1.06]
            `}
          />

          {/* OVERLAY */}
          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-black
              via-black/10
              to-transparent
            "
          />

          {/* TOP BAR */}
          <div
            className="
              absolute
              top-4
              left-4
              right-4
              flex
              items-center
              justify-between
            "
          >

            {/* CATEGORY */}
            {mod.category ? (
              <div
                className="
                  rounded-full
                  border
                  border-white/10
                  bg-black/50
                  backdrop-blur-xl
                  px-3
                  py-1
                  text-[10px]
                  uppercase
                  tracking-[0.18em]
                  text-zinc-300
                "
              >
                {mod.category}
              </div>
            ) : (
              <div />
            )}

            {/* VERIFIED */}
            {mod.verified && (
              <div
                className="
                  rounded-full
                  border
                  border-cyan-400/20
                  bg-cyan-500/10
                  backdrop-blur-xl
                  px-3
                  py-1
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.16em]
                  text-cyan-300
                "
              >
                Verified
              </div>
            )}

          </div>

          {/* CENTER ACTIONS */}
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
              bg-black/40
              backdrop-blur-[2px]
            "
          >

            <div
              className="
                translate-y-5
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

          {/* BOTTOM FADE */}
          <div
            className="
              absolute
              bottom-0
              left-0
              right-0
              h-32
              bg-gradient-to-t
              from-black
              to-transparent
            "
          />

        </div>

      </Link>

      {/* CONTENT */}
      <div
        className="
          relative
          flex
          flex-1
          flex-col
          px-5
          pb-5
          pt-4
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
              text-[24px]
              font-bold
              leading-tight
              line-clamp-2
              text-white
              transition-colors
              duration-300
              group-hover:text-purple-300
            "
          >
            {mod.title}
          </h2>

        </Link>

        {/* SUBTEXT */}
        <p
          className="
            mt-3
            text-sm
            leading-relaxed
            text-zinc-500
            line-clamp-2
          "
        >
          Premium GTA V modification built
          for immersive gameplay, enhanced
          visuals and optimized performance.
        </p>

        {/* STATS */}
        <div
          className="
            mt-5
            flex
            items-center
            gap-3
            flex-wrap
          "
        >

          <div
            className="
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-950
              px-3
              py-2
              text-sm
              text-pink-400
            "
          >
            ❤️ {likes}
          </div>

          <div
            className="
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-950
              px-3
              py-2
              text-sm
              text-blue-400
            "
          >
            ⬇ {downloads}
          </div>

        </div>

        {/* PUSH DOWN */}
        <div className="flex-1" />

        {/* CREATOR */}
        {showCreator && (
          <div
            className="
              mt-6
              pt-5
              border-t
              border-zinc-900
            "
          >

            <div
              className="
                text-[11px]
                uppercase
                tracking-[0.18em]
                text-zinc-600
                mb-2
              "
            >
              Creator
            </div>

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
                text-sm
              "
            >

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
                        (
                          <span className="text-zinc-700 mx-2">
                            •
                          </span>
                        )}

                    </span>
                  );
                })

              ) : (

                <span className="text-zinc-500">
                  Unknown
                </span>

              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
}