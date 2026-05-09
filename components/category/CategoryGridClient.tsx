"use client";

import { useMemo, useState } from "react";

import ModsGridClient from "@/components/ModsGridClient";

type SortType =
  | "likes"
  | "downloads"
  | "newest";

export default function CategoryGridClient({
  mods,
}: {
  mods: any[];
}) {

  const [search, setSearch] =
    useState("");

  const [sort, setSort] =
    useState<SortType>("likes");

  const [verifiedOnly, setVerifiedOnly] =
    useState(false);

  /* ---------------- FILTER + SEARCH + SORT ---------------- */
  const filteredMods = useMemo(() => {

    const query =
      search.toLowerCase();

    let results =
      mods.filter((mod) => {

        const matchesSearch =
          mod.title
            ?.toLowerCase()
            .includes(query) ||

          mod.description
            ?.toLowerCase()
            .includes(query) ||

          mod.category
            ?.toLowerCase()
            .includes(query);

        const matchesVerified =
          verifiedOnly
            ? mod.verified
            : true;

        return (
          matchesSearch &&
          matchesVerified
        );
      });

    /* ---------------- SORTING ---------------- */
    results.sort((a, b) => {

      if (sort === "likes") {
        return (
          (b.likes ?? 0) -
          (a.likes ?? 0)
        );
      }

      if (sort === "downloads") {
        return (
          (b.downloads ?? 0) -
          (a.downloads ?? 0)
        );
      }

      return (
        new Date(
          b.created_at || 0
        ).getTime() -

        new Date(
          a.created_at || 0
        ).getTime()
      );
    });

    return results;

  }, [
    mods,
    search,
    sort,
    verifiedOnly,
  ]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-12">

      {/* TOP BAR */}
      <div className="mb-8 flex flex-col gap-5">

        {/* SEARCH */}
        <div
          className="
            flex
            items-center
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900/70
            overflow-hidden
            max-w-xl
          "
        >

          <div className="px-4 text-zinc-500">
            🔍
          </div>

          <input
            type="text"
            placeholder="Search this category..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="
              w-full
              bg-transparent
              px-2
              py-4
              text-sm
              outline-none
              placeholder:text-zinc-500
            "
          />

        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3">

          <button
            onClick={() =>
              setSort("likes")
            }
            className={`
              px-4
              py-2
              rounded-xl
              border
              text-sm
              transition

              ${
                sort === "likes"
                  ? "bg-white text-black border-white"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              }
            `}
          >
            Most Liked
          </button>

          <button
            onClick={() =>
              setSort("downloads")
            }
            className={`
              px-4
              py-2
              rounded-xl
              border
              text-sm
              transition

              ${
                sort === "downloads"
                  ? "bg-white text-black border-white"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              }
            `}
          >
            Most Downloaded
          </button>

          <button
            onClick={() =>
              setSort("newest")
            }
            className={`
              px-4
              py-2
              rounded-xl
              border
              text-sm
              transition

              ${
                sort === "newest"
                  ? "bg-white text-black border-white"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              }
            `}
          >
            Newest
          </button>

          <button
            onClick={() =>
              setVerifiedOnly(
                !verifiedOnly
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
                verifiedOnly
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              }
            `}
          >
            ✔ Verified
          </button>

        </div>

      </div>

      {/* EMPTY */}
      {!filteredMods.length ? (

        <div
          className="
            rounded-3xl
            border
            border-zinc-800
            bg-zinc-900/40
            p-10
            text-center
          "
        >

          <h2 className="text-2xl font-bold">
            No Mods Found
          </h2>

          <p className="text-zinc-500 mt-3">
            No matching mods in this category.
          </p>

        </div>

      ) : (

        <ModsGridClient
          mods={filteredMods}
          showSearch={false}
        />

      )}

    </div>
  );
}