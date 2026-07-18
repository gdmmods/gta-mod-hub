interface RoadmapCardProps {
  phase: {
    phase: string;
    title: string;
    status: "complete" | "in-progress" | "planned";
    progress: number;
    items: {
      text: string;
      done: boolean;
    }[];
  };
}

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

export default function RoadmapCard({
  phase,
}: RoadmapCardProps) {
  return (
    <div
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
            className={`
              flex
              items-start
              gap-3
              text-sm
              ${
                item.done
                  ? "text-zinc-300"
                  : "text-zinc-500"
              }
            `}
          >
            <div
              className={`
                relative
                w-5
                h-5
                rounded-full
                border
                flex
                items-center
                justify-center
                mt-[1px]

                ${
                  item.done
                    ? `
                      border-purple-500/40
                      bg-purple-500/10
                      shadow-[0_0_14px_rgba(168,85,247,0.35)]
                    `
                    : `
                      border-zinc-700
                      bg-zinc-900/40
                    `
                }
              `}
            >
              {item.done && (
                <div
                  className="
                    absolute
                    inset-0
                    rounded-full
                    bg-purple-500/10
                    blur-[6px]
                  "
                />
              )}

              <span
                className={`
                  relative
                  z-10
                  text-[10px]
                  ${
                    item.done
                      ? "text-purple-300"
                      : "text-zinc-600"
                  }
                `}
              >
                {item.done ? "✓" : "○"}
              </span>
            </div>

            <span>{item.text}</span>
          </div>
        ))}
      </div>

      {/* PROGRESS */}
      <div className="mt-8">
        <div
          className="
            relative
            w-full
            h-2.5
            rounded-full
            bg-black/50
            overflow-hidden
            border
            border-white/5
          "
        >
          <div
            className="
              absolute
              inset-y-0
              left-0
              rounded-full
              bg-gradient-to-r
              from-purple-500
              via-fuchsia-500
              to-cyan-400
              shadow-[0_0_18px_rgba(168,85,247,0.45)]
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
  );
}