"use client";

type Props = {
  id: string;
  likes: number;
  source_url: string;
  onLike: () => void;
  onDownload: () => void; // ✅ new
};

export default function HoverActions({
  likes,
  onLike,
  onDownload,
}: Props) {
  return (
    <div className="flex gap-3">

      {/* LIKE */}
      <button
        onClick={onLike}
        className="bg-pink-600/90 hover:bg-pink-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
      >
        ❤️ {likes}
      </button>

      {/* DOWNLOAD */}
      <button
        onClick={onDownload}
        className="bg-white/90 hover:bg-white text-black px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
      >
        ⬇ Download
      </button>

    </div>
  );
}