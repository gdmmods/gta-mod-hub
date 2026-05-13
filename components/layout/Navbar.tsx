import Link from "next/link";
import UserMenu from "@/components/UserMenu";

export default function Navbar() {
  return (
    <header
      className="
        sticky
        top-0
        z-50
        border-b
        border-zinc-900
        bg-black/70
        backdrop-blur-2xl
      "
    >
      <div
        className="
          max-w-[1600px]
          mx-auto
          px-6
          h-[74px]
          flex
          items-center
          justify-between
        "
      >

        {/* LEFT */}
        <div className="flex items-center gap-10">

          {/* LOGO */}
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div
              className="
                text-4xl
                font-black
                leading-none
                bg-gradient-to-br
                from-purple-400
                to-purple-700
                bg-clip-text
                text-transparent
              "
            >
              M
            </div>

            <div
              className="
                text-2xl
                font-bold
                tracking-tight
              "
            >
              MODVAULT
            </div>
          </Link>

          {/* NAV LINKS */}
          <nav
            className="
              hidden
              lg:flex
              items-center
              gap-8
              text-sm
            "
          >
            <Link
              href="/"
              className="
                text-zinc-400
                hover:text-white
                transition
              "
            >
              Mods
            </Link>

            <Link
              href="/creators"
              className="
                text-zinc-400
                hover:text-white
                transition
              "
            >
              Creators
            </Link>

            <Link
              href="/?sort=likes"
              className="
                text-zinc-400
                hover:text-white
                transition
              "
            >
              Trending
            </Link>

            <Link
              href="/roadmap"
              className="
                text-zinc-400
                hover:text-white
                transition
              "
            >
              Roadmap
            </Link>

            <Link
              href="/about"
              className="
                text-zinc-400
                hover:text-white
                transition
              "
            >
              About
            </Link>
          </nav>

        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">

          <button
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
            "
          >
            Search mods, creators...
          </button>

          <Link
            href="/upload"
            className="
              rounded-2xl
              bg-gradient-to-r
              from-purple-600
              to-purple-500
              px-5
              py-2.5
              text-sm
              font-medium
              shadow-[0_0_30px_rgba(168,85,247,0.35)]
              hover:scale-[1.03]
              transition
            "
          >
            Upload Mod
          </Link>

          <UserMenu />

        </div>

      </div>
    </header>
  );
}