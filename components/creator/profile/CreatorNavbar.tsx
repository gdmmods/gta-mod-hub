import Link from "next/link";

interface CreatorNavbarProps {
  creatorId: string;
}

export default function CreatorNavbar({
  creatorId,
}: CreatorNavbarProps) {

  return (

    <div
      className="
        relative
        z-20
        border-b
        border-zinc-900
        backdrop-blur-xl
        bg-black/50
      "
    >

      <div
        className="
          max-w-[1500px]
          mx-auto
          px-6
          py-5
          flex
          justify-between
          items-center
        "
      >

        <Link
          href="/"
          className="
            text-2xl
            font-black
            tracking-tight
          "
        >
          <span className="text-purple-500">
            M
          </span>{" "}
          ModVault
        </Link>

        <Link
          href={`/creator/edit/${creatorId}`}
          className="
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-950
            hover:bg-zinc-900
            transition
            px-5
            py-2.5
            text-sm
            text-zinc-300
          "
        >
          Edit Profile
        </Link>

      </div>

    </div>

  );

}