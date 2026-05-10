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

const statusMap: Record<string, string> = {
  complete: "COMPLETE",
  "in-progress": "IN PROGRESS",
  planned: "PLANNED",
};

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-[#040404] text-white overflow-hidden">

      {/* NAV */}
      <div
        className="
          sticky
          top-0
          z-50
          backdrop-blur-2xl
          bg-black/70
          border-b
          border-zinc-900
        "
      >

        <div
          className="
            max-w-[1600px]
            mx-auto
            px-6
            h-[74px]
            flex
            items-center
            justify-between
          "
        >

          {/* LOGO */}
          <Link
            href="/"
            className="flex items-center gap-3"
          >

            <div
              className="
                text-4xl
                font-black
                leading-none
                bg-gradient-to-br
                from-purple-400
                to-purple-700
                bg-clip-text
                text-transparent
              "
            >
              M
            </div>

            <div
              className="
                text-2xl
                font-bold
                tracking-tight
              "
            >
              MODVAULT
            </div>

          </Link>

          {/* LINKS */}
          <div
            className="
              hidden
              lg:flex
              items-center
              gap-10
              text-[15px]
            "
          >

            {[
              "Mods",
              "Creators",
              "Curators",
              "Media",
              "Forums",
            ].map((item) => (

              <Link
                key={item}
                href="/"
                className="
                  text-zinc-300
                  hover:text-white
                  transition
                "
              >
                {item}
              </Link>

            ))}

          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">

            <button
              className="
                hidden
                md:flex
                items-center
                gap-2
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-950
                px-5
                py-2.5
                text-sm
                text-zinc-400
              "
            >
              Search mods, creators...
            </button>

            <button
              className="
                rounded-2xl
                bg-gradient-to-r
                from-purple-600
                to-purple-500
                px-5
                py-2.5
                text-sm
                font-medium
                shadow-[0_0_30px_rgba(168,85,247,0.35)]
                hover:scale-[1.03]
                transition
              "
            >
              Upload Mod
            </button>

          </div>

        </div>

      </div>

      {/* HERO */}
      <section
        className="
          relative
          max-w-[1600px]
          mx-auto
          px-6
          pt-14
        "
      >

        <div
          className="
            absolute
            top-0
            left-1/2
            -translate-x-1/2
            w-[1000px]
            h-[500px]
            bg-purple-600/10
            blur-[180px]
            pointer-events-none
          "
        />

        <div
          className="
            relative
            z-10
            grid
            xl:grid-cols-[1fr_420px]
            gap-10
            items-start
          "
        >

          {/* LEFT */}
          <div>

            <p
              className="
                text-purple-400
                text-sm
                tracking-[0.2em]
                uppercase
                mb-5
              "
            >
              ROADMAP
            </p>

            <h1
              className="
                text-5xl
                md:text-7xl
                font-black
                leading-[0.95]
                tracking-tight
                max-w-5xl
              "
            >
              The Future of{" "}

              <span
                className="
                  bg-gradient-to-r
                  from-purple-400
                  to-pink-500
                  bg-clip-text
                  text-transparent
                "
              >
                ModVault
              </span>

            </h1>

            <p
              className="
                mt-8
                text-zinc-400
                text-xl
                leading-relaxed
                max-w-3xl
              "
            >
              A step-by-step journey to build the most trusted,
              intelligent, and creator-focused GTA mod platform
              in the world.

              Now evolving into a fully interactive ecosystem with
              smart discovery systems, creator infrastructure,
              dynamic metadata architecture, immersive download
              flows and future AI-assisted platform intelligence.
              <br />
              Built by the people, for the people.
            </p>

          </div>

          {/* RIGHT PANELS */}
          <div className="space-y-5">

            {/* MISSION */}
            <div
              className="
                rounded-3xl
                border
                border-zinc-800
                bg-gradient-to-br
                from-zinc-900
                to-zinc-950
                p-7
              "
            >

              <div className="flex items-start gap-4">

                <div
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    bg-purple-600/20
                    flex
                    items-center
                    justify-center
                    text-purple-400
                    text-xl
                  "
                >
                  ⚑
                </div>

                <div>

                  <p className="text-2xl font-bold">
                    Our Mission
                  </p>

                  <p
                    className="
                      text-zinc-400
                      mt-3
                      leading-relaxed
                    "
                  >
                    To build the most trusted,
                    immersive and future-proof
                    creator ecosystem in the GTA
                    modding space.
                  </p>

                </div>

              </div>

            </div>

            {/* LEGEND */}
            <div
              className="
                rounded-3xl
                border
                border-zinc-800
                bg-gradient-to-br
                from-zinc-900
                to-zinc-950
                p-7
              "
            >

              <p
                className="
                  text-lg
                  font-semibold
                  mb-5
                "
              >
                Legend
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">

                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  Completed
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  Planned
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  In Progress
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full border border-zinc-500" />
                  Not Started
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* MAIN ROADMAP */}
      <section
        className="
          max-w-[1600px]
          mx-auto
          px-6
          mt-16
        "
      >

        {/* FIRST ROW */}
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-5
            gap-6
          "
        >

          {roadmap.slice(0, 5).map((phase, i) => (

            <div
              key={i}
              className={`
                relative
                rounded-[30px]
                border
                bg-gradient-to-br
                ${phaseColors[phase.status]}
                p-6
                overflow-hidden
                backdrop-blur-xl
                hover:scale-[1.015]
                transition-all
                duration-300
              `}
            >

              {/* STATUS */}
              <div
                className="
                  absolute
                  top-5
                  right-5
                  text-[10px]
                  uppercase
                  tracking-wide
                  px-2.5
                  py-1
                  rounded-full
                  bg-black/40
                  border
                  border-white/10
                  text-zinc-300
                "
              >
                {statusMap[phase.status]}
              </div>

              {/* PHASE */}
              <p
                className="
                  text-xs
                  uppercase
                  tracking-[0.18em]
                  text-zinc-400
                "
              >
                {phase.phase}
              </p>

              {/* TITLE */}
              <h2
                className="
                  text-3xl
                  font-bold
                  leading-tight
                  mt-3
                "
              >
                {phase.title}
              </h2>

              {/* ITEMS */}
              <div className="mt-8 space-y-4">

                {phase.items.map((item, idx) => (

                  <div
                    key={idx}
                    className="
                      flex
                      items-start
                      gap-3
                      text-sm
                      text-zinc-300
                    "
                  >

                    <div
                      className="
                        w-5
                        h-5
                        rounded-full
                        border
                        border-zinc-600
                        flex
                        items-center
                        justify-center
                        text-[10px]
                        mt-[1px]
                      "
                    >
                      ✓
                    </div>

                    <span>{item}</span>

                  </div>

                ))}

              </div>

              {/* PROGRESS */}
              <div className="mt-8">

                <div
                  className="
                    w-full
                    h-2
                    rounded-full
                    bg-black/40
                    overflow-hidden
                  "
                >

                  <div
                    className="
                      h-full
                      rounded-full
                      bg-gradient-to-r
                      from-purple-500
                      to-cyan-400
                    "
                    style={{
                      width: `${phase.progress}%`,
                    }}
                  />

                </div>

                <div
                  className="
                    flex
                    justify-between
                    items-center
                    mt-3
                    text-sm
                  "
                >

                  <span className="text-zinc-500">
                    Progress
                  </span>

                  <span className="text-white">
                    {phase.progress}%
                  </span>

                </div>

              </div>

            </div>

          ))}

        </div>

        {/* TIMELINE */}
        <div className="mt-16">

          <div
            className="
              relative
              h-[2px]
              rounded-full
              bg-gradient-to-r
              from-cyan-400
              via-purple-500
              to-zinc-700
            "
          >

            <div
              className="
                absolute
                left-0
                top-1/2
                -translate-y-1/2
                w-5
                h-5
                rounded-full
                bg-cyan-400
                shadow-[0_0_25px_#22d3ee]
              "
            />

            <div
              className="
                absolute
                left-1/3
                top-1/2
                -translate-y-1/2
                w-5
                h-5
                rounded-full
                bg-blue-500
                shadow-[0_0_25px_#3b82f6]
              "
            />

            <div
              className="
                absolute
                left-2/3
                top-1/2
                -translate-y-1/2
                w-5
                h-5
                rounded-full
                bg-purple-500
                shadow-[0_0_25px_#a855f7]
              "
            />

            <div
              className="
                absolute
                right-0
                top-1/2
                -translate-y-1/2
                w-5
                h-5
                rounded-full
                bg-zinc-500
              "
            />

          </div>

          <div
            className="
              flex
              justify-between
              mt-5
              text-xs
              uppercase
              tracking-[0.15em]
              text-zinc-500
            "
          >

            <span className="text-cyan-400">
              Completed
            </span>

            <span className="text-blue-400">
              Current Focus
            </span>

            <span className="text-purple-400">
              Building Next
            </span>

            <span>
              Coming Later
            </span>

          </div>

        </div>

{/* DEVELOPMENT SNAPSHOT */}
<section className="mt-16">

  <div
    className="
      rounded-[34px]
      border
      border-blue-500/20
      bg-gradient-to-br
      from-[#071019]
      via-black
      to-[#12071e]
      p-8
      overflow-hidden
      relative
    "
  >

    <div
      className="
        absolute
        top-0
        right-0
        w-[500px]
        h-[300px]
        bg-blue-500/10
        blur-[140px]
        pointer-events-none
      "
    />

    <div className="relative z-10">

      <div
        className="
          flex
          items-center
          gap-3
          mb-4
        "
      >

        <div
          className="
            w-11
            h-11
            rounded-2xl
            bg-blue-500/15
            flex
            items-center
            justify-center
            text-blue-400
          "
        >
          ✦
        </div>

        <div>

          <p
            className="
              text-blue-400
              text-sm
              uppercase
              tracking-[0.18em]
            "
          >
            Latest Progress
          </p>

          <h2 className="text-3xl font-bold">
            Ecosystem Architecture Expansion
          </h2>

        </div>

      </div>

      <p
        className="
          text-zinc-400
          max-w-4xl
          leading-relaxed
        "
      >
        ModVault has transitioned from static presentation
        pages into a fully interactive ecosystem architecture.
        Recent development sessions focused on creator systems,
        smart discovery logic, metadata infrastructure,
        immersive download flows, dynamic compatibility systems
        and scalable recommendation architecture.
      </p>

      {/* GRID */}
      <div
        className="
          grid
          lg:grid-cols-3
          gap-6
          mt-10
        "
      >

        {/* CARD */}
        <div
          className="
            rounded-3xl
            border
            border-zinc-800
            bg-black/40
            p-6
          "
        >

          <p className="font-semibold">
            Smart Discovery Engine
          </p>

          <div className="mt-5 space-y-4 text-sm">

            {[
              "Tag-based recommendation system",
              "Creator relationship matching",
              "Category fallback architecture",
              "Duplicate prevention logic",
              "Scalable recommendation foundations",
            ].map((item) => (

              <div
                key={item}
                className="flex gap-3"
              >

                <span className="text-cyan-400">
                  ✓
                </span>

                <span className="text-zinc-300">
                  {item}
                </span>

              </div>

            ))}

          </div>

        </div>

        {/* CARD */}
        <div
          className="
            rounded-3xl
            border
            border-zinc-800
            bg-black/40
            p-6
          "
        >

          <p className="font-semibold">
            Interactive Mod Ecosystem
          </p>

          <div className="mt-5 space-y-4 text-sm">

            {[
              "Portal-based fullscreen modals",
              "Immersive download experience",
              "Technical compatibility systems",
              "Dynamic metadata architecture",
              "Creator activity infrastructure",
            ].map((item) => (

              <div
                key={item}
                className="flex gap-3"
              >

                <span className="text-purple-400">
                  ✓
                </span>

                <span className="text-zinc-300">
                  {item}
                </span>

              </div>

            ))}

          </div>

        </div>

        {/* CARD */}
        <div
          className="
            rounded-3xl
            border
            border-zinc-800
            bg-black/40
            p-6
          "
        >

          <p className="font-semibold">
            Infrastructure Progress
          </p>

          <div className="mt-5 space-y-4">

            {[
              ["Dynamic Systems", "82%"],
              ["Creator Ecosystem", "61%"],
              ["Discovery Architecture", "74%"],
              ["AI Preparation", "35%"],
            ].map(([name, value]) => (

              <div key={name}>

                <div className="flex justify-between text-sm mb-2">

                  <span>{name}</span>

                  <span className="text-zinc-500">
                    {value}
                  </span>

                </div>

                <div
                  className="
                    h-2
                    rounded-full
                    bg-zinc-900
                    overflow-hidden
                  "
                >

                  <div
                    className="
                      h-full
                      rounded-full
                      bg-gradient-to-r
                      from-blue-500
                      to-purple-500
                    "
                    style={{
                      width: value,
                    }}
                  />

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>

  </div>

</section>

        {/* SECOND ROW */}
        <div
          className="
            mt-14
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-4
            gap-6
          "
        >

          {roadmap.slice(5).map((phase, i) => (

            <div
              key={i}
              className="
                rounded-[28px]
                border
                border-zinc-800
                bg-gradient-to-br
                from-zinc-950
                to-black
                p-6
                hover:border-purple-500/30
                transition
              "
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-[0.18em]
                  text-zinc-500
                "
              >
                {phase.phase}
              </p>

              <h2
                className="
                  text-2xl
                  font-bold
                  mt-3
                "
              >
                {phase.title}
              </h2>

              <div className="mt-7 space-y-4">

                {phase.items.map((item, idx) => (

                  <div
                    key={idx}
                    className="
                      flex
                      items-start
                      gap-3
                      text-sm
                      text-zinc-400
                    "
                  >

                    <div
                      className="
                        w-5
                        h-5
                        rounded-full
                        border
                        border-zinc-700
                        flex
                        items-center
                        justify-center
                        text-[10px]
                      "
                    >
                      ○
                    </div>

                    <span>{item}</span>

                  </div>

                ))}

              </div>

            </div>

          ))}

        </div>

      </section>

      {/* CREATOR TRACKER */}
      <section
        className="
          max-w-[1600px]
          mx-auto
          px-6
          mt-16
        "
      >

        <div
          className="
            rounded-[34px]
            border
            border-purple-500/20
            bg-gradient-to-br
            from-[#0d0815]
            to-black
            p-8
            overflow-hidden
            relative
          "
        >

          <div
            className="
              absolute
              top-0
              right-0
              w-[500px]
              h-[300px]
              bg-purple-500/10
              blur-[120px]
              pointer-events-none
            "
          />

          <div className="relative z-10">

            <div
              className="
                flex
                items-center
                gap-3
                mb-4
              "
            >

              <div
                className="
                  w-10
                  h-10
                  rounded-2xl
                  bg-purple-500/20
                  flex
                  items-center
                  justify-center
                "
              >
                ✦
              </div>

              <div>

                <p
                  className="
                    text-purple-400
                    text-sm
                    uppercase
                    tracking-[0.18em]
                  "
                >
                  New Feature Highlight
                </p>

                <h2 className="text-3xl font-bold">
                  Creator Progress Tracker
                </h2>

              </div>

            </div>

            <p
              className="
                text-zinc-400
                max-w-3xl
                leading-relaxed
              "
            >
              Creators will be able to share development
              progress, screenshots, milestone updates,
              patch notes, optimization status, and devlogs
              directly on mod pages and creator dashboards.
            </p>

            {/* GRID */}
            <div
              className="
                grid
                lg:grid-cols-3
                gap-6
                mt-10
              "
            >

              {/* CARD 1 */}
              <div
                className="
                  rounded-3xl
                  border
                  border-zinc-800
                  bg-black/40
                  p-6
                "
              >

                <p className="font-semibold">
                  Development Progress
                </p>

                <div className="mt-5 space-y-4">

                  {[
                    ["Modeling", "100%"],
                    ["Texturing", "80%"],
                    ["Physics Setup", "60%"],
                    ["Optimization", "40%"],
                  ].map(([name, value]) => (

                    <div key={name}>

                      <div className="flex justify-between text-sm mb-2">
                        <span>{name}</span>
                        <span className="text-zinc-500">
                          {value}
                        </span>
                      </div>

                      <div
                        className="
                          h-2
                          rounded-full
                          bg-zinc-900
                          overflow-hidden
                        "
                      >

                        <div
                          className="
                            h-full
                            rounded-full
                            bg-gradient-to-r
                            from-cyan-400
                            to-purple-500
                          "
                          style={{
                            width: value,
                          }}
                        />

                      </div>

                    </div>

                  ))}

                </div>

              </div>

              {/* CARD 2 */}
              <div
                className="
                  rounded-3xl
                  border
                  border-zinc-800
                  bg-black/40
                  p-6
                "
              >

                <p className="font-semibold">
                  Creator Devlog
                </p>

                <div className="mt-5 space-y-5 text-sm">

                  <div>
                    <p className="text-zinc-500">
                      MAY 18
                    </p>

                    <p className="mt-1">
                      New screenshots added.
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500">
                      MAY 16
                    </p>

                    <p className="mt-1">
                      Physics overhaul in progress.
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500">
                      MAY 14
                    </p>

                    <p className="mt-1">
                      Working on custom wheel setups.
                    </p>
                  </div>

                </div>

              </div>

              {/* CARD 3 */}
              <div
                className="
                  rounded-3xl
                  border
                  border-zinc-800
                  bg-black/40
                  p-6
                  flex
                  flex-col
                  justify-between
                "
              >

                <div>

                  <p className="font-semibold">
                    What creators can share
                  </p>

                  <div className="mt-5 space-y-4 text-sm">

                    {[
                      "Progress updates & milestones",
                      "WIP screenshots & videos",
                      "Changelogs & patch notes",
                      "Upcoming features",
                      "Polls & community feedback",
                    ].map((item) => (

                      <div
                        key={item}
                        className="flex gap-3"
                      >

                        <span className="text-purple-400">
                          ✓
                        </span>

                        <span className="text-zinc-300">
                          {item}
                        </span>

                      </div>

                    ))}

                  </div>

                </div>

                <button
                  className="
                    mt-8
                    w-full
                    rounded-2xl
                    bg-gradient-to-r
                    from-purple-600
                    to-purple-500
                    py-3.5
                    font-medium
                    hover:scale-[1.02]
                    transition
                  "
                >
                  Follow Progress
                </button>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* PILLARS */}
      <section
        className="
          max-w-[1600px]
          mx-auto
          px-6
          mt-16
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

      {/* FOOTER CTA */}
      <section
        className="
          max-w-[1600px]
          mx-auto
          px-6
          mt-16
          pb-20
        "
      >

        <div
          className="
            rounded-[34px]
            border
            border-zinc-800
            bg-gradient-to-r
            from-[#12071e]
            via-black
            to-[#12071e]
            p-8
          "
        >

          <div
            className="
              flex
              flex-col
              xl:flex-row
              justify-between
              items-center
              gap-8
            "
          >

            <div>

              <p className="text-3xl font-bold">
                Join the Journey
              </p>

              <p
                className="
                  text-zinc-400
                  mt-3
                  max-w-2xl
                "
              >
                Every system added to ModVault strengthens
                creator identity, discovery, immersion and
                long-term ecosystem growth.
              </p>

            </div>

            <button
              className="
                rounded-2xl
                bg-gradient-to-r
                from-purple-600
                to-purple-500
                px-8
                py-4
                font-medium
                shadow-[0_0_35px_rgba(168,85,247,0.35)]
                hover:scale-[1.03]
                transition
              "
            >
              Get Involved →
            </button>

          </div>

          {/* STATS */}
          <div
            className="
              grid
              grid-cols-2
              md:grid-cols-4
              gap-6
              mt-12
            "
          >

            {[
              ["10K+", "Mods"],
              ["2K+", "Creators"],
              ["45K+", "Users"],
              ["500K+", "Downloads"],
            ].map(([value, label]) => (

              <div
                key={label}
                className="
                  rounded-2xl
                  border
                  border-zinc-800
                  bg-black/30
                  p-5
                "
              >

                <p className="text-3xl font-bold">
                  {value}
                </p>

                <p className="text-zinc-500 mt-2">
                  {label}
                </p>

              </div>

            ))}

          </div>

        </div>

        <p
          className="
            text-center
            text-zinc-600
            text-sm
            mt-8
          "
        >
          💜 Thank you for being part of ModVault.
          The best is yet to come.
        </p>

      </section>

    </main>
  );
}