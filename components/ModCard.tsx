"use client";

import Link from "next/link";
import HoverActions from "./HoverActionsClient";

type Mod = {
  id: string;
  title: string;
  image: string;
  creator?: string;
  likes?: number;
  source_url?: string;
};

export default function ModCard({
  mod,
  likes,
  onLike,
  onOpen,
  showCreator = true,
}: {
  mod: Mod;
  likes: number;
  onLike: () => void;
  onOpen: () => void;
  showCreator?: boolean;
}) {

  return (
    <div className="group bg-neutral-900 rounded-xl overflow-hidden hover:-translate-y-1 transition">
      
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

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition pointer-events-none">
          <div
            className="pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <HoverActions
              id={mod.id}
              likes={likes}
              source_url={mod.source_url || "#"}
              onLike={onLike}
            />
          </div>
        </div>
      </div>

      <div className="p-3">
        <Link href={mod.id ? `/mods/${mod.id}` : "#"}>
          <h2 className="text-sm font-semibold line-clamp-2 hover:underline">
            {mod.title}
          </h2>
        </Link>

        {showCreator && (
          <p className="text-xs text-gray-400">
            by{" "}
            <Link
              href={`/creator/${encodeURIComponent(mod.creator || "Unknown")}`}
              className="text-purple-400 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {mod.creator || "Unknown"}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}