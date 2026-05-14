interface CreatorSidebarProps {
  creator: any;
}

export default function CreatorSidebar({
  creator,
}: CreatorSidebarProps) {

  return (

    <div
      className="
        rounded-[34px]
        border
        border-purple-500/10
        bg-gradient-to-b
        from-purple-500/10
        shadow-[0_0_60px_rgba(168,85,247,0.08)]
        to-zinc-950/70
        backdrop-blur-xl
        p-6
        h-fit
      "
    >

      <p
        className="
          text-sm
          uppercase
          tracking-[0.2em]
          text-purple-400
        "
      >
        Progress
      </p>

      <h2
        className="
          text-3xl
          font-black
          mt-2
        "
      >
        Current Focus
      </h2>

      <div className="mt-6 space-y-5">

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
                  justify-between
                  mb-3
                  text-sm
                "
              >

                <span className="text-zinc-300">
                  {label}
                </span>

                <span className="text-zinc-500">
                  {value}
                </span>

              </div>

              <div
                className="
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