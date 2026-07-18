// components/roadmap/Pillars.tsx

export default function Pillars() {
    return (
        <>
            {/* PILLARS */}
      <section
        className="
          max-w-[1600px]
          mx-auto
          px-6
          mt-16
          py-10
        "
      >

        <div
          className="
            rounded-[34px]
            border
            border-zinc-800
            bg-gradient-to-br
            from-zinc-950
            to-black
            p-8
          "
        >

          <div
            className="
              grid
              md:grid-cols-2
              xl:grid-cols-6
              gap-8
            "
          >

            {[
              [
                "Creator First",
                "Empowering creators and giving them the tools to succeed.",
              ],
              [
                "Quality & Trust",
                "Curated content, verified systems and community trust.",
              ],
              [
                "Discovery",
                "Smart discovery that helps users find the best mods.",
              ],
              [
                "Innovation",
                "Using technology and AI to build the future of modding.",
              ],
              [
                "Community",
                "Built with the community, for the community.",
              ],
              [
                "Sustainability",
                "Long-term thinking for a platform that lasts.",
              ],
            ].map(([title, text]) => (

              <div key={title}>

                <div
                  className="
                    w-14
                    h-14
                    rounded-2xl
                    bg-zinc-900
                    border
                    border-zinc-800
                    mb-5
                  "
                />

                <p className="font-semibold text-lg">
                  {title}
                </p>

                <p
                  className="
                    text-sm
                    text-zinc-500
                    mt-3
                    leading-relaxed
                  "
                >
                  {text}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>
        </>
    );
}