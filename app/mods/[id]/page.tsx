import { supabase } from "@/lib/supabase";

import ModHero from "@/components/mod/ModHero";
import ModSidebar from "@/components/mod/ModSidebar";
import ModTabs from "@/components/mod/ModTabs";
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
  const { data: mod, error } =
    await supabase
      .from("mods")
      .select(`
        *,
        favorites(count)
      `)
      .eq("id", id)
      .single();

  if (!mod || error) {

    console.log(error);

    return (
      <div
        className="
          min-h-screen
          bg-black
          text-white
          flex
          items-center
          justify-center
        "
      >
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
  const { data: creatorsData } =
    await supabase
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
      .eq("category", mod.category)
      .limit(10);

  return (
    <main
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-black
        text-white
      "
    >

      {/* BACKGROUND */}
      <div
        className="
          absolute
          inset-0
          overflow-hidden
          pointer-events-none
        "
      >

        {/* SOFT GLOW */}
        <div
          className="
            absolute
            top-0
            left-1/2
            -translate-x-1/2
            w-[900px]
            h-[260px]
            opacity-10
            blur-[120px]
          "
        >

          <img
            src={mod.image}
            alt={mod.title}
            className="
              w-full
              h-full
              object-cover
            "
          />

        </div>

        {/* OVERLAY */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-b
            from-black/20
            via-black/80
            to-black
          "
        />

      </div>

      {/* PAGE */}
      <div
        className="
          relative
          z-10
          max-w-[1380px]
          mx-auto
          px-4
          md:px-6
          py-5
        "
      >

        {/* BREADCRUMB */}
        <div
          className="
            flex
            items-center
            gap-3
            text-xs
            text-zinc-500
            mb-5
          "
        >

          <span>Mods</span>

          <span className="text-zinc-700">
            /
          </span>

          <span className="capitalize">
            {mod.category || "uncategorized"}
          </span>

          <span className="text-zinc-700">
            /
          </span>

          <span className="truncate text-zinc-300">
            {mod.title}
          </span>

        </div>

        {/* MAIN WRAPPER */}
        <div
          className="
            rounded-[34px]
            border
            border-zinc-900
            bg-zinc-950/55
            backdrop-blur-2xl
            p-4
            md:p-5
            shadow-[0_0_40px_rgba(168,85,247,0.04)]
          "
        >

          {/* TOP SECTION */}
          <div
            className="
              grid
              grid-cols-1
              xl:grid-cols-[minmax(0,1fr)_350px]
              gap-5
              items-start
            "
          >

            {/* LEFT */}
            <div className="min-w-0">

              <ModHero
                mod={mod}
                images={images}
              />

            </div>

            {/* RIGHT */}
            <div className="xl:sticky xl:top-4">

              <ModSidebar
                mod={mod}
                creators={creators}
                favoritesCount={favoritesCount}
                images={images}
              />

            </div>

          </div>

          {/* TABS */}
          <div className="mt-5">

            <ModTabs mod={mod} />

          </div>

        </div>

        {/* RELATED */}
        <div className="mt-10">

          <RelatedMods
            mods={relatedMods || []}
          />

        </div>

      </div>

    </main>
  );
}