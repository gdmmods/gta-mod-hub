import Link from "next/link";
import { roadmap } from "@/lib/roadmap";

const phaseColors: Record<string, string> = {
  complete: "from-purple-500/20 to-purple-700/10 border-purple-500/30",
  "in-progress": "from-blue-500/20 to-blue-700/10 border-blue-500/30",
  planned: "from-zinc-700/30 to-zinc-800/10 border-zinc-700",
};

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-black text-white">

      {/* NAV */}
      <div className="flex justify-between items-center px-10 py-6 border-b border-zinc-800">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-purple-500">M</span> ModVault
        </Link>

        <div className="flex gap-6 text-sm text-gray-400">
          <Link href="/">Mods</Link>
          <Link href="/creators">Creators</Link>
          <Link href="/roadmap" className="text-white">Roadmap</Link>
        </div>
      </div>

      {/* HERO */}
      <div className="max-w-[1400px] mx-auto px-6 mt-14 flex flex-col md:flex-row justify-between gap-10 items-start">

        <div>
          <p className="text-purple-400 text-sm mb-2 tracking-wide">
            ROADMAP
          </p>

          <h1 className="text-5xl font-bold leading-tight">
            The Future of{" "}
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              ModVault
            </span>
          </h1>

          <p className="text-gray-400 mt-4 max-w-lg">
            We're building ModVault with the community.
            Every feature here is a step toward a better mod ecosystem.
          </p>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-6 rounded-2xl w-full md:w-[320px] shadow-xl">
          <p className="text-sm font-semibold mb-2">🚩 Our Mission</p>
          <p className="text-gray-400 text-sm">
            Build the best GTA mod platform — curated, fast, and creator-first.
          </p>
        </div>
      </div>

      {/* FIRST ROW */}
      <div className="max-w-[1400px] mx-auto px-6 mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {roadmap.slice(0, 4).map((phase, i) => (
          <div
            key={i}
            className={`relative p-5 rounded-2xl border bg-gradient-to-br ${phaseColors[phase.status]} backdrop-blur-xl shadow-lg hover:scale-[1.02] transition`}
          >
            {phase.status === "in-progress" && (
              <div className="absolute top-3 right-3 text-xs bg-purple-600 px-2 py-1 rounded-full">
                CURRENT
              </div>
            )}

            <p className="text-xs text-gray-400">{phase.phase}</p>

            <h2 className="text-lg font-semibold mt-1">
              {phase.title}
            </h2>

            <ul className="mt-4 space-y-2 text-sm">
              {phase.items.map((item, idx) => (
                <li key={idx} className="flex gap-2 text-gray-300">
                  <span className="text-purple-400">•</span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <div className="w-full bg-black/40 h-2 rounded">
                <div
                  className="h-2 bg-gradient-to-r from-purple-500 to-purple-400 rounded"
                  style={{ width: `${phase.progress}%` }}
                />
              </div>

              <p className="text-xs text-right mt-1 text-gray-400">
                {phase.progress}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* TIMELINE */}
      <div className="max-w-[1400px] mx-auto px-6 mt-12 relative">
        <div className="h-[2px] bg-gradient-to-r from-purple-500/40 via-zinc-700 to-zinc-700 w-full relative rounded">

          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]" />
          <div className="absolute left-1/3 top-1/2 -translate-y-1/2 w-3 h-3 bg-zinc-500 rounded-full" />
          <div className="absolute left-2/3 top-1/2 -translate-y-1/2 w-3 h-3 bg-zinc-500 rounded-full" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-zinc-500 rounded-full" />
        </div>

        <p className="text-xs text-purple-400 mt-2">NOW</p>
      </div>

      {/* SECOND ROW — FULL WIDTH FIX */}
      <div className="max-w-[1400px] mx-auto px-6 mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {roadmap.slice(4).map((phase, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black shadow-md hover:scale-[1.02] transition"
          >
            <p className="text-xs text-gray-400">{phase.phase}</p>

            <h2 className="text-base font-semibold mt-1">
              {phase.title}
            </h2>

            <ul className="mt-4 space-y-2 text-sm">
              {phase.items.map((item, idx) => (
                <li key={idx} className="flex gap-2 text-gray-400">
                  <span>○</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="max-w-[1400px] mx-auto px-6 mt-16">
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
          <div>
            <p className="font-semibold">Built Together</p>
            <p className="text-gray-400 text-sm">
              Your feedback shapes what we build next.
            </p>
          </div>

          <button className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-lg transition">
            Join the Journey →
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          💜 Thank you for being part of ModVault.
        </p>
      </div>
    </main>
  );
}