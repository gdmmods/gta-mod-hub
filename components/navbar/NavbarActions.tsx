import Link from "next/link";

import NavbarSearch from "@/components/navbar/NavbarSearch";

import UserMenu from "@/components/UserMenu";

export default function NavbarActions() {

  return (

    <div className="flex items-center gap-4">

      {/* SEARCH */}
      <NavbarSearch />

      {/* UPLOAD */}
      <Link
        href="/upload"
        className="
          hidden
          md:flex

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

      {/* DESKTOP USER */}
      <div className="hidden lg:block">
        <UserMenu />
      </div>

    </div>

  );

}