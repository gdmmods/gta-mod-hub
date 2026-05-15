import Link from "next/link";

export default function DashboardEmptyState() {

  return (

    <div
      className="
        border
        border-zinc-800
        rounded-3xl
        p-12
        bg-zinc-900/60
        text-center
      "
    >

      <h2
        className="
          text-3xl
          font-bold
          mb-4
        "
      >
        No uploads yet.
      </h2>

      <p
        className="
          text-gray-400
          mb-8
          max-w-xl
          mx-auto
        "
      >
        Start building your creator
        presence by publishing your
        first mod.
      </p>

      <Link
        href="/upload"
        className="
          inline-flex
          items-center
          justify-center
          px-6
          py-4
          rounded-xl
          bg-purple-600
          hover:bg-purple-500
          transition
          font-medium
        "
      >
        Upload Your First Mod
      </Link>

    </div>

  );

}