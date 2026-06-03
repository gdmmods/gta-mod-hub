"use client";

import { useState } from "react";

import Link from "next/link";

import DashboardModCard from "./DashboardModCard";

type Props = {
  mods: any[];
};

export default function DashboardModsGrid({
  mods,
}: Props) {

  const [
    activeFilter,
    setActiveFilter,
  ] = useState("all");

  const filteredMods =
    activeFilter === "all"
      ? mods
      : mods.filter(
          (item: any) =>
            item.mods?.status?.toLowerCase() ===
            activeFilter
        );

  return (

    <div>

      <div
        className="
          flex
          flex-col
          md:flex-row
          md:items-center
          md:justify-between
          gap-4
          mb-6
        "
      >

        <div>

          <h2
            className="
              text-2xl
              font-semibold
            "
          >
            Your Mods
          </h2>

          <p
            className="
              text-sm
              text-zinc-500
              mt-1
            "
          >
            Manage uploads for the currently selected creator.
          </p>

        </div>

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
          flex
          flex-wrap
          gap-3
          mb-8
        "
      >

        {[
          "all",
          "published",
          "draft",
          "archived",
        ].map((filter) => (

          <button
            key={filter}
            onClick={() =>
              setActiveFilter(
                filter
              )
            }
            className={`
              px-4
              py-2
              rounded-xl
              border
              text-sm
              transition

              ${
                activeFilter === filter
                  ? "bg-purple-600 border-purple-600"
                  : "border-zinc-700 hover:border-purple-500"
              }
            `}
          >
            {filter.charAt(0).toUpperCase() +
              filter.slice(1)}
          </button>

        ))}

      </div>

      <div
        className="
          grid
          md:grid-cols-2
          xl:grid-cols-3
          gap-6
        "
      >

        {filteredMods.map(
          (item: any) => {

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

          }
        )}

      </div>

    </div>

  );

}