import Link from "next/link";

type Props = {
  mod: any;
};

export default function DashboardModCard({
  mod,
}: Props) {

  return (

    <div
      className="
        rounded-3xl
        overflow-hidden
        border
        border-zinc-800
        bg-zinc-900
      "
    >

      <img
        src={mod.image}
        alt={mod.title}
        className="
          w-full
          h-52
          object-cover
        "
      />

      <div className="p-5">

        <h3
          className="
            text-lg
            font-semibold
            mb-4
          "
        >
          {mod.title}
        </h3>

        <div
          className="
            flex
            gap-3
          "
        >

          <Link
            href={`/mods/${mod.id}`}
            className="
              flex-1
              text-center
              px-4
              py-3
              rounded-xl
              border
              border-zinc-700
              hover:border-purple-500
              transition
              text-sm
            "
          >
            View
          </Link>

          <Link
            href={`/dashboard/mods/${mod.id}/edit`}
            className="
              flex-1
              text-center
              px-4
              py-3
              rounded-xl
              bg-purple-600
              hover:bg-purple-500
              transition
              text-sm
            "
          >
            Edit
          </Link>

        </div>

      </div>

    </div>

  );

}