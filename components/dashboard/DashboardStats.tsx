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
        gap-6
        mb-14
      "
    >

      <div
        className="
          p-6
          rounded-3xl
          border
          border-zinc-800
          bg-zinc-900
        "
      >

        <p className="text-sm text-gray-500 mb-2">
          Creator Profiles
        </p>

        <p className="text-3xl font-bold">
          {creatorCount}
        </p>

      </div>

      <div
        className="
          p-6
          rounded-3xl
          border
          border-zinc-800
          bg-zinc-900
        "
      >

        <p className="text-sm text-gray-500 mb-2">
          Uploaded Mods
        </p>

        <p className="text-3xl font-bold">
          {modCount}
        </p>

      </div>

      <div
        className="
          p-6
          rounded-3xl
          border
          border-zinc-800
          bg-zinc-900
        "
      >

        <p className="text-sm text-gray-500 mb-2">
          Status
        </p>

        <p className="text-3xl font-bold">
          Active
        </p>

      </div>

    </div>

  );

}