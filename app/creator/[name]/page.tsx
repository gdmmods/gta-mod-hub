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
    return (
      <div className="text-white p-10">
        Invalid creator
      </div>
    );
  }

  const { data, error } = await supabase
    .from("mods")
    .select("*")
    .eq("creator", creatorName)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="text-white p-10">
        Error loading creator
      </div>
    );
  }

  const mods =
    data?.map((m: any) => ({
      id: m.id,
      title: m.title || "Untitled",
      image: m.image || m.image_url || "/placeholder.jpg",
      creator: m.creator || "Unknown",
      likes: m.likes || 0,
      source_url: m.source_url || "#",
    })) || [];

  return (
    <main className="min-h-screen bg-black text-white">

      <div className="px-10 py-6 border-b border-zinc-800">
        <Link href="/" className="text-xl font-bold">
          ModVault
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        <h1 className="text-3xl font-bold">
          {creatorName}
        </h1>
      </div>

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