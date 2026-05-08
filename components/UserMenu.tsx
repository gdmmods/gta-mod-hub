"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function UserMenu() {
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  /* CLOSE ON OUTSIDE CLICK */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <div
      ref={menuRef}
      className="relative"
    >

      {/* BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="
          text-white
          hover:text-pink-400
          transition
          text-sm
        "
      >
        Account
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="
            absolute
            right-0
            mt-3
            w-56
            bg-zinc-900/95
            backdrop-blur-xl
            border
            border-zinc-800
            rounded-2xl
            overflow-hidden
            shadow-2xl
            z-50
          "
        >

          <Link
            href="/favorites"
            className="
              flex items-center gap-3
              px-4 py-3
              hover:bg-zinc-800
              transition
              text-sm
            "
            onClick={() => setOpen(false)}
          >
            ❤️ Favorites
          </Link>

          <Link
            href="/upload"
            className="
              flex items-center gap-3
              px-4 py-3
              hover:bg-zinc-800
              transition
              text-sm
            "
            onClick={() => setOpen(false)}
          >
            ⬆ Upload Mod
          </Link>

          <div className="h-px bg-zinc-800" />

          <Link
            href="/roadmap"
            className="
              flex items-center gap-3
              px-4 py-3
              hover:bg-zinc-800
              transition
              text-sm
            "
            onClick={() => setOpen(false)}
          >
            🗺 Roadmap
          </Link>

          <Link
            href="/about"
            className="
              flex items-center gap-3
              px-4 py-3
              hover:bg-zinc-800
              transition
              text-sm
            "
            onClick={() => setOpen(false)}
          >
            ℹ About
          </Link>

        </div>
      )}
    </div>
  );
}