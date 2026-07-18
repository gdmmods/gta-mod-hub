// components/roadmap/Timeline.tsx

export default function Timeline() {
    return (
        <>
            {/* TIMELINE */}
        <div className="relative max-w-[1600px] mx-auto mt-16">

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
        </>
    );
}