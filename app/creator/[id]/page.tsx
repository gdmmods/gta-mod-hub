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
    .select("id, name, avatar, bio, banner")
    .eq("id", creatorId)
    .maybeSingle();

  if (creatorError || !creator) {
    console.error("CREATOR ERROR:", creatorError);
    return <div className="text-white p-10">Creator not found</div>;
  }

  /* -----------------------------
     FETCH RELATIONS
  ----------------------------- */
  const { data: relations, error: relationError } = await supabase
    .from("mod_creators")
    .select("mod_id")
    .eq("creator_id", creatorId);

  if (relationError) {
    console.error("RELATION ERROR:", relationError);
  }

  const modIds = relations?.map((r) => r.mod_id).filter(Boolean) || [];

  /* -----------------------------
     FETCH MODS (SAFE)
  ----------------------------- */
  let modsData: any[] = [];

  if (modIds.length > 0) {
    const { data, error } = await supabase
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
        mod_creators (
          creators (
            id,
            name
          )
        )
      `)
      .in("id", modIds);

    if (error) {
      console.error("MOD FETCH ERROR:", error);
    }

    modsData = data || [];
  }

  /* -----------------------------
     NORMALIZE MODS
  ----------------------------- */
  const mods =
    modsData.map((m: any) => ({
      id: m.id,
      title: m.title ?? "Untitled",
      image: m.image ?? "/placeholder.jpg",
      category: m.category ?? null,
      description: m.description ?? "",
      likes: m.likes ?? 0,
      downloads: m.downloads ?? 0,
      source_url: m.source_url ?? "#",
      mod_creators: m.mod_creators ?? [],
    })) || [];

  /* -----------------------------
     STATS
  ----------------------------- */
  const totalLikes = mods.reduce((s, m) => s + (m.likes || 0), 0);
  const totalDownloads = mods.reduce((s, m) => s + (m.downloads || 0), 0);

  /* -----------------------------
     FEATURED MOD
  ----------------------------- */
  const featured =
    mods.length > 0
      ? [...mods].sort((a, b) => b.downloads - a.downloads)[0]
      : null;

  const bannerImage =
    creator.banner || featured?.image || "/placeholder.jpg";

  return (
    <main className="min-h-screen bg-black text-white">

      {/* NAVBAR */}
      <div className="px-10 py-6 border-b border-zinc-800 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          ModVault
        </Link>

        {/* EDIT BUTTON */}
        <Link
          href={`/creator/edit/${creator.id}`}
          className="text-sm text-gray-400 hover:text-white"
        >
          Edit profile
        </Link>
      </div>

      {/* BANNER */}
      <div className="relative h-56 w-full overflow-hidden">
        <img
          src={bannerImage}
          className="w-full h-full object-cover"
          alt={creator.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>

      {/* PROFILE HEADER */}
      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-10">
        <div className="flex items-end gap-6">

          {/* AVATAR */}
          <img
            src={creator.avatar || "https://placehold.co/100x100?text=👤"}
            className="w-28 h-28 rounded-xl object-cover border-2 border-black shadow-lg"
            alt={creator.name}
          />

          <div>
            <h1 className="text-3xl font-bold">{creator.name}</h1>

            <p className="mt-2 text-gray-400 max-w-lg">
              {creator.bio || "No bio yet."}
            </p>

            <div className="mt-3 flex gap-6 text-sm">
              <span>{mods.length} mods</span>
              <span className="text-pink-500">❤️ {totalLikes}</span>
              <span className="text-blue-400">⬇ {totalDownloads}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURED MOD */}
      {featured && (
        <div className="max-w-6xl mx-auto px-6 mt-12">
          <h2 className="text-lg font-semibold mb-3 text-white/90">
            ⭐ Featured Mod
          </h2>

          <Link href={`/mods/${featured.id}`}>
            <div className="relative rounded-xl overflow-hidden group cursor-pointer">
              <img
                src={featured.image}
                className="w-full h-64 object-cover group-hover:scale-[1.04] transition duration-500"
                alt={featured.title}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

              <div className="absolute bottom-0 p-4">
                <div className="text-lg font-semibold">
                  {featured.title}
                </div>
                <div className="text-sm text-gray-300 flex gap-3">
                  <span>⬇ {featured.downloads}</span>
                  <span>❤️ {featured.likes}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* GRID */}
      {mods.length > 0 ? (
        <div className="mt-6">
          <ModsGridClient mods={mods} />
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-20">
          No mods yet.
        </div>
      )}
    </main>
  );
}