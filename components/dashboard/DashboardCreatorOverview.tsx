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

    </div>

  );

}