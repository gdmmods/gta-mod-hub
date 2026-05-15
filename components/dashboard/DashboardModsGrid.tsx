import Link from "next/link";

import DashboardModCard from "./DashboardModCard";

type Props = {
  mods: any[];
};

export default function DashboardModsGrid({
  mods,
}: Props) {

  return (

    <div>

      <div
        className="
          flex
          items-center
          justify-between
          mb-6
        "
      >

        <h2
          className="
            text-2xl
            font-semibold
          "
        >
          Your Mods
        </h2>

        <Link
          href="/upload"
          className="
            px-5
            py-3
            rounded-xl
            bg-purple-600
            hover:bg-purple-500
            transition
            text-sm
            font-medium
          "
        >
          Upload Mod
        </Link>

      </div>

      <div
        className="
          grid
          md:grid-cols-2
          xl:grid-cols-3
          gap-6
        "
      >

        {mods.map((item: any) => {

          const mod =
            item.mods;

          if (!mod)
            return null;

          return (
            <DashboardModCard
              key={mod.id}
              mod={mod}
            />
          );

        })}

      </div>

    </div>

  );

}