type Props = {
  creatorCount: number;
  modCount: number;
};

export default function DashboardStats({
  creatorCount,
  modCount,
}: Props) {

  return (

    <div
      className="
        grid
        md:grid-cols-3
        gap-4
        mb-10
      "
    >

      <div
        className="
          p-4
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-900/50
        "
      >

        <p
          className="
            text-xs
            uppercase
            tracking-wider
            text-zinc-500
          "
        >
          Creator Profiles
        </p>

        <p
          className="
            mt-2
            text-xl
            font-semibold
          "
        >
          {creatorCount}
        </p>

      </div>

      <div
        className="
          p-4
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-900/50
        "
      >

        <p
          className="
            text-xs
            uppercase
            tracking-wider
            text-zinc-500
          "
        >
          Total Mods
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
          p-4
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-900/50
        "
      >

        <p
          className="
            text-xs
            uppercase
            tracking-wider
            text-zinc-500
          "
        >
          Account Status
        </p>

        <p
          className="
            mt-2
            text-xl
            font-semibold
            text-green-400
          "
        >
          Active
        </p>

      </div>

    </div>

  );

}