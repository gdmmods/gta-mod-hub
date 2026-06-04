"use client";

export default function CreatorEditStatsSection() {

  return (

    <section
      className="
        rounded-[32px]
        border
        border-zinc-900
        bg-zinc-950/70
        backdrop-blur-xl
        p-8
      "
    >

      <div className="mb-8">

        <p
          className="
            text-sm
            uppercase
            tracking-[0.22em]
            text-purple-400
            mb-2
          "
        >
          Statistics
        </p>

        <h2
          className="
            text-4xl
            font-black
          "
        >
          Platform Metrics
        </h2>

      </div>

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-4
          gap-6
        "
      >

        {[
          "Followers",
          "Downloads",
          "Likes",
          "Views",
        ].map((stat) => (

          <div
            key={stat}
            className="
              rounded-2xl
              border
              border-zinc-900
              bg-black/50
              p-6
            "
          >

            <p
              className="
                text-sm
                text-zinc-500
                mb-3
              "
            >
              {stat}
            </p>

            <h3
              className="
                text-4xl
                font-black
              "
            >
              --
            </h3>

          </div>

        ))}

      </div>

    </section>

  );

}