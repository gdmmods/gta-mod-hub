export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ModsGridClient from "@/components/ModsGridClient";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;

  const creatorName = decodeURIComponent(name || "");

  if (!creatorName) {
    return <div className="text-white p-10">Invalid creator</div>;
  }

  const { data, error } = await supabase
    .from("mods")
    .select("*")
    .eq("creator", creatorName)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return <div className="text-white p-10">Error loading creator</div>;
  }

  // ✅ NORMALIZATION (same as homepage)
  const mods =
    data
      ?.filter((m: any) => m && m.id)
      .map((m: any) => ({
        id: m.id,
        title: m.title ?? m.name ?? "Untitled",
        image: m.image ?? m.image_url ?? "/placeholder.jpg",
        creator:
          m.creator && m.creator.trim() !== ""
            ? m.creator
            : "Unknown",
        category: m.category ?? null,
        description: m.description ?? "",
        likes: m.likes ?? 0,
        downloads: m.downloads ?? 0,
        source_url: m.source_url ?? "#",
      })) || [];

  // ✅ AGGREGATES
  const totalLikes = mods.reduce((sum, m) => sum + (m.likes ?? 0), 0);
  const totalDownloads = mods.reduce((sum, m) => sum + (m.downloads ?? 0), 0);

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
        <h1 className="text-3xl font-bold">{creatorName}</h1>

        <p className="mt-3 flex items-center gap-6 text-sm">
  <span className="text-white font-medium">
    {mods.length} mod{mods.length !== 1 && "s"}
  </span>

  <span className="flex items-center gap-1 text-pink-500 font-medium">
    ❤️ {totalLikes}
  </span>

  <span className="flex items-center gap-1 text-blue-400 font-medium">
    ⬇ {totalDownloads}
  </span>
</p>
      </div>

      {/* GRID */}
      {mods.length > 0 ? (
        <ModsGridClient mods={mods} />
      ) : (
        <div className="text-center text-gray-500 mt-20">
          No mods uploaded yet.
        </div>
      )}

    </main>
  );
}