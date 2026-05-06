"use client";

import Link from "next/link";
import { useState } from "react";

export default function UserMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">

      {/* BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="text-white hover:text-pink-400 transition"
      >
        Account
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute right-0 mt-3 w-48 bg-zinc-900 border border-zinc-800 rounded-xl p-2 shadow-xl z-50">

          <Link
            href="/favorites"
            className="block px-3 py-2 rounded-lg hover:bg-zinc-800 transition"
          >
            Favorites
          </Link>

        </div>
      )}
    </div>
  );
}