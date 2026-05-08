import { supabase } from "@/lib/supabase";

import ModHero from "@/components/mod/ModHero";
import ModSidebar from "@/components/mod/ModSidebar";
import ModTabs from "@/components/mod/ModTabs";
import ModQuickTags from "@/components/mod/ModQuickTags";
import RelatedMods from "@/components/mod/RelatedMods";

export const dynamic = "force-dynamic";

export default async function ModPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /* ---------------------------------
     FETCH MOD
  --------------------------------- */
  const { data: mod, error } = await supabase
    .from("mods")
    .select(
      `
      *,
      favorites(count)
    `
    )
    .eq("id", id)
    .single();

  if (!mod || error) {
    console.log(error);

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Mod not found
      </div>
    );
  }

  /* ---------------------------------
     FAVORITES
  --------------------------------- */
  const favoritesCount =
    mod.favorites?.[0]?.count || 0;

  /* ---------------------------------
     FETCH CREATORS
  --------------------------------- */
  const { data: creatorsData } = await supabase
    .from("mod_creators")
    .select(
      `
      creators (
        id,
        name
      )
    `
    )
    .eq("mod_id", id);

  const creators =
    creatorsData
      ?.map((c: any) => c.creators)
      .filter(Boolean) || [];

  /* ---------------------------------
     IMAGES
  --------------------------------- */
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

  /* ---------------------------------
     RELATED MODS
  --------------------------------- */
  const { data: relatedMods } =
  await supabase
    .from("mods")
    .select("*")
    .neq("id", mod.id)
    .limit(6);

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        <div
          className="
            absolute
            top-0
            left-1/2
            -translate-x-1/2
            w-[1200px]
            h-[700px]
            opacity-20
            blur-3xl
            scale-110
          "
        >
          <img
            src={mod.image}
            alt={mod.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/80 to-black" />

      </div>

      {/* PAGE */}
      <div className="relative z-10 max-w-[1550px] mx-auto px-6 py-10">

        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_470px] gap-10 items-start">

          {/* LEFT */}
          <div>

            <ModHero
              mod={mod}
              images={images}
            />

            <ModQuickTags />

            <ModTabs mod={mod} />

            <RelatedMods
              mods={relatedMods || []}
            />

          </div>

          {/* RIGHT */}
          <div className="xl:sticky xl:top-6 space-y-6">

            <ModSidebar
              mod={mod}
              creators={creators}
              favoritesCount={favoritesCount}
              images={images}
            />

          </div>

        </div>

      </div>

    </main>
  );
}