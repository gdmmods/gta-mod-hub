"use client";

export default function StatsBar({
  downloads,
  likes,
  rating,
}: {
  downloads?: number;
  likes?: number;
  rating?: number;
}) {
  return (
    <div className="flex gap-6 mt-4 text-sm text-gray-400">

      {/* DOWNLOADS */}
      <div className="flex items-center gap-2">
        <span className="text-green-400">⬇</span>
        <span>{downloads ?? 0}</span>
        <span>Downloads</span>
      </div>

      {/* LIKES */}
      <div className="flex items-center gap-2">
        <span className="text-pink-400">❤</span>
        <span>{likes ?? 0}</span>
        <span>Likes</span>
      </div>

      {/* RATING */}
      <div className="flex items-center gap-2">
        <span className="text-yellow-400">★</span>
        <span>{rating ?? "N/A"}</span>
        <span>Rating</span>
      </div>

    </div>
  );
}