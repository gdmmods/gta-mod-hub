import NavbarLogo from "@/components/navbar/NavbarLogo";
import NavbarLinks from "@/components/navbar/NavbarLinks";
import NavbarActions from "@/components/navbar/NavbarActions";
import NavbarMenu from "@/components/navbar/NavbarMenu";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Navbar() {

  return (

    <header
      className="
        sticky
        top-0
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
          px-6
          h-[74px]
          flex
          items-center
          justify-between
        "
      >

        {/* LEFT */}
      <div className="flex items-center gap-6">

        <NavbarMenu />

        <NavbarLogo />

        <NavbarLinks />

      </div>

        {/* RIGHT */}
        <NotificationBell unreadCount={5} />

        <NavbarActions />

      </div>

    </header>

  );

}