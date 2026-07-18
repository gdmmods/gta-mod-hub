import type { CurrentDevelopment } from "@/lib/roadmap/types";

interface CurrentPhaseProps {
  development: CurrentDevelopment;
}

export default function CurrentPhase({
  development,
}: CurrentPhaseProps) {
  return (
    <section className="max-w-[1600px] mx-auto px-6 pt-10 pb-10">
      <div
        className="
          relative
          overflow-hidden
          rounded-[36px]
          border
          border-white/10
          bg-gradient-to-br
          from-[#11051d]
          via-[#070707]
          to-[#040404]
          p-10
          lg:p-14
        "
      >
        {/* Ambient Glow */}
        <div
          className="
            absolute
            -top-20
            right-0
            h-[500px]
            w-[500px]
            rounded-full
            bg-purple-500/10
            blur-[180px]
          "
        />

        <div className="relative z-10">
          {/* HEADER */}

          <p className="text-xs uppercase tracking-[0.35em] text-purple-300">
            {development.heading}
          </p>

          <h1 className="mt-8 text-6xl font-bold tracking-tight">
            {development.title}
          </h1>

          <p className="mt-8 max-w-4xl text-xl leading-9 text-zinc-400 py-5">
            {development.summary}
          </p>

          {/* Divider */}

          <div className="my-12 h-px bg-gradient-to-r from-purple-500/40 via-zinc-700 to-transparent" />

          {/* GRID */}

          <div className="grid gap-10 xl:grid-cols-3">
            {/* LEFT */}

            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                Current Focus
              </p>

              <p className="mt-4 text-lg leading-8 text-white">
                {development.currentFocus}
              </p>

              <div className="mt-10">
                <div className="mb-3 flex justify-between">
                  <span className="text-sm text-zinc-500">
                    Overall Progress
                  </span>

                  <span className="font-semibold">
                    {development.progress}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full border border-white/5 bg-black/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400"
                    style={{
                      width: `${development.progress}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* CENTER */}

            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                Recent Progress
              </p>

              <div className="mt-6 space-y-4">
                {development.recentProgress.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >
                    <span className="text-purple-400">
                      ✓
                    </span>

                    <span className="text-zinc-200">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT */}

            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                Up Next
              </p>

              <div className="mt-6 space-y-4">
                {development.upNext.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >
                    <span className="text-cyan-400">
                      →
                    </span>

                    <span className="text-zinc-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}

          <div className="my-12 h-px bg-gradient-to-r from-purple-500/40 via-zinc-700 to-transparent" />

          {/* Developer Note */}

          <div className="max-w-5xl">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
              {development.developerNote.title}
            </p>

            <p className="mt-5 text-lg leading-9 text-zinc-300">
              {development.developerNote.content}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}