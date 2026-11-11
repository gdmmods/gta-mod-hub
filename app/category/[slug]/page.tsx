import { supabase } from "@/lib/supabase/client";

import Navbar from "@/components/layout/Navbar";

import CategoryHub from "@/components/CategoryHub";

import CategoryGridClient from "@/components/category/CategoryGridClient";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {

  const { slug } = await params;

  /* FETCH MODS */
  const modsQuery = supabase
    .from("mods")
    .select("*")
    .eq("status", "published")
    .in("visibility", ["public", "early_access"]).in("release_state", ["public", "early_access"]);

  // Include legacy vehicle labels until the data backfill is reviewed.
  const scopedQuery = slug === "vehicles"
    ? modsQuery.or("category.eq.vehicles,category.eq.vehicle,category.eq.car,category.eq.cars,category.ilike.Cars / %,category.ilike.paintjob%,category.ilike.aircraft%,category.ilike.airplane%,category.ilike.aeroplane%,category.ilike.helicopter%,category.ilike.plane%,category.ilike.boat%,category.ilike.jet ski%,category.ilike.waverunner%,category.ilike.wheel%,category.ilike.rim%,category.ilike.bike%,category.ilike.motorcycle%,category.ilike.livery%")
    : modsQuery.eq("category", slug);

  const { data: mods, error } = await scopedQuery.order("likes", {
    ascending: false,
  });

  if (error) {
    console.log(error);
  }

  const formattedTitle =
    slug.charAt(0).toUpperCase() +
    slug.slice(1);

  return (
    <main className="min-h-screen bg-black text-white">

      {/* NAVBAR */}
            <Navbar />

      {/* HERO */}
      <div
        className="
          border-b
          border-zinc-800
          bg-gradient-to-b
          from-zinc-900
          to-black
        "
      >

        <div className="max-w-[1600px] mx-auto px-6 pt-16 pb-10">

          <p className="text-purple-400 text-sm tracking-[0.25em] uppercase">
            Category
          </p>

          <h1 className="text-6xl font-black mt-4">
            {formattedTitle}
          </h1>

          <p className="text-zinc-500 mt-4 text-lg">
            Explore {formattedTitle.toLowerCase()} mods
            from the community.
          </p>

          <div className="mt-6 flex gap-4 flex-wrap">

            <div
              className="
                px-4
                py-3
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-900/70
              "
            >
              <p className="text-zinc-500 text-sm">
                Total Mods
              </p>

              <p className="text-2xl font-bold mt-1">
                {mods?.length || 0}
              </p>
            </div>

            <div
              className="
                px-4
                py-3
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-900/70
              "
            >
              <p className="text-zinc-500 text-sm">
                Sort
              </p>

              <p className="text-lg font-medium mt-1">
                Most Liked
              </p>
            </div>


          </div>

          {/* CATEGORY HUB */}
          <CategoryHub variant="compact" activeSlug={slug} />

        </div>

      </div>

      <CategoryGridClient mods={mods || []} category={slug} />
      
    </main>
  );
}
