import Link from "next/link";
import { supabase } from "@/lib/supabase";

import Gallery from "@/components/Gallery";
import DownloadButton from "@/components/DownloadButton";
import LikeButton from "@/components/LikeButton";
import FavoriteModButton from "@/components/FavoriteModButton";

export const dynamic = "force-dynamic";

export default async function ModPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /* -----------------------------
     FETCH MOD
  ----------------------------- */
  const { data: mod, error } = await supabase
    .from("mods")
    .select(`
      *,
      favorites(count)
    `)
    .eq("id", id)
    .single();

  if (!mod || error) {
    console.log("MOD FETCH ERROR:", error);

    return (
      <div className="text-white p-10">
        Mod not found
      </div>
    );
  }

  /* -----------------------------
     FAVORITES COUNT
  ----------------------------- */
  const favoritesCount =
    mod.favorites?.[0]?.count || 0;

    <FavoriteModButton
  modId={mod.id}
  initialCount={favoritesCount}
/>

  /* -----------------------------
     FETCH CREATORS
  ----------------------------- */
  const { data: creatorsData } = await supabase
    .from("mod_creators")
    .select(`
      creators (
        id,
        name
      )
    `)
    .eq("mod_id", id);

  const creators =
    creatorsData
      ?.map((c: any) => c.creators)
      .filter(Boolean) || [];

  /* -----------------------------
     IMAGES
  ----------------------------- */
  let images: string[] = [];

  try {
    if (Array.isArray(mod.images)) {
      images = mod.images;
    } else if (
      typeof mod.images === "string" &&
      mod.images.length > 0
    ) {
      images = JSON.parse(mod.images);
    }
  } catch {
    images = [];
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* LEFT */}
        <div>
          <Gallery
            main={mod.image}
            images={images}
          />
        </div>

        {/* RIGHT */}
        <div>

          {/* TITLE */}
          <div className="flex justify-between items-start gap-4">

            <h1 className="text-4xl font-bold leading-tight max-w-[85%]">
              {mod.title}
            </h1>

            {mod.verified && (
              <div className="relative group shrink-0">

                <span className="bg-blue-600/90 text-white text-xs px-3 py-1.5 rounded-lg shadow">
                  ✔ Verified
                </span>

                <div className="absolute right-0 top-full mt-2 opacity-0 group-hover:opacity-100 pointer-events-none transition">

                  <div className="bg-neutral-800 text-white text-[11px] px-2 py-1 rounded shadow whitespace-nowrap">
                    Verified by ModVault
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CREATORS */}
          <p className="text-gray-400 mt-2">

            by{" "}

            {creators.length ? (
              creators.map((creator: any, i: number) => (
                <span key={creator.id}>

                  <Link
                    href={`/creator/${creator.id}`}
                    className="text-purple-400 hover:underline"
                  >
                    {creator.name}
                  </Link>

                  {i < creators.length - 1 && " • "}
                </span>
              ))
            ) : (
              "Unknown"
            )}
          </p>

          {/* STATS */}
          <div className="flex gap-6 text-sm text-gray-400 mt-3">

            <span>
              ⬇ {mod.downloads ?? 0} downloads
            </span>

            <span>
              ❤️ {mod.likes ?? 0} likes
            </span>

            <span>
              ❤ {favoritesCount} favorites
            </span>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-6">

            <h2 className="text-xl font-semibold mb-2">
              Description
            </h2>

            <p className="text-gray-300">
              {mod.description}
            </p>
          </div>

          {/* FEATURES */}
          {mod.features && (
            <div className="mt-6">

              <h2 className="text-xl font-semibold mb-2">
                Features
              </h2>

              <ul className="space-y-1">

                {mod.features
                  .split("\n")
                  .map((f: string, i: number) => (
                    <li
                      key={i}
                      className="text-gray-300 flex gap-2"
                    >
                      <span className="text-green-500">
                        ✔
                      </span>

                      {f}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* REQUIREMENTS */}
          {mod.requirements && (
            <div className="mt-6">

              <h2 className="text-xl font-semibold mb-2">
                Requirements
              </h2>

              <p className="text-gray-300 whitespace-pre-line">
                {mod.requirements}
              </p>
            </div>
          )}

          {/* NOTES */}
          {mod.notes && (
            <div className="mt-6 p-4 border border-yellow-500 rounded-lg bg-yellow-500/10">

              <h2 className="text-lg font-semibold text-yellow-400 mb-1">
                Note
              </h2>

              <p className="text-gray-300 whitespace-pre-line">
                {mod.notes}
              </p>
            </div>
          )}

          {/* CREDITS */}
          {mod.credits && (
            <div className="mt-6">

              <h2 className="text-xl font-semibold mb-2">
                Credits
              </h2>

              <p className="text-gray-400 whitespace-pre-line">
                {mod.credits}
              </p>
            </div>
          )}

          {/* ACTIONS */}
          <div className="mt-8 flex gap-4 items-center flex-wrap">

            <DownloadButton
              url={mod.source_url}
              id={mod.id}
            />

            <LikeButton
              id={mod.id}
              initialLikes={mod.likes ?? 0}
            />

            <FavoriteModButton
              modId={mod.id}
              initialCount={favoritesCount}
            />

            <a
              href={mod.source_url}
              target="_blank"
              className="border border-gray-500 px-5 py-2 rounded-lg hover:bg-white hover:text-black transition"
            >
              Source
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}