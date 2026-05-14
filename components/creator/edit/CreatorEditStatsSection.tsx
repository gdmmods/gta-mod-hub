"use client";

interface Props {
  creator: any;
}

export default function CreatorEditStatsSection({
  creator,
}: Props) {

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
          Analytics
        </p>

        <h2
          className="
            text-4xl
            font-black
          "
        >
          Creator Statistics
        </h2>

      </div>

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-3
          gap-6
        "
      >

        {[
          {
            label: "Followers",
            value: "12.4K",
          },
          {
            label: "Downloads",
            value: "184K",
          },
          {
            label: "Total Likes",
            value: "9.2K",
          },
        ].map((item) => (

          <div
            key={item.label}
            className="
              rounded-3xl
              border
              border-zinc-900
              bg-black/30
              p-7
            "
          >

            <p
              className="
                text-zinc-500
                mb-3
              "
            >
              {item.label}
            </p>

            <h3
              className="
                text-4xl
                font-black
              "
            >
              {item.value}
            </h3>

          </div>

        ))}

      </div>

    </section>

  );

}