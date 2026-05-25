"use client";

import Link from "next/link";

import {
  useEffect,
  useRef,
  useState,
} from "react";

export default function MobileMenu() {

  const [open, setOpen] =
    useState(false);

  const ref =
    useRef<HTMLDivElement>(null);

  /* -----------------------------
     OUTSIDE CLICK
  ----------------------------- */

  useEffect(() => {

    function handleClick(
      e: MouseEvent
    ) {

      if (
        ref.current &&
        !ref.current.contains(
          e.target as Node
        )
      ) {

        setOpen(false);

      }

    }

    document.addEventListener(
      "mousedown",
      handleClick
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleClick
      );

    };

  }, []);

  const links = [

    {
      label: "Mods",
      href: "/",
    },

    {
      label: "Creators",
      href: "/creators",
    },

    {
      label: "Trending",
      href: "/?sort=likes",
    },

{
      label: "Constitution",
      href: "/constitution",
    },

    {
      label: "Roadmap",
      href: "/roadmap",
    },

    {
      label: "About",
      href: "/about",
    },
    
  ];

  return (

    <div
      ref={ref}
      className="
        flex
        relative
        "
    >

      {/* BUTTON */}
      <button
        onClick={() =>
          setOpen(!open)
        }
        className="
          flex
          items-center
          justify-center

          w-11
          h-11

          rounded-xl

          border
          border-zinc-800

          bg-zinc-950

          text-white
        "
      >

        ☰

      </button>

      {/* PANEL */}
      {open && (

        <div
          className="
            absolute
            left-0
            top-full
            mt-6

            w-72

            rounded-2xl
            border
            border-zinc-800

            bg-zinc-950/95
            backdrop-blur-2xl

            overflow-hidden
            shadow-2xl

            z-50
          "
        >

          {links.map((link) => (

            <Link
              key={link.href}
              href={link.href}
              onClick={() =>
                setOpen(false)
              }
              className="
                flex
                items-center

                px-5
                py-4

                text-sm
                text-zinc-300

                hover:bg-zinc-900
                hover:text-white

                transition
              "
            >
              {link.label}
            </Link>

          ))}

        </div>

      )}

    </div>

  );

}