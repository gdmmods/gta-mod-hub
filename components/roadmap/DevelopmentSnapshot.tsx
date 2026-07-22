// components/roadmap/DevelopmentSnapshot.tsx

export default function DevelopmentSnapshot() {
    return (
        <>
            {/* DEVELOPMENT SNAPSHOT */}
            <section className="
                      relative
                      max-w-[1600px]
                      mx-auto
                      px-6                      
                    ">
            
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
                        NEXT CHAPTER
                      </p>
            
                      <h2 className="text-3xl font-bold">
                        Building the Creator Ecosystem
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
                    Once the platform foundation is complete...                
                  </p>

                  <p
                    className="
                      text-zinc-400
                      max-w-4xl
                      leading-relaxed
                    "
                  >                   
                    This next chapter focuses on transforming ModVault into a living ecosystem where creators, 
                    teams, asset creators, projects, communities and reputation become interconnected.
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
                        Creator Experience
                      </p>
            
                      <div className="mt-5 space-y-4 text-sm">
            
                        {[
                          "Activity Hub",
                          "Creator Activity Infrastructure",
                          "Following & Feeds",
                          "Reputation & Recognition",
                          "Discovery Experience",
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
                        Collaboration & Community
                      </p>
            
                      <div className="mt-5 space-y-4 text-sm">
            
                        {[
                          "Teams & Organizations",
                          "Journals & Updates",
                          "Community Presence",
                          "Shared Projects",
                          "Creator Connections",
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
                        Ecosystem Expansion
                      </p>
            
                      <div className="mt-5 space-y-4">
            
                        {[
                          ["Creator Experience", "100%"],
                          ["Community Systems", "75%"],
                          ["Recognition ", "60%"],
                          ["Federation", "15%"],
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
        </>
    );
}