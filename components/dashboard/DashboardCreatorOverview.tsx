type Props = {

  creator: any;

  modCount: number;

};

export default function DashboardCreatorOverview({

  creator,

  modCount,

}: Props) {

  if (!creator)
    return null;

  return (

    <div
      className="
        mb-10
        rounded-3xl
        border
        border-zinc-800
        bg-zinc-900/50
        p-6
      "
    >

      <p
        className="
          text-[10px]
          uppercase
          tracking-[0.22em]
          text-purple-400
        "
      >
        Current Creator Overview
      </p>

      <h2
        className="
          mt-2
          text-2xl
          font-bold
        "
      >
        {creator.name}
      </h2>

      <div
        className="
          mt-6
          grid
          grid-cols-2
          md:grid-cols-4
          gap-4
        "
      >

        <div
          className="
            rounded-2xl
            border
            border-zinc-800
            p-4
          "
        >

          <p
            className="
              text-xs
              uppercase
              text-zinc-500
            "
          >
            Mods
          </p>

          <p
            className="
              mt-2
              text-xl
              font-semibold
            "
          >
            {modCount}
          </p>

        </div>

        <div
          className="
            rounded-2xl
            border
            border-zinc-800
            p-4
          "
        >

          <p
            className="
              text-xs
              uppercase
              text-zinc-500
            "
          >
            Downloads
          </p>

          <p
            className="
              mt-2
              text-xl
              font-semibold
            "
          >
            0
          </p>

        </div>

        <div
          className="
            rounded-2xl
            border
            border-zinc-800
            p-4
          "
        >

          <p
            className="
              text-xs
              uppercase
              text-zinc-500
            "
          >
            Followers
          </p>

          <p
            className="
              mt-2
              text-xl
              font-semibold
            "
          >
            0
          </p>

        </div>

        <div
          className="
            rounded-2xl
            border
            border-zinc-800
            p-4
          "
        >

          <p
            className="
              text-xs
              uppercase
              text-zinc-500
            "
          >
            Likes
          </p>

          <p
            className="
              mt-2
              text-xl
              font-semibold
            "
          >
            0
          </p>

        </div>

      </div>

      <div
        className="
          mt-6
          rounded-2xl
          border
          border-zinc-800
          px-5
          py-4
          flex
          flex-wrap
          gap-6
          text-sm
        "
      >

        <span>
          <span className="text-zinc-500">
            Tier
          </span>{" "}
          <span className="text-purple-400 font-medium">
            Trusted Creator
          </span>
        </span>

        <span>
          <span className="text-zinc-500">
            Team
          </span>{" "}
          <span className="text-white font-medium">
            1
          </span>
        </span>

        <span>
          <span className="text-zinc-500">
            Default
          </span>{" "}
          <span className="text-white font-medium">
            Yes
          </span>
        </span>

        <span>
          <span className="text-zinc-500">
            Status
          </span>{" "}
          <span className="text-green-400 font-medium">
            Active
          </span>
        </span>

      </div>

    </div>

  );

}