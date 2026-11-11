import NavbarLogo from "@/components/navbar/NavbarLogo";
import NavbarLinks from "@/components/navbar/NavbarLinks";
import NavbarActions from "@/components/navbar/NavbarActions";
import NavbarMenu from "@/components/navbar/NavbarMenu";
import NotificationBell from "@/components/notifications/NotificationBell";
import CreatorProfileSwitcher from "@/components/navbar/CreatorProfileSwitcher";

export default function Navbar() {

  return (

    <div className="shrink-0" style={{ height: "var(--modvault-nav-height, 75px)" }}>
    <header style={{ height: "var(--modvault-nav-height, 75px)" }}
      className="
        fixed
        inset-x-0 top-0
        z-50
        border-b
        border-zinc-900
        bg-black
        shadow-[0_1px_0_rgba(255,255,255,0.03)]
        backdrop-blur-2xl
      "
    >

      <div
        className="
          max-w-[1600px]
          mx-auto
          px-3 sm:px-6
          h-full
          flex
          items-center
          justify-between
        "
      >

        {/* LEFT */}
      <div className="flex items-center gap-2 sm:gap-6">

        <NavbarMenu />

        <NavbarLogo />

        <NavbarLinks />

      </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <div className="flex items-center gap-1">
            <NavbarActions />
            <CreatorProfileSwitcher />
          </div>
        </div>
    </div>

    </header>
    </div>

  );

}