"use client";

import { useMemo, useState } from "react";

import ModsGridClient from "@/components/ui/ModsGridClient";
import type { Database } from "@/types/supabase";
import {
  matchesVehicleSubcategory,
  VEHICLE_SUBCATEGORIES,
  type VehicleSubcategoryFilter,
} from "@/lib/vehicle-subcategories";

type SortType =
  | "likes"
  | "downloads"
  | "newest";

type CategoryMod = Database["public"]["Tables"]["mods"]["Row"] & {
  subcategory?: string | null;
};

export default function CategoryGridClient({
  mods,
  category,
}: {
  mods: CategoryMod[];
  category?: string;
}) {

  const [search, setSearch] =
    useState("");

  const [sort, setSort] =
    useState<SortType>("likes");

  const [verifiedOnly, setVerifiedOnly] =
    useState(false);

  const [vehicleSubcategory, setVehicleSubcategory] =
    useState<VehicleSubcategoryFilter>("All");

  /* ---------------- FILTER + SEARCH + SORT ---------------- */
  const filteredMods = useMemo(() => {

    const query =
      search.toLowerCase();

    const results =
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

        const matchesSubcategory =
          category !== "vehicles" ||
          matchesVehicleSubcategory(mod, vehicleSubcategory);

        return (
          matchesSearch &&
          matchesVerified &&
          matchesSubcategory
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
    category,
    vehicleSubcategory,
  ]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 pt-8 pb-12">

      {/* TOP BAR */}
      <div className="mb-8 flex flex-col gap-5">

        {category === "vehicles" && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter vehicles by subcategory">
            <button
              type="button"
              aria-pressed={vehicleSubcategory === "All"}
              onClick={() => setVehicleSubcategory("All")}
              className={`rounded-xl border px-4 py-2 text-sm transition ${
                vehicleSubcategory === "All"
                  ? "border-purple-500 bg-purple-500/15 text-purple-200"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              All Vehicles
            </button>
            {VEHICLE_SUBCATEGORIES.map((subcategory) => (
              <button
                key={subcategory}
                type="button"
                aria-pressed={vehicleSubcategory === subcategory}
                onClick={() => setVehicleSubcategory(subcategory)}
                className={`rounded-xl border px-4 py-2 text-sm transition ${
                  vehicleSubcategory === subcategory
                    ? "border-purple-500 bg-purple-500/15 text-purple-200"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
                }`}
              >
                {subcategory}
              </button>
            ))}
          </div>
        )}

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
          // Normalize legacy labels for display while filtering against stored values.
          mods={(category === "vehicles"
            ? filteredMods.map((mod) => ({ ...mod, category: "vehicles" }))
            : filteredMods) as unknown as Parameters<typeof ModsGridClient>[0]["mods"]}
          showSearch={false}
        />

      )}

    </div>
  );
}
