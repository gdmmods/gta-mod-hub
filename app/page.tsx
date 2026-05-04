export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ModsGridClient from "@/components/ModsGridClient";

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
    mod_creators (
      creators:creator_id (
        id,
        name
      )
    )
  `);

  if (sort === "likes") {
    query = query.order("likes", { ascending: false });
  } else if (sort === "downloads") {
    query = query.order("downloads", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2));
    return <div className="text-white p-10">Error loading mods</div>;
  }

  /* -----------------------------
     CLEAN NORMALIZATION (NO LEGACY)
  ----------------------------- */
  const mods =
    data
      ?.filter((m: any) => m && m.id)
      .map((m: any) => ({
        id: m.id,
        title: m.title ?? "Untitled",
        image: m.image ?? "/placeholder.jpg",
        category: m.category ?? null,
        description: m.description ?? "",
        likes: m.likes ?? 0,
        downloads: m.downloads ?? 0,
        source_url: m.source_url ?? "#",

        // ✅ KEEP RELATIONAL DATA ONLY
        mod_creators: m.mod_creators ?? [],
      })) || [];

  const featured = mods[0];

  /* -----------------------------
     FEATURED CREATOR STRING (UI ONLY)
  ----------------------------- */
  const featuredCreators =
    featured?.mod_creators?.length
      ? featured.mod_creators
          .map((mc: any) => mc.creators?.name)
          .filter(Boolean)
          .join(" • ")
      : "Unknown";

  return (
    <main className="min-h-screen bg-black text-white">
      {/* NAVBAR */}
      <div className="flex justify-between items-center px-10 py-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold">ModVault</h1>

        <div className="flex gap-6 text-sm text-gray-400 items-center">
          <Link href="/" className="hover:text-white">Mods</Link>
          <Link href="/creators" className="hover:text-white">Creators</Link>
          <Link href="/?sort=likes" className="hover:text-white">Trending</Link>

          <Link
            href="/upload"
            className="ml-4 bg-white text-black px-4 py-1.5 rounded-lg text-sm hover:opacity-80 transition"
          >
            + Upload
          </Link>
        </div>
      </div>

      {/* HERO */}
      <div className="max-w-6xl mx-auto px-6 mt-12">
        <h2 className="text-4xl font-bold leading-tight">
          Discover. Support. <br /> Empower Creators.
        </h2>

        <p className="mt-3 text-gray-400">
          Find the best GTA V car mods worldwide — curated and easy to explore.
        </p>
      </div>

      {/* FEATURED */}
      {featured && (
        <div className="max-w-6xl mx-auto px-6 mt-10">
          <Link href={`/mods/${featured.id}`} className="block group">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={featured.image}
                className="w-full h-[300px] object-cover group-hover:scale-[1.03] transition duration-500"
                alt={featured.title}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-0 p-6">
                <h2 className="text-2xl font-bold">{featured.title}</h2>
                <p className="text-gray-300 text-sm">
                  by {featuredCreators}
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* SORT */}
      <div className="max-w-6xl mx-auto px-6 mt-8 flex gap-4 text-sm">
        <Link href="/" className={!sort ? "text-white font-semibold" : "text-gray-400"}>
          Newest
        </Link>
        <Link href="/?sort=likes" className={sort === "likes" ? "text-white font-semibold" : "text-gray-400"}>
          Most Liked
        </Link>
        <Link href="/?sort=downloads" className={sort === "downloads" ? "text-white font-semibold" : "text-gray-400"}>
          Most Downloaded
        </Link>
      </div>

      {/* GRID */}
      <ModsGridClient mods={mods} />
    </main>
  );
}