"use client";

import Link from "next/link";

export default function CreatorOverviewActions() {
  return (
    <div
      className="
        flex
        flex-wrap
        items-center
        gap-3
        mt-6
      "
    >

      <Link
        href="/connect-platforms"
        className="
          px-4
          py-2
          rounded-lg
          border
          border-zinc-700
          hover:bg-zinc-800
          text-sm
          transition
        "
      >
        Connect Platforms
      </Link>

      <Link
        href="/discover-mods"
        className="
          px-4
          py-2
          rounded-lg
          bg-purple-600
          hover:bg-purple-500
          text-sm
          transition
        "
      >
        Discover Mods
      </Link>

    </div>
  );
}