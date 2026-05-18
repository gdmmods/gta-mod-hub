export default function CreatorActivity() {

  return (

    <div
      className="
        rounded-[28px]
        border
        border-zinc-900
        bg-zinc-950/50
        backdrop-blur-xl
        p-5
      "
    >

      {/* HEADER */}
      <div
        className="
          flex
          items-center
          justify-between
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
            Development
          </p>

          <h2
            className="
              text-xl
              font-bold
              mt-1.5
            "
          >
            Creator Activity
          </h2>

        </div>

        <div
          className="
            rounded-xl
            border
            border-emerald-500/20
            bg-emerald-500/10
            px-3
            py-1
            text-xs
            text-emerald-300
          "
        >
          Active
        </div>

      </div>

      {/* ITEMS */}
      <div className="space-y-3">

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
              rounded-2xl
              border
              border-zinc-900
              bg-black/20
              px-4
              py-3
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  w-2
                  h-2
                  rounded-full
                  bg-purple-500
                  shadow-[0_0_12px_rgba(168,85,247,0.7)]
                "
              />

              <div
                className="
                  flex-1
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >

                <h3
                  className="
                    text-sm
                    font-medium
                    text-zinc-200
                  "
                >
                  {item.title}
                </h3>

                <p
                  className="
                    text-xs
                    text-zinc-500
                    whitespace-nowrap
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