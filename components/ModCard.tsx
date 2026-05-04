"use client";

import Link from "next/link";
import HoverActions from "./HoverActionsClient";
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

  mod_creators?: {
    creators: Creator;
  }[];

  creator?: string; // legacy fallback
};

export default function ModCard({
  mod,
  likes,
  downloads,
  onLike,
  onOpen,
  onDownload,
  showCreator = true,
}: {
  mod: Mod;
  likes: number;
  downloads: number;
  onLike: () => void;
  onOpen: () => void;
  onDownload: () => void;
  showCreator?: boolean;
}) {
  const creators = getCreators(mod);

  return (
    <div className="group bg-neutral-900 rounded-xl overflow-hidden hover:-translate-y-1 transition">

      {/* IMAGE */}
      <div
        className="relative cursor-pointer"
        onClick={onOpen}
      >
        <img
          src={mod.image || "/placeholder.jpg"}
          className="w-full h-36 object-cover group-hover:scale-[1.03] transition"
          alt={mod.title}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        {/* HOVER */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
          <div onClick={(e) => e.stopPropagation()}>
            <HoverActions
              id={mod.id}
              likes={likes}
              source_url={mod.source_url || "#"}
              onLike={onLike}
              onDownload={onDownload}
            />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-3">
        <Link href={mod.id ? `/mods/${mod.id}` : "#"}>
          <h2 className="text-sm font-semibold line-clamp-2 hover:underline">
            {mod.title}
          </h2>

          {/* STATS */}
          <div className="flex gap-3 text-xs mt-1">
            <span className="text-pink-500">❤️ {likes}</span>
            <span className="text-blue-400">⬇ {downloads}</span>
          </div>
        </Link>

        {/* CREATORS */}
        {showCreator && (
          <p className="text-xs text-gray-400 mt-1">
            by{" "}
            {creators.length > 0 ? (
              creators.map((c, i) => {
                const isLegacy = c.id.startsWith("legacy-");

                return (
                  <span key={c.id || `${c.name}-${i}`}>
                    <Link
                      href={isLegacy ? "#" : `/creator/${c.id}`}
                      className="text-purple-400 hover:underline"
                      onClick={(e) => {
                        if (isLegacy) e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      {c.name || "Unknown"}
                    </Link>
                    {i < creators.length - 1 && " • "}
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