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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Mod not found
      </div>
    );
  }

  /* -----------------------------
     FAVORITES COUNT
  ----------------------------- */
  const favoritesCount =
    mod.favorites?.[0]?.count || 0;

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

  /* -----------------------------
     TABS DATA
  ----------------------------- */
  const tabs = [
    {
      title: "Overview",
      content: (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Description
            </h3>

            <p className="text-gray-300 whitespace-pre-line leading-relaxed">
              {mod.description || "No description provided."}
            </p>
          </div>
        </div>
      ),
    },

    mod.features && {
      title: "Features",
      content: (
        <div>
          <ul className="space-y-3">
            {mod.features
              .split("\n")
              .filter(Boolean)
              .map((f: string, i: number) => (
                <li
                  key={i}
                  className="flex gap-3 text-gray-300"
                >
                  <span className="text-green-400">
                    ✔
                  </span>

                  <span>{f}</span>
                </li>
              ))}
          </ul>
        </div>
      ),
    },

    mod.requirements && {
      title: "Requirements",
      content: (
        <div className="text-gray-300 whitespace-pre-line leading-relaxed">
          {mod.requirements}
        </div>
      ),
    },

    mod.notes && {
      title: "Changelog",
      content: (
        <div className="space-y-4 text-gray-300 whitespace-pre-line leading-relaxed">
          {mod.notes}
        </div>
      ),
    },

    mod.credits && {
      title: "Credits",
      content: (
        <div className="text-gray-400 whitespace-pre-line leading-relaxed">
          {mod.credits}
        </div>
      ),
    },
  ].filter(Boolean) as any[];

  return (
    <main className="min-h-screen bg-black text-white">

      {/* CONTAINER */}
      <div className="max-w-[1500px] mx-auto px-6 py-10">

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_480px] gap-10 items-start">

          {/* LEFT SIDE */}
          <div>

            {/* GALLERY */}
            <Gallery
              main={mod.image}
              images={images}
            />

            {/* TABS */}
            <div className="mt-8 bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden">

              {/* TAB HEADER */}
              <div className="flex gap-1 border-b border-zinc-800 overflow-x-auto scrollbar-hide px-3 pt-3">

                {tabs.map((tab, i) => (
                  <a
                    key={i}
                    href={`#tab-${i}`}
                    className="
                      px-5
                      py-3
                      text-sm
                      rounded-t-xl
                      text-gray-400
                      hover:text-white
                      hover:bg-zinc-800/70
                      transition
                      whitespace-nowrap
                    "
                  >
                    {tab.title}
                  </a>
                ))}
              </div>

              {/* TAB CONTENT */}
              <div className="p-8 space-y-10">

                {tabs.map((tab, i) => (
                  <section
                    key={i}
                    id={`tab-${i}`}
                    className="scroll-mt-24"
                  >
                    <h2 className="text-2xl font-bold mb-6">
                      {tab.title}
                    </h2>

                    {tab.content}
                  </section>
                ))}

              </div>
            </div>

          </div>

          {/* RIGHT SIDE */}
          <div className="xl:sticky xl:top-6 space-y-6">

            {/* MAIN CARD */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8 backdrop-blur-xl">

              {/* VERIFIED */}
              <div className="flex justify-between items-start gap-4">

                <h1 className="text-5xl font-bold leading-tight">
                  {mod.title}
                </h1>

                {mod.verified && (
                  <div className="shrink-0">
                    <span className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-xl shadow">
                      ✔ Verified
                    </span>
                  </div>
                )}
              </div>

              {/* CREATORS */}
              <div className="mt-5 text-lg text-gray-400">

                by{" "}

                {creators.length ? (
                  creators.map(
                    (
                      creator: any,
                      i: number
                    ) => (
                      <span key={creator.id}>
                        <Link
                          href={`/creator/${creator.id}`}
                          className="text-purple-400 hover:text-purple-300 transition"
                        >
                          {creator.name}
                        </Link>

                        {i <
                          creators.length - 1 &&
                          " • "}
                      </span>
                    )
                  )
                ) : (
                  "Unknown"
                )}
              </div>

              {/* STATS */}
              <div className="flex gap-6 text-sm text-gray-400 mt-6 flex-wrap">

                <div className="bg-black/40 border border-zinc-800 px-4 py-2 rounded-xl">
                  ⬇ {mod.downloads ?? 0} downloads
                </div>

                <div className="bg-black/40 border border-zinc-800 px-4 py-2 rounded-xl">
                  ❤️ {mod.likes ?? 0} likes
                </div>

                <div className="bg-black/40 border border-zinc-800 px-4 py-2 rounded-xl">
                  ❤ {favoritesCount} favorites
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mt-8 space-y-4">

                <DownloadButton
                  url={mod.source_url}
                  id={mod.id}
                />

                <div className="grid grid-cols-2 gap-3">

                  <LikeButton
                    id={mod.id}
                    initialLikes={mod.likes ?? 0}
                  />

                  <FavoriteModButton
                    modId={mod.id}
                    initialCount={favoritesCount}
                  />

                </div>

                <a
                  href={mod.source_url}
                  target="_blank"
                  className="
                    w-full
                    flex
                    justify-center
                    items-center
                    border
                    border-zinc-700
                    bg-zinc-900
                    hover:bg-zinc-800
                    transition
                    rounded-2xl
                    py-4
                    text-gray-300
                  "
                >
                  Visit Source
                </a>
              </div>
            </div>

            {/* META CARD */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl">

              <h3 className="text-lg font-semibold mb-5">
                Mod Details
              </h3>

              <div className="space-y-5 text-sm">

                <div>
                  <p className="text-gray-500 mb-1">
                    Status
                  </p>

                  <p className="text-white">
                    {mod.verified
                      ? "Verified"
                      : "Community Upload"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 mb-1">
                    Media
                  </p>

                  <p className="text-white">
                    {allImagesCount(images)} images
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 mb-1">
                    Creator Count
                  </p>

                  <p className="text-white">
                    {creators.length}
                  </p>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}

/* -----------------------------
   HELPERS
----------------------------- */
function allImagesCount(images: string[]) {
  return images.length + 1;
}