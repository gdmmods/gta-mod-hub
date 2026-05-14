import { ReactNode } from "react";

interface CreatorPageShellProps {
  children: ReactNode;
}

export default function CreatorPageShell({
  children,
}: CreatorPageShellProps) {

  return (

    <main
      className="
        min-h-screen
        bg-black
        text-white
        overflow-hidden
      "
    >

      {/* BACKGROUND */}
      <div
        className="
          absolute
          inset-0
          pointer-events-none
          overflow-hidden
        "
      >

        <div
          className="
            absolute
            top-0
            left-1/2
            -translate-x-1/2
            w-[1000px]
            h-[500px]
            bg-purple-600/10
            blur-[180px]
          "
        />

      </div>

      {children}

    </main>

  );

}