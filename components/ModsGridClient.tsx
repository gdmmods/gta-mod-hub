"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ModCard from "./ModCard";

type Mod = {
  id: string;
  title: string;
  image: string;
  creator?: string;
  category?: string;
  description?: string;
  likes?: number;
  source_url?: string;
};

export default function ModsGridClient({ mods }: { mods: Mod[] }) {

console.log("GRID MODS:", mods);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const touchStartX = useRef<number | null>(null);

  const selectedMod =
    selectedIndex !== null ? mods[selectedIndex] : null;

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
      likesMap[id] ?? mods.find((m) => m.id === id)?.likes ?? 0;

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

  return (
    <>
      {/* GRID */}
      <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {mods
  .filter((mod) => mod.id) // 🔥 prevent invalid navigation
  .map((mod, index) => {
    const likes = likesMap[mod.id] ?? mod.likes ?? 0;

    return (
      <ModCard
        key={mod.id}
        mod={mod}
        likes={likes}
        onLike={() => handleLike(mod.id)}
        onOpen={() => setSelectedIndex(index)}
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
            {/* CLOSE */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            {/* IMAGE */}
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

            <p className="text-sm text-gray-400 mt-1">
              {selectedMod.category || "Unknown"} •{" "}
              <Link
                href={`/creator/${encodeURIComponent(
                  selectedMod.creator || ""
                )}`}
                className="text-purple-400 hover:underline"
              >
                {selectedMod.creator || "Unknown"}
              </Link>
            </p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => handleLike(selectedMod.id)}
                className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                ❤️ {likesMap[selectedMod.id] ?? selectedMod.likes ?? 0}
              </button>

              <a
                href={selectedMod.source_url || "#"}
                target="_blank"
                className="bg-white text-black px-4 py-2 rounded-lg text-sm"
              >
                ⬇ Download
              </a>

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