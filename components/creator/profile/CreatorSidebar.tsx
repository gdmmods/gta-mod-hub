import Link from "next/link";

interface CreatorSidebarProps {
  creator: any;
}

export default function CreatorSidebar({
  creator,
}: CreatorSidebarProps) {

  return (

    <div
      className="
        rounded-[28px]
        border
        border-purple-500/10
        bg-gradient-to-b
        from-purple-500/[0.05]
        to-zinc-950/70
        shadow-[0_0_40px_rgba(168,85,247,0.06)]
        backdrop-blur-xl
        p-5
        h-fit
      "
    >

      {/* HEADER */}
      <div
  className="
    mb-5
  "
>

        <div>

          <p
            className="
              text-[10px]
              uppercase
              tracking-[0.22em]
              text-purple-400
            "
          >
            Progress
          </p>

          <h2
            className="
              text-xl
              font-bold
              mt-1.5
            "
          >
            Current Focus
          </h2>

        </div>

      </div>

      {/* PROGRESS */}
      <div className="space-y-4">

        {[
          [
            "Vehicle Optimization",
            "82%",
          ],
          [
            "Interior Rework",
            "65%",
          ],
          [
            "LOD Improvements",
            "91%",
          ],
          [
            "Sound Design",
            "40%",
          ],
        ].map(
          ([label, value]) => (

            <div key={label}>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                  mb-2
                "
              >

                <span
                  className="
                    text-sm
                    text-zinc-300
                  "
                >
                  {label}
                </span>

                <span
                  className="
                    text-xs
                    text-zinc-500
                  "
                >
                  {value}
                </span>

              </div>

              <div
                className="
                  h-1.5
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
                    to-pink-500
                  "
                  style={{
                    width: value,
                  }}
                />

              </div>

            </div>

          )
        )}

      </div>

    </div>

  );

}