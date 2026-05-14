export default function CreatorActivity() {

  return (

    <div
      className="
        rounded-[34px]
        border
        border-zinc-800
        bg-zinc-950/60
        backdrop-blur-xl
        p-7
      "
    >

      <div
        className="
          flex
          items-center
          justify-between
          mb-8
        "
      >

        <div>

          <p
            className="
              text-sm
              uppercase
              tracking-[0.2em]
              text-purple-400
            "
          >
            Development
          </p>

          <h2
            className="
              text-3xl
              font-black
              mt-2
            "
          >
            Creator Activity
          </h2>

        </div>

        {/* ACTIVE BADGE */}
        <div
          className="
            rounded-2xl
            border
            border-emerald-500/20
            bg-emerald-500/10
            px-4
            py-2
            text-sm
            text-emerald-300
          "
        >
          Active
        </div>

      </div>

      <div className="space-y-5">

        {[
          {
            title:
              "New cinematic screenshots uploaded",
            date:
              "2 days ago",
          },
          {
            title:
              "Physics overhaul in progress",
            date:
              "5 days ago",
          },
          {
            title:
              "Optimization pass for next update",
            date:
              "1 week ago",
          },
        ].map((item) => (

          <div
            key={item.title}
            className="
              rounded-3xl
              border
              border-zinc-900
              bg-black/30
              p-5
            "
          >

            <div
              className="
                flex
                items-start
                gap-4
              "
            >

              <div
                className="
                  mt-1
                  w-3
                  h-3
                  rounded-full
                  bg-purple-500
                  shadow-[0_0_15px_rgba(168,85,247,0.8)]
                "
              />

              <div className="flex-1">

                <h3
                  className="
                    text-lg
                    font-semibold
                  "
                >
                  {item.title}
                </h3>

                <p
                  className="
                    text-sm
                    text-zinc-500
                    mt-2
                  "
                >
                  {item.date}
                </p>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}