"use client";

import Link from "next/link";

import { usePathname }
from "next/navigation";

import NavbarDropdown
from "./NavbarDropdown";

const browseItems = [

  {
    label: "Mods",
    href: "/",
  },

  {
    label: "Trending",
    href: "/?sort=likes",
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

export default function NavbarLinks() {

  const pathname =
    usePathname();

  function linkClass(
    href: string
  ) {

    return `

      transition

      ${
        pathname === href
          ? `
            text-white
          `
          : `
            text-zinc-400
            hover:text-white
          `
      }

    `;

  }

  return (

    <nav
      className="
        hidden
        lg:flex
        items-center
        gap-8
        text-sm
      "
    >

    </nav>

  );

}