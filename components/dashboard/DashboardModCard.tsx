import Link from "next/link";

type Props = {
  mod: any;
};

export default function DashboardModCard({
  mod,
}: Props) {

  const createdDate =
    new Date(
      mod.created_at
    ).toLocaleDateString();

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

      <div className="relative">

        <img
          src={mod.image}
          alt={mod.title}
          className="
            w-full
            h-52
            object-cover
          "
        />

        <div
          className="
            absolute
            top-4
            left-4
            px-3
            py-1
            rounded-full
            text-xs
            border
            border-zinc-700
            bg-black/70
            backdrop-blur
          "
        >
          {mod.status}
        </div>

      </div>

      <div className="p-5">

        <h3
          className="
            text-lg
            font-semibold
          "
        >
          {mod.title}
        </h3>

        <p
          className="
            mt-2
            text-sm
            text-zinc-500
          "
        >
          Created {createdDate}
        </p>

        <div
          className="
            mt-5
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