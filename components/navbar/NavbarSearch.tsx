import Link from "next/link";

export default function NavbarSearch() {

  return (

    <Link
      href="/search"
      className="
        hidden
        md:flex

        items-center
        gap-2

        rounded-2xl

        border
        border-zinc-800

        bg-zinc-950

        px-5
        py-2.5

        text-sm
        text-zinc-400

        hover:text-white
        hover:border-zinc-700

        transition
      "
    >
      Search mods, creators...
    </Link>

  );

}