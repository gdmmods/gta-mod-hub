export const dynamic = "force-dynamic";

import FavoritesGridClient from "@/components/FavoritesGridClient";

export default function FavoritesPage() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <div className="border-b border-zinc-800 px-10 py-6">
        <h1 className="text-3xl font-bold">
          Your Favorites
        </h1>

        <p className="text-gray-400 mt-2">
          Mods you saved on this device.
        </p>
      </div>

      {/* GRID */}
      <FavoritesGridClient />
    </main>
  );
}