"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ModCard from "./ModCard";
import { getCreators } from "@/lib/getCreators";

type Creator = {
  id: string;
  name: string;
};

type Mod = {
  id: string;
  title: string;
  image: string;
  creator?: string; // fallback only
  category?: string;
  description?: string;
  likes?: number;
  downloads?: number;
  source_url?: string;

  mod_creators?: {
    creators: Creator;
  }[];
};

export default function ModsGridClient({ mods }: { mods: Mod[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [downloadsMap, setDownloadsMap] = useState<Record<string, number>>({});
  const touchStartX = useRef<number | null>(null);

  const selectedMod =
    selectedIndex !== null ? mods[selectedIndex] : null;

  const selectedCreators = selectedMod
    ? getCreators(selectedMod)
    : [];

  /* ---------------- keyboard ---------------- */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;

      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex]);

  /* ---------------- scroll lock ---------------- */
  useEffect(() => {
    document.body.style.overflow =
      selectedIndex !== null ? "hidden" : "auto";
  }, [selectedIndex]);

  /* ---------------- navigation ---------------- */
  const goNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) =>
      prev !== null ? (prev + 1) % mods.length : 0
    );
  };

  const goPrev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) =>
      prev !== null ? (prev - 1 + mods.length) % mods.length : 0
    );
  };

  /* ---------------- swipe ---------------- */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const delta = e.changedTouches[0].clientX - touchStartX.current;

    if (delta > 60) goPrev();
    if (delta < -60) goNext();

    touchStartX.current = null;
  };

  /* ---------------- like ---------------- */
  const handleLike = async (id: string) => {
    const current =
      likesMap[id] !== undefined
        ? likesMap[id]
        : mods.find((m) => m.id === id)?.likes || 0;

    setLikesMap((prev) => ({
      ...prev,
      [id]: current + 1,
    }));

    try {
      await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      setLikesMap((prev) => ({
        ...prev,
        [id]: current,
      }));
    }
  };

  /* ---------------- download ---------------- */
  const handleDownload = async (id: string, source_url?: string) => {
    const current =
      downloadsMap[id] !== undefined
        ? downloadsMap[id]
        : mods.find((m) => m.id === id)?.downloads || 0;

    setDownloadsMap((prev) => ({
      ...prev,
      [id]: current + 1,
    }));

    try {
      await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
    } catch {
      setDownloadsMap((prev) => ({
        ...prev,
        [id]: current,
      }));
    }

    if (source_url) {
      window.open(source_url, "_blank", "noopener,noreferrer");
    }
  };

  /* ---------------- live modal values ---------------- */
  const selectedLikes =
    selectedMod
      ? likesMap[selectedMod.id] !== undefined
        ? likesMap[selectedMod.id]
        : selectedMod.likes || 0
      : 0;

  const selectedDownloads =
    selectedMod
      ? downloadsMap[selectedMod.id] !== undefined
        ? downloadsMap[selectedMod.id]
        : selectedMod.downloads || 0
      : 0;

  return (
    <>
      {/* GRID */}
      <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {mods
          .filter((mod) => mod && mod.id)
          .map((mod, index) => {
            const likes =
              likesMap[mod.id] !== undefined
                ? likesMap[mod.id]
                : mod.likes || 0;

            const downloads =
              downloadsMap[mod.id] !== undefined
                ? downloadsMap[mod.id]
                : mod.downloads || 0;

            return (
              <ModCard
                key={`${mod.id}-${downloads}`}
                mod={mod}
                likes={likes}
                downloads={downloads}
                onLike={() => handleLike(mod.id)}
                onOpen={() => setSelectedIndex(index)}
                onDownload={() =>
                  handleDownload(mod.id, mod.source_url)
                }
              />
            );
          })}
      </div>

      {/* MODAL */}
      {selectedMod && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="bg-neutral-900 rounded-xl max-w-lg w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <div className="relative mb-4">
              <img
                src={selectedMod.image}
                className="w-full rounded-lg"
              />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 w-10 h-10 rounded-full text-white"
              >
                ←
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 w-10 h-10 rounded-full text-white"
              >
                →
              </button>
            </div>

            <h2 className="text-lg font-semibold">
              {selectedMod.title}
            </h2>

            {/* ✅ FIXED MULTI-CREATORS */}
            <p className="text-sm text-gray-400 mt-1">
              {selectedMod.category || "Unknown"} •{" "}
              {selectedCreators.map((name, i) => (
                <span key={name}>
                  <Link
                    href={`/creator/${encodeURIComponent(name)}`}
                    className="text-purple-400 hover:underline"
                  >
                    {name}
                  </Link>
                  {i < selectedCreators.length - 1 && " • "}
                </span>
              ))}
            </p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => handleLike(selectedMod.id)}
                className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                ❤️ {selectedLikes}
              </button>

              <button
                onClick={() =>
                  handleDownload(
                    selectedMod.id,
                    selectedMod.source_url
                  )
                }
                className="bg-white text-black px-4 py-2 rounded-lg text-sm"
              >
                ⬇ {selectedDownloads}
              </button>

              <Link
                href={`/mods/${selectedMod.id}`}
                className="bg-neutral-800 text-white px-4 py-2 rounded-lg text-sm"
              >
                Open Page
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}