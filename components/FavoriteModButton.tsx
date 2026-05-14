"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Props = {
  modId: string;
  initialCount: number;
};

export default function FavoriteModButton({
  modId,
  initialCount,
}: Props) {
  const [count, setCount] = useState(initialCount);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`favorite-${modId}`);

    if (saved === "true") {
      setFavorited(true);
    }
  }, [modId]);

  async function handleFavorite() {
    if (favorited) return;

    const { error } = await supabase
      .from("favorites")
      .insert({
        mod_id: modId,
      });

    if (!error) {
      setCount((prev) => prev + 1);
      setFavorited(true);

      localStorage.setItem(
        `favorite-${modId}`,
        "true"
      );
    }
  }

  return (
    <button
      onClick={handleFavorite}
      disabled={favorited}
      className={`
        px-5 py-2 rounded-lg transition
        border
        ${
          favorited
            ? "bg-pink-500 border-pink-500 text-white"
            : "border-pink-500 text-pink-400 hover:bg-pink-500 hover:text-white"
        }
      `}
    >
      {favorited
        ? `❤ Favorited (${count})`
        : `❤ Favorite (${count})`}
    </button>
  );
}