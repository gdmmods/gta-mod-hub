import type { RoadmapPhase } from "@/lib/roadmap/types";

interface RoadmapCardProps {
  phase: RoadmapPhase;
}

const stateStyles: Record<
  RoadmapPhase["state"],
  {
    label: string;
    icon: string;
    card: string;
    badge: string;
  }
> = {
  research: {
    label: "Research",
    icon: "🔍",
    card: "from-zinc-900 to-zinc-950 border-zinc-800",
    badge: "bg-zinc-900 text-zinc-300 border-zinc-700",
  },

  design: {
    label: "Design",
    icon: "✏️",
    card: "from-violet-950/60 to-zinc-950 border-violet-500/20",
    badge: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  },

  development: {
    label: "Development",
    icon: "⚙️",
    card: "from-purple-500/15 to-zinc-950 border-purple-500/25",
    badge: "bg-purple-500/10 text-purple-300 border-purple-500/30",
  },

  testing: {
    label: "Testing",
    icon: "🧪",
    card: "from-cyan-500/10 to-zinc-950 border-cyan-500/25",
    badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  },

  released: {
    label: "Released",
    icon: "✅",
    card: "from-emerald-500/10 to-zinc-950 border-emerald-500/25",
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  },

  planned: {
    label: "Planned",
    icon: "📍",
    card: "from-zinc-900 to-zinc-950 border-zinc-800",
    badge: "bg-zinc-900 text-zinc-300 border-zinc-700",
  },
};

export default function RoadmapCard({
  phase,
}: RoadmapCardProps) {
  const state = stateStyles[phase.state];

  return (
    <div
      className={`
        group
        relative
        overflow-hidden
        rounded-[30px]
        border
        bg-gradient-to-br
        ${state.card}
        p-7
        backdrop-blur-xl
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-purple-500/40
        hover:shadow-[0_0_40px_rgba(168,85,247,.12)]
      `}
    >
      {/* subtle glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,.08),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* STATE */}
      <div
        className={`
          absolute
          right-6
          top-6
          rounded-full
          border
          px-3
          py-1
          text-[11px]
          ${state.badge}
        `}
      >
        {state.icon} {state.label}
      </div>

      {/* PHASE */}
      <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
        {phase.phase}
      </p>

      {/* TITLE */}
      <h2 className="mt-4 text-4xl font-bold tracking-tight">
        {phase.title}
      </h2>

      {/* SUMMARY */}
      <p className="mt-5 leading-7 text-zinc-400">
        {phase.summary}
      </p>

      {/* CAPABILITIES */}
      <div className="mt-10">
        <p className="mb-5 text-xs uppercase tracking-[0.25em] text-zinc-500">
          Capabilities
        </p>

        <div className="space-y-4">
          {phase.capabilities.map((item, idx) => {
            const completed = item.status === "complete";
            const active = item.status === "progress";

            return (
              <div
                key={idx}
                className="flex items-center gap-3"
              >
                <div
                  className={`
                    flex
                    h-5
                    w-5
                    items-center
                    justify-center
                    rounded-full
                    border
                    text-[11px]

                    ${
                      completed
                        ? "border-purple-500/40 bg-purple-500/10 text-purple-300"
                        : active
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                        : "border-zinc-700 text-zinc-600"
                    }
                  `}
                >
                  {completed ? "✓" : active ? "•" : "○"}
                </div>

                <span
                  className={
                    completed
                      ? "text-zinc-200"
                      : active
                      ? "text-cyan-200"
                      : "text-zinc-500"
                  }
                >
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* PROGRESS */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Progress
          </span>

          <span className="font-medium">
            {phase.progress}%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full border border-white/5 bg-black/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_24px_rgba(168,85,247,.45)]"
            style={{
              width: `${phase.progress}%`,
            }}
          />
        </div>
      </div>

      {/* CURRENT FOCUS */}
      <div className="mt-10 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
          🎯 Current Focus
        </p>

        <p className="mt-3 leading-7 text-zinc-200">
          {phase.currentFocus}
        </p>
      </div>

      {/* FOOTER */}
      <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
        <span className="text-sm text-zinc-500">
          More details coming soon
        </span>

        <span className="text-sm text-purple-300 transition-transform group-hover:translate-x-1">
          Explore Phase →
        </span>
      </div>
    </div>
  );
}