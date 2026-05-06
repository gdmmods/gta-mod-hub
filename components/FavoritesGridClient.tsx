"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Mod = {
  id: string;
  title: string;
  image: string;
  likes?: number;
  downloads?: number;
};

export default function FavoritesGridClient() {
  const [mods, setMods] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      try {
        const favoriteKeys = Object.keys(localStorage)
          .filter((key) => key.startsWith("favorite-"))
          .filter(
            (key) =>
              localStorage.getItem(key) === "true"
          );

        const ids = favoriteKeys.map((key) =>
          key.replace("favorite-", "")
        );

        if (ids.length === 0) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("mods")
          .select(`
            id,
            title,
            image,
            likes,
            downloads
          `)
          .in("id", ids);

        setMods(data || []);
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    }

    loadFavorites();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-gray-400">
        Loading favorites...
      </div>
    );
  }

  if (mods.length === 0) {
    return (
      <div className="p-10 text-gray-500">
        No favorites yet.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

      {mods.map((mod) => (
        <Link
          key={mod.id}
          href={`/mods/${mod.id}`}
          className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-pink-500 transition"
        >
          <img
            src={mod.image}
            alt={mod.title}
            className="w-full h-48 object-cover"
          />

          <div className="p-4">
            <h2 className="font-semibold line-clamp-2">
              {mod.title}
            </h2>

            <div className="flex gap-4 mt-3 text-sm text-gray-400">
              <span>❤️ {mod.likes || 0}</span>
              <span>⬇ {mod.downloads || 0}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}