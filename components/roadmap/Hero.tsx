// components/roadmap/Hero.tsx

export default function Hero() {
    return (
        <>
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
        </>
    );
}