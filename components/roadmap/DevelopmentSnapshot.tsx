// components/roadmap/DevelopmentSnapshot.tsx

export default function DevelopmentSnapshot() {
    return (
        <>
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
        </>
    );
}