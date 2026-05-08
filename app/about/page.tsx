import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* NAVBAR */}
      <div className="flex justify-between items-center px-10 py-6 border-b border-zinc-800">

        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
        >
          <span className="text-purple-500">M</span> ModVault
        </Link>

        <div className="flex gap-6 text-sm text-gray-400">

          <Link
            href="/"
            className="hover:text-white transition"
          >
            Mods
          </Link>

          <Link
            href="/creators"
            className="hover:text-white transition"
          >
            Creators
          </Link>

          <Link
            href="/roadmap"
            className="hover:text-white transition"
          >
            Roadmap
          </Link>

          <Link
            href="/about"
            className="text-white"
          >
            About
          </Link>

        </div>
      </div>

      {/* HERO */}
      <div className="max-w-5xl mx-auto px-6 pt-20">

        <p className="text-purple-400 text-sm tracking-[0.2em] mb-3">
          ABOUT MODVAULT
        </p>

        <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
          Built for creators.
          <br />
          Designed for discovery.
        </h1>

        <p className="mt-6 text-lg text-gray-400 max-w-3xl leading-relaxed">
          ModVault is a modern platform for discovering,
          sharing, and supporting high-quality GTA V mods.

          We believe creators deserve better visibility,
          cleaner presentation, and tools that respect
          their work.
        </p>
      </div>

      {/* FEATURE CARDS */}
      <div className="max-w-5xl mx-auto px-6 mt-16 grid md:grid-cols-3 gap-6">

        <div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 hover:border-purple-500/30 transition">

          <h2 className="text-lg font-semibold mb-3">
            Discovery First
          </h2>

          <p className="text-gray-400 text-sm leading-relaxed">
            Find standout mods faster through curated
            presentation, creator pages, trending systems,
            and better browsing tools.
          </p>
        </div>

        <div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 hover:border-purple-500/30 transition">

          <h2 className="text-lg font-semibold mb-3">
            Creator Focused
          </h2>

          <p className="text-gray-400 text-sm leading-relaxed">
            ModVault is being built to give creators
            stronger identity, better exposure,
            and eventually full creator tools.
          </p>
        </div>

        <div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 hover:border-purple-500/30 transition">

          <h2 className="text-lg font-semibold mb-3">
            Community Driven
          </h2>

          <p className="text-gray-400 text-sm leading-relaxed">
            The roadmap evolves with the platform.
            Every update pushes toward a cleaner,
            faster, and more curated ecosystem.
          </p>
        </div>

      </div>

      {/* QUOTE */}
      <div className="max-w-4xl mx-auto px-6 mt-24">

        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-12 text-center shadow-2xl">

          <p className="text-3xl font-semibold leading-relaxed tracking-tight">
            “Mods deserve a platform that feels as polished
            as the work creators put into them.”
          </p>

          <p className="text-gray-500 mt-8 text-sm tracking-wide">
            — ModVault
          </p>

        </div>
      </div>

      {/* PLATFORM INFO */}
      <div className="max-w-5xl mx-auto px-6 mt-20">

        <div className="border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">

          {/* TOP */}
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800">

            <div className="p-8 bg-zinc-950">

              <p className="text-sm text-gray-500 mb-2">
                Platform Status
              </p>

              <h3 className="text-2xl font-bold">
                Active Development
              </h3>

              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                ModVault is currently evolving rapidly with
                ongoing improvements focused on creator tools,
                discovery systems, and platform polish.
              </p>
            </div>

            <div className="p-8 bg-black">

              <p className="text-sm text-gray-500 mb-2">
                Focus
              </p>

              <h3 className="text-2xl font-bold">
                Quality Over Noise
              </h3>

              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                The goal is not to become another cluttered
                mod archive, but a curated ecosystem centered
                around presentation and discoverability.
              </p>
            </div>

            <div className="p-8 bg-zinc-950">

              <p className="text-sm text-gray-500 mb-2">
                Vision
              </p>

              <h3 className="text-2xl font-bold">
                Creator Economy
              </h3>

              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Future systems will support creator profiles,
                verification, analytics, collections,
                engagement metrics, and more.
              </p>
            </div>

          </div>

          {/* BOTTOM */}
          <div className="px-8 py-5 border-t border-zinc-800 bg-black flex flex-wrap gap-6 text-sm text-gray-500">

            <span>Next.js</span>
            <span>Supabase</span>
            <span>Modern UI Architecture</span>
            <span>Creator-Centric Platform</span>

          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center text-gray-600 text-sm mt-24 pb-10">
        Built with passion for the GTA modding community.
      </div>

    </main>
  );
}