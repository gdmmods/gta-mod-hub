"use client";

import Link from "next/link";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type Item = {

  label: string;
  href: string;

};

type Props = {

  label: string;
  items: Item[];

};

export default function NavbarDropdown({
  label,
  items,
}: Props) {

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

  return (

    <div
      ref={ref}
      className="relative"
    >

      {/* BUTTON */}
      <button
        onClick={() =>
          setOpen(!open)
        }
        className="
          flex
          items-center
          gap-2
          text-sm
          text-zinc-400
          hover:text-white
          transition
        "
      >

        {label}

        <span
          className={`
            text-xs
            transition-transform

            ${
              open
                ? "rotate-180"
                : ""
            }
          `}
        >
          ▼
        </span>

      </button>

      {/* MENU */}
      {open && (

        <div
          className="
            absolute
            top-full
            left-0
            mt-4
            w-64

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

          {items.map((item) => (

            <Link
              key={item.href}
              href={item.href}
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
              {item.label}
            </Link>

          ))}

        </div>

      )}

    </div>

  );

}