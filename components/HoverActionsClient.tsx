"use client";

type Props = {
  id: string;
  likes: number;
  source_url: string;
  onLike?: () => void;
};

export default function HoverActions({
  likes,
  source_url,
  onLike,
}: Props) {
  return (
    <div className="flex items-center gap-2">

      {/* LIKE */}
      <button
        onClick={() => onLike?.()}
        className="flex items-center justify-center gap-1 h-9 px-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-sm transition active:scale-95"
      >
        ❤️ <span>{likes}</span>
      </button>

      {/* DOWNLOAD */}
      <a
        href={source_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center gap-1 h-9 px-3 bg-white text-black rounded-lg text-sm font-medium hover:opacity-90 transition"
      >
        ⬇ Download
      </a>

    </div>
  );
}