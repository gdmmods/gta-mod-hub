import Navbar from "@/components/layout/Navbar";
import ConstitutionSignSection from "@/components/constitution/ConstitutionSignSection";
import ConstitutionSignatureWall from "@/components/constitution/ConstitutionSignatureWall";

export default function ModvaultConstitutionPage() {
  const principles = [
    {
      title: "Creator Sovereignty",
      text: "Creators retain ownership over their work, identity, and external ecosystems. Modvault exists to amplify creators — not absorb them.",
    },
    {
      title: "Transparency Over Manipulation",
      text: "No deceptive algorithms. No hidden pay-to-win visibility systems. Discovery should reward quality, trust, originality, and community value.",
    },
    {
      title: "Preservation of Modding Culture",
      text: "Mods are digital craftsmanship. Modvault exists to preserve experimentation, collaboration, creativity, and modding history.",
    },
    {
      title: "Respect for Attribution",
      text: "Credit matters. Derivative work should acknowledge origins where applicable. Reuploads without attribution damage the ecosystem.",
    },
    {
      title: "Trust Is Earned",
      text: "Verification is based on integrity, consistency, contribution, and reputation — not popularity alone.",
    },
    {
      title: "Community Before Extraction",
      text: "The platform should never become hostile to creators through predatory monetization, suppression, or excessive platform greed.",
    },
    {
      title: "Open Evolution",
      text: "Modvault evolves publicly. Systems may change, but foundational principles remain transparent and accessible.",
    },
    {
      title: "Human Creativity Remains Central",
      text: "AI may assist creation, but human craftsmanship, identity, and originality remain core values of the platform.",
    },
    {
      title: "Principle of Historical Continuity",
      text: "Meaningful contributions should be remembered. The platform exists not only to host creative work, but to preserve the history of how that work, its collaborators, and its community evolved over time.",
    },
  ];

  return (
    
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_45%)]" />

      <Navbar />

      <section className="relative max-w-6xl mx-auto px-6 py-24">
        <div className="mb-20 text-center">
          <p className="text-sm tracking-[0.35em] uppercase text-purple-400 mb-5">
            Foundational Framework
          </p>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8">
            The Modvault
            <span className="block bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
              Constitution
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-zinc-400 text-lg leading-relaxed">
            A public declaration of the principles guiding Modvault’s culture,
            creator ecosystem, and long-term direction.
          </p>
        </div>

        {/* ======================================
                THE FOUR PILLARS
            ====================================== */}

            <section className="mb-24">

              <div className="text-center mb-14">

                <p className="text-sm uppercase tracking-[0.35em] text-purple-400 mb-4">
                  Foundation
                </p>

                <h2 className="text-4xl md:text-5xl font-black mb-6">
                  The Four Pillars
                </h2>

                <p className="max-w-3xl mx-auto text-zinc-400 leading-relaxed">
                  These pillars express the enduring values of ModVault. Every article of
                  this Constitution exists to reinforce one or more of these principles.
                  Together, they define who we are, why ModVault exists, and the
                  responsibility we carry as stewards of creative history.
                </p>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                <div className="rounded-[30px] border border-zinc-800 bg-zinc-950/70 p-8">

                  <div className="text-4xl mb-5">🏛</div>

                  <h3 className="text-2xl font-black mb-4">
                    Preservation
                  </h3>

                  <p className="text-zinc-400 leading-relaxed">
                    Safeguarding creative work, knowledge, and digital history so future
                    generations can learn from and build upon the past.
                  </p>

                </div>

                <div className="rounded-[30px] border border-zinc-800 bg-zinc-950/70 p-8">

                  <div className="text-4xl mb-5">🤝</div>

                  <h3 className="text-2xl font-black mb-4">
                    Collaboration
                  </h3>

                  <p className="text-zinc-400 leading-relaxed">
                    Empowering creators to work together through shared teams,
                    transparent attribution, mentorship, and collective achievement.
                  </p>

                </div>

                <div className="rounded-[30px] border border-zinc-800 bg-zinc-950/70 p-8">

                  <div className="text-4xl mb-5">🪪</div>

                  <h3 className="text-2xl font-black mb-4">
                    Attribution
                  </h3>

                  <p className="text-zinc-400 leading-relaxed">
                    Ensuring every meaningful contribution is recognized, traceable,
                    and permanently connected to those who made it possible.
                  </p>

                </div>

                <div className="rounded-[30px] border border-zinc-800 bg-zinc-950/70 p-8">

                  <div className="text-4xl mb-5">👁</div>

                  <h3 className="text-2xl font-black mb-4">
                    Awareness
                  </h3>

                  <p className="text-zinc-400 leading-relaxed">
                    Helping creators understand how their community evolves through
                    meaningful activity, historical continuity, and shared knowledge—
                    without demanding constant attention or disrupting the creative
                    process.
                  </p>

                </div>

              </div>

            </section>

            <section className="mb-24">

              <div className="rounded-[36px] border border-purple-500/20 bg-zinc-950/60 backdrop-blur-xl p-10">

                <h2 className="text-3xl font-black text-center mb-8">
                  The Cycle of Stewardship
                </h2>

                <p className="text-zinc-400 text-center max-w-3xl mx-auto leading-relaxed mb-10">
                  These four pillars are not independent values. Together they form a
                  continuous cycle that preserves, strengthens, and grows the creative
                  ecosystem.
                </p>

                <pre className="text-center text-purple-300 text-lg leading-8 whitespace-pre-wrap">
            {`          🏛 Preservation
                            ▲
                            │
                            │
                              👁 Awareness ◄────────► 🪪 Attribution
                            │
                            │
                            ▼
                      🤝 Collaboration`}
                </pre>

              </div>

            </section>

          {/* ======================================
                The Constitution Articles
            ====================================== */}

            <div className="text-center mb-12">

              <p className="text-sm uppercase tracking-[0.35em] text-purple-400 mb-4">
                Principles in Practice
              </p>

              <h2 className="text-4xl font-black">
                Constitution of ModVault
              </h2>

              <p className="text-zinc-400 max-w-2xl mx-auto mt-5">
                The Articles describe how ModVault applies its four pillars through
                governance, platform design, and community stewardship.
              </p>

            </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          {principles.map((item, index) => (
            <div
              key={item.title}
              className="group relative rounded-[32px] border border-zinc-800 bg-zinc-950/70 backdrop-blur-xl p-8 transition duration-300 hover:border-purple-500/40 hover:-translate-y-1"
            >
              <div className="absolute inset-0 rounded-[32px] opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.12),transparent_70%)]" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                    Article {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="h-3 w-3 rounded-full bg-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.8)]" />
                </div>

                <h2 className="text-2xl font-black mb-4 leading-tight">
                  {item.title}
                </h2>

                <p className="text-zinc-400 leading-relaxed text-[15px]">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>

          <div className="mt-12">
            <ConstitutionSignSection />
          </div>

          <div className="mt-10">
            <ConstitutionSignatureWall />
          </div>

        <div className="mt-24 rounded-[40px] border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-transparent p-10 text-center backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-purple-400 mb-5">
            Version 1.0
          </p>

          <h3 className="text-3xl md:text-4xl font-black mb-6">
            Built for creators.
            <br />
            Preserved for the culture.
          </h3>

          <p className="max-w-2xl mx-auto text-zinc-400 leading-relaxed">
            Modvault is not designed to become an extraction machine. The
            platform exists to protect creativity, preserve modding culture,
            and create a trustworthy ecosystem for both creators and players.
          </p>
        </div>
      </section>
    </main>
  );
}
