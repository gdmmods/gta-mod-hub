import Link from "next/link";

export default function AboutPage() {

  return (

    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.16),transparent_45%)]" />

      {/* HERO */}
      <section
        className="
          relative
          max-w-7xl
          mx-auto
          px-8
          pt-40
          pb-28
          z-10
        "
      >

        <p
          className="
            text-purple-400
            uppercase
            tracking-[0.35em]
            text-sm
            mb-8
          "
        >
          ModVault
        </p>

        <h1
          className="
            text-6xl
            md:text-8xl
            font-black
            leading-[0.95]
            tracking-tight
            max-w-6xl
          "
        >
          Built for the
          <span
            className="
              block
              bg-gradient-to-r
              from-purple-400
              to-fuchsia-500
              bg-clip-text
              text-transparent
            "
          >
            modding ecosystem.
          </span>
        </h1>

        <p
          className="
            mt-10
            text-xl
            text-zinc-400
            leading-relaxed
            max-w-3xl
          "
        >
          A creator-centric platform focused on discovery,
          preservation, attribution, trust systems,
          and long-term modding culture.
        </p>

        <div
          className="
            flex
            flex-wrap
            gap-5
            mt-14
          "
        >

          <Link
            href="/creators"
            className="
              rounded-2xl
              bg-gradient-to-r
              from-purple-600
              to-fuchsia-500
              px-8
              py-4
              font-semibold
              text-white
              hover:scale-[1.02]
              transition
            "
          >
            Explore Creators
          </Link>

          <Link
            href="/constitution"
            className="
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-950/70
              px-8
              py-4
              font-medium
              text-zinc-300
              hover:border-purple-500/30
              hover:text-white
              transition
            "
          >
            Read Constitution
          </Link>

        </div>

      </section>

       {/* FEATURE CARDS */}
      <section className="relative max-w-6xl mx-auto px-7 mt-16 grid md:grid-cols-2 xl:grid-cols-4 gap-6 z-10">

        {[
          {
            title: "Creator-Centric",
            text: "Support creators directly while preserving identity, attribution, and ownership.",
          },
          {
            title: "Discovery Focused",
            text: "Find quality mods through curated presentation, creator ecosystems, and intelligent browsing.",
          },
          {
            title: "Preservation Minded",
            text: "Built to help preserve modding culture, archives, experimentation, and digital craftsmanship.",
          },
          {
            title: "Built for Community",
            text: "Designed around transparency, trust systems, contribution, and long-term ecosystem health.",
          },
          {
            title: "Trust Infrastructure",
            text: "Systems designed around attribution, creator legitimacy, transparency, and long-term ecosystem trust.",
          },
          {
            title: "AI Assisted, Not Driven",
            text: "AI is used as a creative assistant and discovery tool — never as a replacement for human creators.",
          },
          {
            title: "Digital Preservation",
            text: "Focused on protecting modding history, creator archives, lost projects, and cultural continuity.",
          },
          {
            title: "Creator Ownership",
            text: "Creators retain attribution, visibility, identity, and control over their work and ecosystems.",
          },
        ].map((item) => (

          <div
            key={item.title}
            className="rounded-[28px] border border-zinc-800 bg-zinc-950/70 backdrop-blur-xl p-7 hover:border-purple-500/30 transition"
          >

            <h2 className="text-xl font-bold mb-4">
              {item.title}
            </h2>

            <p className="text-zinc-400 text-sm leading-relaxed">
              {item.text}
            </p>

          </div>

        ))}

      </section>

      {/* WHY */}
      <section
        className="
          relative
          max-w-7xl
          mx-auto
          mt-20
          px-8
          pt-32 pb-40
          z-10
        "
      >

        <div className="max-w-5xl">

          <p
            className="
              text-purple-400
              uppercase
              tracking-[0.28em]
              text-xl
              mb-8
            "
          >
            Why ModVault Exists
          </p>

          <h2
            className="
              text-5xl
              md:text-5xl
              font-black
              leading-[1]
              tracking-tight
              mb-12
            "
          >
            Modding culture deserves better infrastructure.
          </h2>

          <div
            className="
              space-y-8
              text-zinc-400
              text-xl
              leading-relaxed
              max-w-4xl
              mt-10
            "
          >

            <p>
              Modding communities have carried enormous
              creative value for years, yet creators
              often face fragmented ecosystems,
              disappearing archives, stolen uploads,
              burnout, and weak platform identity.
            </p>

            <p>
              ModVault was created to help preserve
              the culture while giving creators
              stronger visibility, trust systems,
              ecosystem identity, and long-term
              infrastructure designed around
              contribution instead of extraction.
            </p>

          </div>

        </div>

      </section>

      {/* CONSTITUTION */}
      <section
        className="
          relative
          max-w-6xl
          mx-auto
          mt-20
          px-8
          pb-36
          z-10
        "
      >

        <div
          className="
            rounded-[40px]
            border
            border-purple-500/20
            bg-gradient-to-b
            from-purple-500/10
            to-transparent
            backdrop-blur-xl
            p-12
            md:p-16
          "
        >

          <p
            className="
              text-purple-400
              uppercase
              tracking-[0.3em]
              text-xl
              mb-8
            "
          >
            Foundational Principles
          </p>

          <h2
            className="
              text-4xl
              md:text-4xl
              font-black
              leading-[1]
              tracking-tight
              max-w-4xl
              mb-10
            "
          >
            The platform is guided by public principles.
          </h2>

          <p
            className="
              text-zinc-300
              text-lg
              leading-relaxed
              max-w-3xl
              mb-14
            "
          >
            ModVault openly defines the principles
            guiding its creator ecosystem,
            preservation goals, trust systems,
            and long-term direction.
          </p>

          <div
            className="
              border-l-2
              border-purple-500
              pl-8
              mb-14
            "
          >

            <p
              className="
                text-2xl
                md:text-3xl
                font-semibold
                leading-relaxed
                tracking-tight
              "
            >
              “Mods are more than downloads.
              They are digital craftsmanship,
              experimentation, and cultural history.”
            </p>

          </div>

          <Link
            href="/constitution"
            className="
              inline-flex
              items-center
              gap-3
              rounded-2xl
              bg-white
              text-black
              px-8
              py-4
              font-semibold
              hover:scale-[1.02]
              transition
            "
          >
            Read the Constitution →
          </Link>

        </div>

      </section>

      {/* FUTURE */}
      <section
        className="
          relative
          max-w-7xl
          mx-auto
          mt-20
          px-8
          pb-32
          z-10
        "
      >

        <div
          className="
            grid
            md:grid-cols-2
            gap-y-10
            gap-x-20
            text-zinc-300
          "
        >

          {[
            "Creator verification systems",
            "Advanced discovery and search",
            "Preservation-focused archives",
            "Community trust infrastructure",
            "Creator monetization support",
            "Long-term ecosystem tooling",
          ].map((item) => (

            <div
              key={item}
              className="
                flex
                items-center
                gap-5
                border-b
                border-zinc-900
                pb-6
              "
            >

              <div
                className="
                  w-2
                  h-2
                  rounded-full
                  bg-purple-500
                "
              />

              <p className="text-lg">
                {item}
              </p>

            </div>

          ))}

        </div>

      </section>

      {/* CLOSING */}
      <section
        className="
          relative
          text-center
          px-8
          pb-40
          z-10
        "
      >

        <p
          className="
            text-5xl
            md:text-5xl
            font-black
            leading-[1.05]
            tracking-tight
            max-w-5xl
            mx-auto
            mt-20
          "
        >
          Mods are more than files.
          <br />
          They are living digital craftsmanship.
        </p>

        <p
          className="
            text-zinc-500
            mt-20
            uppercase
            tracking-[0.3em]
            text-sm
          "
        >
          ModVault — Creator Ecosystem Initiative - Built with Passion for the GTA Modding Community.
        </p>

      </section>

    </main>

  );

}