import Link from "next/link";

export default function PermissionDenied() {

  return (

    <main
      className="
        min-h-screen
        bg-black
        text-white
        flex
        items-center
        justify-center
        px-6
      "
    >

      <div
        className="
          max-w-lg
          text-center
        "
      >

        <p
          className="
            text-red-400
            text-sm
            tracking-[0.2em]
            mb-4
          "
        >
          ACCESS DENIED
        </p>

        <h1
          className="
            text-4xl
            font-bold
            mb-6
          "
        >
          You do not have permission
          to access this mod.
        </h1>

        <p
          className="
            text-gray-400
            leading-relaxed
            mb-8
          "
        >
          This mod is not connected
          to one of your approved
          creator profiles.
        </p>

        <Link
          href="/dashboard"
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
          Return to Dashboard
        </Link>

      </div>

    </main>

  );

}