"use client";

import Link from "next/link";
import HoverActions from "./HoverActionsClient";

type Mod = {
  id: string;
  title: string;
  image: string;
  creator?: string;
  likes?: number;
  downloads?: number;
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

  // ✅ ADD THIS
  const handleDownload = async () => {
    console.log("DOWNLOAD CLICKED", mod.id);

    try {
      await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: mod.id }),
      });
    } catch (e) {
      console.error("Download tracking failed");
    }

    if (mod.source_url) {
      window.open(mod.source_url, "_blank", "noopener,noreferrer");
    }
  };

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

        {/* 🔥 FIXED: removed pointer-events-none */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
          <div
            onClick={(e) => e.stopPropagation()}
          >
            <HoverActions
              id={mod.id}
              likes={likes}
              source_url={mod.source_url || "#"}
              onLike={onLike}
              onDownload={handleDownload} // ✅ THIS WAS MISSING
            />
          </div>
        </div>
      </div>

      <div className="p-3">
        <Link href={mod.id ? `/mods/${mod.id}` : "#"}>
          <h2 className="text-sm font-semibold line-clamp-2 hover:underline">
            {mod.title}
          </h2>

          <div className="flex gap-3 text-xs mt-1">
            <span className="text-pink-500">❤️ {likes}</span>
            <span className="text-blue-400">⬇ {mod.downloads ?? 0}</span>
          </div>
        </Link>

        {showCreator && (
          <p className="text-xs text-gray-400 mt-1">
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