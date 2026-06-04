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
    search,
    setSearch,
  ] = useState("");

  const [
    activeFilter,
    setActiveFilter,
  ] = useState("all");

  const [
      sortBy,
      setSortBy,
    ] = useState("newest-release");

  const filteredMods =
  mods
    .filter((item: any) => {

      const mod = item.mods;

      if (!mod)
        return false;

      const matchesStatus =
        activeFilter === "all"
          ? true
          : mod.status?.toLowerCase() ===
            activeFilter;

      const matchesSearch =
        mod.title
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          );

      return (
        matchesStatus &&
        matchesSearch
      );

    })
    .sort((a: any, b: any) => {

      const modA = a.mods;
      const modB = b.mods;

      switch (sortBy) {

        case "newest-release":
          return (
            new Date(
              modB.created_at || 0
            ).getTime() -
            new Date(
              modA.created_at || 0
            ).getTime()
          );

        case "oldest-release":
          return (
            new Date(
              modA.created_at || 0
            ).getTime() -
            new Date(
              modB.created_at || 0
            ).getTime()
          );

        case "recently-added":
          return (
            new Date(
              modB.added_at || 0
            ).getTime() -
            new Date(
              modA.added_at || 0
            ).getTime()
          );

        case "recently-updated":
          return (
            new Date(
              modB.updated_at || 0
            ).getTime() -
            new Date(
              modA.updated_at || 0
            ).getTime()
          );

        case "a-z":
          return modA.title.localeCompare(
            modB.title
          );

        case "z-a":
          return modB.title.localeCompare(
            modA.title
          );

        default:
          return 0;

      }

    });
      
  const publishedCount =
    mods.filter(
      (item: any) =>
        item.mods?.status?.toLowerCase() ===
        "published"
    ).length;

  const draftCount =
    mods.filter(
      (item: any) =>
        item.mods?.status?.toLowerCase() ===
        "draft"
    ).length;

  const archivedCount =
    mods.filter(
      (item: any) =>
        item.mods?.status?.toLowerCase() ===
        "archived"
    ).length;

  const counts = {

    all: mods.length,

    published: publishedCount,

    draft: draftCount,

    archived: archivedCount,

  };

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

      <input
        type="text"
        placeholder="Search your mods..."
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
        className="
          w-full
          md:w-96
          px-4
          py-3
          mb-6
          rounded-xl
          bg-zinc-900
          border
          border-zinc-800
          focus:outline-none
          focus:border-purple-500
        "
      />

      <div
  className="
    mb-6
  "
>

  <select
    value={sortBy}
    onChange={(e) =>
      setSortBy(
        e.target.value
      )
    }
    className="
      px-4
      py-3
      rounded-xl
      bg-zinc-900
      border
      border-zinc-800
      focus:outline-none
      focus:border-purple-500
    "
  >

    <option value="newest-release">
      Newest Release
    </option>

    <option value="oldest-release">
      Oldest Release
    </option>

    <option value="recently-added">
      Recently Added
    </option>

    <option value="recently-updated">
      Recently Updated
    </option>

    <option value="a-z">
      A-Z
    </option>

    <option value="z-a">
      Z-A
    </option>

  </select>

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
              filter.slice(1)}{" "}
            ({counts[
              filter as keyof typeof counts
            ]})
          </button>

        ))}

      </div>

        <p
          className="
            text-sm
            text-zinc-500
            mb-6
          "
        >
          Showing {filteredMods.length} mods
        </p>

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