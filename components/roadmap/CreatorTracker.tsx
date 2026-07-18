
export default function CreatorTracker() {
    return (
        <>

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

      </>
    );
}