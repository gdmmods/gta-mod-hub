export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ModsGridClient from "@/components/ModsGridClient";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: creatorId } = await params;

  if (!creatorId || creatorId.startsWith("legacy-")) {
    return <div className="text-white p-10">Invalid creator</div>;
  }

  /* -----------------------------
     FETCH CREATOR
  ----------------------------- */
  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .select("id, name")
    .eq("id", creatorId)
    .maybeSingle();

  if (!creator || creatorError) {
    console.error("CREATOR ERROR:", creatorError);
    return <div className="text-white p-10">Creator not found</div>;
  }

  /* -----------------------------
     FETCH MOD IDS
  ----------------------------- */
  const { data: relations, error: relationError } = await supabase
    .from("mod_creators")
    .select("mod_id")
    .eq("creator_id", creatorId);

  if (relationError) {
    console.error("MOD FETCH ERROR:", relationError);
    return <div className="text-white p-10">Error loading creator</div>;
  }

  const modIds = relations?.map((r: any) => r.mod_id) || [];

  if (modIds.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="px-10 py-6 border-b border-zinc-800">
          <Link href="/" className="text-xl font-bold">
            ModVault
          </Link>
        </div>

        <div className="text-center text-gray-500 mt-20">
          No mods yet.
        </div>
      </main>
    );
  }

  /* -----------------------------
     FETCH MODS
  ----------------------------- */
  const { data: modsData, error: modsError } = await supabase
    .from("mods")
    .select("*")
    .in("id", modIds);

  if (modsError) {
    console.error("MODS ERROR:", modsError);
    return <div className="text-white p-10">Error loading mods</div>;
  }

  /* -----------------------------
     FETCH ALL CREATORS FOR MODS
  ----------------------------- */
  const { data: creatorsData } = await supabase
    .from("mod_creators")
    .select(`
      mod_id,
      creators (
        id,
        name
      )
    `)
    .in("mod_id", modIds);

  const creatorsMap: Record<string, any[]> = {};

  creatorsData?.forEach((c: any) => {
    if (!c?.creators?.id) return;

    if (!creatorsMap[c.mod_id]) creatorsMap[c.mod_id] = [];
    creatorsMap[c.mod_id].push(c.creators);
  });

  /* -----------------------------
     NORMALIZE MODS
  ----------------------------- */
  const mods =
    modsData?.map((m: any) => ({
      id: m.id,
      title: m.title ?? "Untitled",
      image: m.image ?? "/placeholder.jpg",
      category: m.category ?? null,
      description: m.description ?? "",
      likes: m.likes ?? 0,
      downloads: m.downloads ?? 0,
      source_url: m.source_url ?? "#",
      mod_creators:
        creatorsMap[m.id]?.map((c) => ({
          creators: c,
        })) || [],
    })) || [];

  /* -----------------------------
     STATS
  ----------------------------- */
  const totalLikes = mods.reduce((sum, m) => sum + m.likes, 0);
  const totalDownloads = mods.reduce((sum, m) => sum + m.downloads, 0);

  return (
    <main className="min-h-screen bg-black text-white">

      {/* NAVBAR */}
      <div className="px-10 py-6 border-b border-zinc-800">
        <Link href="/" className="text-xl font-bold">
          ModVault
        </Link>
      </div>

      {/* HEADER */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        <h1 className="text-3xl font-bold">{creator.name}</h1>

        <p className="mt-3 flex items-center gap-6 text-sm">
          <span className="text-white font-medium">
            {mods.length} mod{mods.length !== 1 && "s"}
          </span>

          <span className="text-pink-500 font-medium">
            ❤️ {totalLikes}
          </span>

          <span className="text-blue-400 font-medium">
            ⬇ {totalDownloads}
          </span>
        </p>
      </div>

      {/* GRID */}
      {mods.length > 0 ? (
        <ModsGridClient mods={mods} />
      ) : (
        <div className="text-center text-gray-500 mt-20">
          No mods yet.
        </div>
      )}

    </main>
  );
}