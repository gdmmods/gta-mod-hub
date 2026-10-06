"use client";

interface Props {
  url?: string | null;
}

export default function CreatorBackupButton({
  url,
}: Props) {
  if (!url) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="
        w-full
        flex
        items-center
        justify-center
        gap-2
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900/80
        py-3.5
        text-sm
        font-medium
        text-zinc-300
        hover:bg-zinc-800
        hover:border-zinc-700
        hover:text-white
        transition
      "
    >
      <span className="text-purple-400">↗</span>
      Creator Backup
    </a>
  );
}