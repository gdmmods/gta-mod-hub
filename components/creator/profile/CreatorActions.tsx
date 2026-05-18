import Link from "next/link";

interface CreatorActionsProps {
  creatorId: string;
}

export default function CreatorActions({
  creatorId,
}: CreatorActionsProps) {

  return (

    <div
      className="
        mt-5
        w-full
        space-y-3
      "
    >

      {/* FOLLOW */}
      <button
        className="
          w-full
          rounded-2xl
          bg-gradient-to-r
          from-purple-600
          to-purple-500
          py-3
          font-semibold
          text-white
          shadow-[0_0_30px_rgba(168,85,247,0.22)]
          hover:opacity-90
          transition
        "
      >
        Follow Creator
      </button>

      {/* SUPPORT */}
      <button
        className="
          w-full
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-950/70
          py-3
          font-medium
          text-zinc-300
          hover:border-purple-500/30
          hover:text-white
          transition
          backdrop-blur-xl
        "
      >
        Support Creator
      </button>

      {/* EDIT PROFILE */}
      <Link
        href={`/dashboard/creator/${creatorId}/settings`}
        className="
          block
          w-full
          rounded-2xl
          border
          border-zinc-800
          bg-purple-600/20
          py-2.5
          text-center
          text-sm
          font-medium
          text-zinc-400
          hover:text-white
          hover:border-purple-500/30
          transition
        "
      >
        Edit Profile
      </Link>

      {/* CREATOR META */}
      <div
        className="
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-950/60
          px-4
          py-4
          backdrop-blur-xl
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
            text-sm
          "
        >

          <span className="text-zinc-500">
            Creator Tier
          </span>

          <span
            className="
              font-semibold
              text-purple-300
            "
          >
            Trusted
          </span>

        </div>

        <div
          className="
            mt-3
            flex
            items-center
            justify-between
            text-sm
          "
        >

          <span className="text-zinc-500">
            Member Since
          </span>

          <span className="text-zinc-300">
            2025
          </span>

        </div>

      </div>

    </div>

  );

}