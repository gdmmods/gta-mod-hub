import Link from "next/link";

export default function DashboardRoadmapPreview() {

  return (

    <div
      className="
        mb-10
        rounded-3xl
        border
        border-zinc-800
        bg-zinc-900/50
        p-6
      "
    >

      <p
        className="
          text-[10px]
          uppercase
          tracking-[0.22em]
          text-purple-400
        "
      >
        Roadmap Preview
      </p>

      <h2
        className="
          mt-2
          text-2xl
          font-bold
        "
      >
        What's Coming Next
      </h2>

      <div
        className="
          mt-6
          grid
          md:grid-cols-2
          gap-3
          text-sm
        "
      >

        <div className="text-green-400">
          ✓ Multi-Creator Profiles
        </div>

        <div className="text-green-400">
          ✓ Creator Dashboard
        </div>

        <div className="text-green-400">
          ✓ Creator Context System
        </div>

        <div className="text-zinc-400">
          ◌ Team Management
        </div>

        <div className="text-zinc-400">
          ◌ Creator Analytics
        </div>

        <div className="text-zinc-400">
          ◌ Reach Tracking
        </div>

        <div className="text-zinc-400">
          ◌ Trust & Reputation
        </div>

        <div className="text-zinc-400">
          ◌ Community Challenges
        </div>

      </div>

      <Link
        href="/roadmap"
        className="
          inline-block
          mt-6
          text-purple-400
          hover:text-purple-300
          transition
        "
      >
        View Full Roadmap →
      </Link>

    </div>

  );

}