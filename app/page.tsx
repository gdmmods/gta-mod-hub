export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";

import Navbar from "@/components/layout/Navbar";

import Hero from "@/components/home/Hero";
import FeaturedMods from "@/components/home/FeaturedMods";
import SortBar from "@/components/home/SortBar";
import PlatformStats from "@/components/home/PlatformStats";
import CTASection from "@/components/home/CTASection";
import RoadmapPreview from "@/components/home/RoadmapPreview";

import ModsGridClient from "@/components/ModsGridClient";
import CategoryHub from "@/components/CategoryHub";

export default async function Home(props: {
  searchParams?: Promise<{ sort?: string }>;
}) {
  const searchParams = await props.searchParams;
  const sort = searchParams?.sort;

  let query = supabase
    .from("mods")
    .select(`
      id,
      title,
      image,
      category,
      description,
      likes,
      downloads,
      source_url,
      created_at,
      favorites(count),
      mod_creators (
        creators (
          id,
          name
        )
      )
    `);

  /* -----------------------------
     SORTING
  ----------------------------- */
  if (sort === "likes") {
    query = query.order("likes", {
      ascending: false,
    });
  } else if (sort === "downloads") {
    query = query.order("downloads", {
      ascending: false,
    });
  } else {
    query = query.order("created_at", {
      ascending: false,
    });
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      "SUPABASE ERROR:",
      JSON.stringify(error, null, 2)
    );

    return (
      <div className="p-10 text-white">
        Error loading mods
      </div>
    );
  }

  /* -----------------------------
     NORMALIZE
  ----------------------------- */
  const mods =
    data?.map((m: any) => ({
      id: m.id,

      title:
        m.title ?? "Untitled",

      image:
        m.image ?? "/placeholder.jpg",

      category:
        m.category ?? null,

      description:
        m.description ?? "",

      likes:
        m.likes ?? 0,

      downloads:
        m.downloads ?? 0,

      source_url:
        m.source_url ?? "#",

      favorites:
        m.favorites?.[0]?.count || 0,

      mod_creators:
        m.mod_creators ?? [],
    })) || [];

  /* -----------------------------
     FEATURED
  ----------------------------- */
  const featured = mods[0];

  const featuredCreators =
    featured?.mod_creators?.length
      ? featured.mod_creators
          .map(
            (mc: any) =>
              mc.creators?.name
          )
          .filter(Boolean)
          .join(" • ")
      : "Unknown";

  return (
    <main
      className="
        min-h-screen
        overflow-hidden
        bg-[#040404]
        text-white
      "
    >

      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <Hero />

      {/* CATEGORY HUB */}
      <CategoryHub />

      {/* FEATURED */}
      <FeaturedMods
        featured={featured}
        featuredCreators={featuredCreators}
      />

      {/* SORT */}
      <SortBar sort={sort} />

      {/* GRID */}
      <ModsGridClient mods={mods} />

      {/* ROADMAP */}
      <RoadmapPreview />

      {/* STATS */}
      <PlatformStats />

      {/* CTA */}
      <CTASection />

    </main>
  );
}