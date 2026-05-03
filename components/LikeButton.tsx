"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  initialLikes: number;
};

export default function LikeButton({ id, initialLikes }: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (liked) return; // 👈 block multiple clicks

    setLiked(true);
    setLikes((prev) => prev + 1); // optimistic update

    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        // rollback
        setLikes((prev) => prev - 1);
        setLiked(false);
      } else {
        router.refresh(); // sync with DB
      }
    } catch {
      // rollback on error
      setLikes((prev) => prev - 1);
      setLiked(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={liked}
      className="text-pink-500 border border-pink-500 px-4 py-2 rounded-lg cursor-pointer hover:bg-pink-500/10 transition disabled:opacity-50"
    >
      ❤️ {likes}
    </button>
  );
}