import Link from "next/link";
import { roadmap } from "@/lib/roadmap";

const phaseColors: Record<string, string> = {
  complete:
    "from-purple-500/20 to-purple-700/10 border-purple-500/30",
  "in-progress":
    "from-blue-500/20 to-blue-700/10 border-blue-500/30",
  planned:
    "from-zinc-700/30 to-zinc-800/10 border-zinc-700",
};

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-black text-white">

      {/* NAV */}
      <div className="flex justify-between items-center px-10 py-6 border-b border-zinc-800">

        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
        >
          <span className="text-purple-500">M</span> ModVault
        </Link>

        <div className="flex gap-6 text-sm text-gray-400">

          <Link href="/" className="hover:text-white transition">
            Mods
          </Link>

          <Link
            href="/creators"
            className="hover:text-white transition"
          >
            Creators
          </Link>

          <Link
            href="/about"
            className="hover:text-white transition"
          >
            About
          </Link>

          <Link
            href="/roadmap"
            className="text-white"
          >
            Roadmap
          </Link>
        </div>
      </div>

      {/* HERO */}
      <div className="max-w-[1400px] mx-auto px-6 mt-16 flex flex-col lg:flex-row justify-between gap-12 items-start">

        <div className="max-w-2xl">

          <p className="text-purple-400 text-sm mb-3 tracking-[0.2em]">
            PLATFORM ROADMAP
          </p>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Building the future of{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              GTA mod discovery
            </span>
          </h1>

          <p className="text-gray-400 mt-6 text-lg leading-relaxed">
            ModVault is evolving into a premium creator-first
            ecosystem focused on immersive presentation,
            discovery systems, creator identity, and
            long-term platform scalability.
          </p>

          <div className="flex gap-4 mt-8 flex-wrap">

            <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-xl">
              <p className="text-sm text-gray-400">
                Current Stage
              </p>

              <p className="font-semibold mt-1">
                Discovery Expansion
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-xl">
              <p className="text-sm text-gray-400">
                Latest Upgrade
              </p>

              <p className="font-semibold mt-1">
                Interactive Mod Pages
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-xl">
              <p className="text-sm text-gray-400">
                Focus
              </p>

              <p className="font-semibold mt-1">
                Retention & Ecosystem
              </p>
            </div>

          </div>
        </div>

        {/* MISSION PANEL */}
        <div className="w-full lg:w-[360px] bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-3xl p-7 shadow-2xl">

          <p className="text-sm text-purple-400 tracking-wide mb-2">
            🚩 OUR MISSION
          </p>

          <h2 className="text-2xl font-bold leading-tight">
            A platform worthy of the creators behind the mods.
          </h2>

          <p className="text-gray-400 text-sm mt-4 leading-relaxed">
            ModVault aims to replace outdated browsing
            experiences with a cleaner, faster, more
            immersive ecosystem centered around creators,
            discovery, and premium presentation.
          </p>

          <div className="mt-6 border-t border-zinc-700 pt-5">

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                Development Status
              </span>

              <span className="text-blue-400">
                Active
              </span>
            </div>

            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-400">
                Platform Version
              </span>

              <span>0.4 Alpha</span>
            </div>

          </div>
        </div>
      </div>

      {/* FIRST ROW */}
      <div className="max-w-[1400px] mx-auto px-6 mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {roadmap.slice(0, 4).map((phase, i) => (
          <div
            key={i}
            className={`relative p-6 rounded-3xl border bg-gradient-to-br ${phaseColors[phase.status]} backdrop-blur-xl shadow-lg hover:scale-[1.02] transition duration-300`}
          >

            {phase.status === "in-progress" && (
              <div className="absolute top-4 right-4 text-[10px] bg-blue-600 px-2 py-1 rounded-full font-semibold tracking-wide">
                CURRENT
              </div>
            )}

            {phase.status === "complete" && (
              <div className="absolute top-4 right-4 text-[10px] bg-purple-600 px-2 py-1 rounded-full font-semibold tracking-wide">
                COMPLETE
              </div>
            )}

            <p className="text-xs tracking-wide text-gray-400">
              {phase.phase}
            </p>

            <h2 className="text-xl font-semibold mt-2">
              {phase.title}
            </h2>

            <ul className="mt-5 space-y-3 text-sm">
              {phase.items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 text-gray-300"
                >
                  <span className="text-purple-400 mt-[1px]">
                    •
                  </span>

                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">

                <div
                  className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  style={{
                    width: `${phase.progress}%`,
                  }}
                />
              </div>

              <p className="text-xs text-right mt-2 text-gray-400">
                {phase.progress}% complete
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* TIMELINE */}
      <div className="max-w-[1400px] mx-auto px-6 mt-16 relative">

        <div className="h-[2px] bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-zinc-700 w-full relative rounded-full">

          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-purple-500 rounded-full shadow-[0_0_20px_#a855f7]" />

          <div className="absolute left-1/3 top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]" />

          <div className="absolute left-2/3 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />

          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-500 rounded-full" />
        </div>

        <div className="flex justify-between mt-3 text-xs text-gray-500">
          <span>Foundation</span>
          <span>Creator Systems</span>
          <span className="text-blue-400">
            Interactive Expansion
          </span>
          <span>Future Ecosystem</span>
        </div>
      </div>

      {/* SECOND ROW */}
      <div className="max-w-[1400px] mx-auto px-6 mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

        {roadmap.slice(4).map((phase, i) => (
          <div
            key={i}
            className="p-5 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black shadow-md hover:scale-[1.02] transition duration-300"
          >

            <p className="text-xs text-gray-500 tracking-wide">
              {phase.phase}
            </p>

            <h2 className="text-lg font-semibold mt-2">
              {phase.title}
            </h2>

            <ul className="mt-5 space-y-3 text-sm">
              {phase.items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 text-gray-400"
                >
                  <span className="text-zinc-500">
                    ○
                  </span>

                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* DEV NOTES */}
      <div className="max-w-[1400px] mx-auto px-6 mt-20">

        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8">

          <p className="text-sm text-purple-400 tracking-wide mb-3">
            DEVLOG SNAPSHOT
          </p>

          <h2 className="text-3xl font-bold">
            Latest Development Session
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mt-8">

            <div>
              <p className="text-white font-semibold">
                Interactive Mod Architecture
              </p>

              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                Refactored monolithic mod pages into
                reusable modular components including
                hero sections, sidebars, tabs, meta grids,
                quick tags, and scalable page systems.
              </p>
            </div>

            <div>
              <p className="text-white font-semibold">
                Immersive Media Experience
              </p>

              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                Added fullscreen gallery lightbox,
                keyboard navigation, thumbnail interactions,
                hover effects, hidden scrollbars, and
                modernized media presentation systems.
              </p>
            </div>

            <div>
              <p className="text-white font-semibold">
                Discovery & Retention Systems
              </p>

              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                Introduced interactive tabs and
                related mods browsing to improve
                discovery flow, browsing continuity,
                session depth, and overall platform retention.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-[1400px] mx-auto px-6 mt-16 pb-20">

        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700 p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">

          <div>
            <p className="text-xl font-semibold">
              Built for Long-Term Growth
            </p>

            <p className="text-gray-400 text-sm mt-2">
              Every system added to ModVault is designed
              to strengthen creator identity, discovery,
              immersion, and long-term ecosystem growth.
            </p>
          </div>

          <button className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl transition font-medium shadow-lg shadow-purple-900/30">
            Follow Development →
          </button>
        </div>

        <p className="text-center text-gray-600 text-sm mt-8">
          💜 Thank you for supporting the journey.
        </p>
      </div>
    </main>
  );
}