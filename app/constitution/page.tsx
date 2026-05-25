import Navbar from "@/components/layout/Navbar";
import ConstitutionSignSection from "@/components/constitution/ConstitutionSignSection";

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

          <ConstitutionSignSection />

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
