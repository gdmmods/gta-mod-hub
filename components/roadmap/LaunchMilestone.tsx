import { Rocket } from "lucide-react";

export default function LaunchMilestone() {
  return (
    <section className="mx-auto max-w-[1600px] px-6">

      <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#06040b]">

        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/images/launch-bg.png')",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "112% center",
            backgroundSize: "72%",
          }}
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg,#05030A 0%,rgba(5,3,10,.98) 0%,rgba(5,3,10,.94) 0%,rgba(5,3,10,.82) 2%,rgba(5,3,10,.45) 5%,rgba(5,3,10,.08) 12%,rgba(5,3,10,0) 22%)",
          }}
        />

        {/* Content */}
        <div
          className="relative z-10 grid min-h-[860px]"
          style={{
            gridTemplateColumns: "620px 1fr",
            outline: "4px solid red",
            paddingLeft: "60px",
          }}
        >

          {/* Left Panel */}
          <div className="pt-24">

            <div className="w-[620px]">

              <div className="flex items-center gap-4 mt-10">

                <Rocket
                  size={24}
                  className="text-purple-500"
                />

                <span className="text-sm uppercase tracking-[0.45em] text-purple-400">
                  Current Milestone
                </span>

              </div>

              <h2 className="mt-8 text-6xl font-black leading-none text-white">
                Launch Readiness
              </h2>

              <p className="mt-10 max-w-[540px] text-[21px] leading-[1.7] text-zinc-300">
                ModVault is approaching its first public launch.
                The foundation is largely complete, with the remaining
                work focused on stability, creator experience and
                final platform refinement.
              </p>

              {/* Launch Card */}

              <div className="mt-8 w-[620px] rounded-[28px] border border-white/10 bg-black/45 p-8 backdrop-blur-xl">

                <div className="flex items-center justify-between">

                  <span className="text-sm uppercase tracking-[0.35em] text-purple-300">
                    Launch Progress
                  </span>

                  <div className="text-right">

                    <div className="text-5xl font-bold text-white">
                      72%
                    </div>

                    <div className="text-zinc-400">
                      Complete
                    </div>

                  </div>

                </div>

                <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/10">

                  <div className="h-full w-[80%] rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-400" />

                </div>

                <div className="mt-8 grid grid-cols-2 gap-x-10 gap-y-5 text-lg">

                  <div>✅ Core Platform</div>
                  <div>🟡 Activity Hub</div>

                  <div>✅ Creator identities</div>
                  <div>🟡 Attribution & ownership</div>

                  <div>✅ Teams & collaboration</div>
                  <div>⚪ Public launch</div>

                  <div>✅ Mod management</div>

                </div>

              </div>

              <button
                className="
                  mt-8
                  mb-8
                  rounded-full
                  border
                  border-purple-600/60
                  px-8
                  py-4
                  text-lg
                  text-purple-300
                  transition
                  hover:bg-purple-600/10
                "
              >
                ✦ Preparing for Public Launch
              </button>

            </div>

          </div>

          {/* Right side intentionally empty.
              The background image fills this area. */}
          <div />

        </div>

        </div>

    </section>
  );
}