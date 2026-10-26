export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/layout/Navbar";

type CreatorListing = { id: string; name: string; owner_type: string | null };
type ModSummary = { id: string; image: string | null; likes: number | null; downloads: number | null };

export default async function CreatorsPage() {
  /* -----------------------------
     FETCH ALL CREATORS
  ----------------------------- */
  const { data: creatorData, error } = await supabase
    .from("creators")
    .select("id, name, owner_type");

  if (error || !creatorData) {
    console.error("CREATORS ERROR:", error);
    return <div className="text-white p-10">Error loading creators</div>;
  }

  const creators = creatorData as CreatorListing[];

  const creatorIds = creators.map((c) => c.id);

  /* -----------------------------
     FETCH RELATIONS
  ----------------------------- */
  const { data: relations } = await supabase
    .from("mod_creators")
    .select("creator_id, mod_id")
    .in("creator_id", creatorIds);

  const modIds = relations?.map((r) => r.mod_id) || [];

  /* -----------------------------
     FETCH MODS (FULL DATA)
  ----------------------------- */
  const { data: mods } = await supabase
    .from("mods")
    .select("id, image, likes, downloads")
    .in("id", modIds);

  /* -----------------------------
     BUILD MOD MAP
  ----------------------------- */
  const modMap: Record<string, ModSummary> = {};
  mods?.forEach((m) => {
    if (m?.id) modMap[m.id] = m;
  });

  /* -----------------------------
     BUILD STATS + TOP MOD
  ----------------------------- */
  const statsMap: Record<
    string,
    { mods: number; likes: number; downloads: number }
  > = {};

  const topModMap: Record<string, ModSummary> = {};

  relations?.forEach((r) => {
    if (!r?.creator_id || !r?.mod_id) return;

    const mod = modMap[r.mod_id];

    // init stats
    if (!statsMap[r.creator_id]) {
      statsMap[r.creator_id] = {
        mods: 0,
        likes: 0,
        downloads: 0,
      };
    }

    // stats
    statsMap[r.creator_id].mods += 1;
    statsMap[r.creator_id].likes += mod?.likes || 0;
    statsMap[r.creator_id].downloads += mod?.downloads || 0;

    // top mod (by downloads)
    const currentTop = topModMap[r.creator_id];

    if (
      mod &&
      (!currentTop ||
        (mod.downloads || 0) > (currentTop.downloads || 0))
    ) {
      topModMap[r.creator_id] = mod;
    }
  });

  /* -----------------------------
     MERGE + SORT
  ----------------------------- */
  const enriched =
    creators.map((c) => {
      const stats = statsMap[c.id] || {
        mods: 0,
        likes: 0,
        downloads: 0,
      };

      const topMod = topModMap[c.id];

      return {
        ...c,
        stats,
        image: topMod?.image || "/placeholder.jpg",
      };
    }) || [];

  // sort by downloads (impact)
  enriched.sort((a, b) => b.stats.downloads - a.stats.downloads);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* NAVBAR */}
      <Navbar />

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        <h1 className="text-3xl font-bold mb-6">Top Creators</h1>

        <div className="grid md:grid-cols-2 gap-4">
          {enriched.map((c) => (
            <Link
              key={c.id}
              href={`/creator/${c.id}`}
              className="bg-neutral-900 rounded-xl overflow-hidden hover:bg-neutral-800 transition"
            >
              {/* IMAGE */}
              <div className="h-32 w-full overflow-hidden">
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* CONTENT */}
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold">{c.name}</span>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wider ${c.owner_type === "team" ? "border-purple-500/40 bg-purple-500/10 text-purple-200" : "border-zinc-700 bg-zinc-800/80 text-zinc-300"}`}>
                    {c.owner_type === "team" ? "TEAM" : "CREATOR"}
                  </span>
                </div>

                <div className="text-sm text-gray-400 mt-2 flex gap-4">
                  <span>{c.stats.mods} mods</span>
                  <span>❤️ {c.stats.likes}</span>
                  <span>⬇ {c.stats.downloads}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
