import Link from "next/link";

export default function NavbarLogo() {

  return (

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

  );

}