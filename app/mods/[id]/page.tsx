import { supabase } from "@/lib/supabase/client";

import ModHero from "@/components/mod/ModHero";
import ModSidebar from "@/components/mod/ModSidebar";
import ModTabs from "@/components/mod/ModTabs";
import RelatedMods from "@/components/mod/RelatedMods";
import ModMetaGrid from "@/components/mod/ModMetaGrid";

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

  /* CREATOR IDS */
  const creatorIds =
    creators.map(
      (creator: any) => creator.id
    );

  /* TAGS */
  const modTags =
    Array.isArray(mod.tags)
      ? mod.tags
      : [];

  /* SAME CREATOR MODS */
  let creatorRelated: any[] = [];

  if (creatorIds.length > 0) {

    const {
      data: creatorModsData,
    } = await supabase
      .from("mod_creators")
      .select(`
        mod_id,
        mods (*)
      `)
      .in(
        "creator_id",
        creatorIds
      );

    creatorRelated =
      creatorModsData
        ?.map(
          (item: any) =>
            item.mods
        )
        .filter(
          (item: any) =>
            item &&
            item.id !== mod.id
        ) || [];

  }

  /* SAME TAGS */
  let tagRelated: any[] = [];

  if (modTags.length > 0) {

    const {
      data: tagMods,
    } = await supabase
      .from("mods")
      .select("*")
      .neq("id", mod.id)
      .overlaps(
        "tags",
        modTags
      )
      .limit(12);

    tagRelated =
      tagMods || [];

  }

  /* CATEGORY FALLBACK */
  const {
    data: categoryMods,
  } = await supabase
    .from("mods")
    .select("*")
    .neq("id", mod.id)
    .eq(
      "category",
      mod.category
    )
    .limit(12);

  /* MERGE + DEDUPE */
  const relatedMap =
    new Map();

  [
    ...creatorRelated,
    ...tagRelated,
    ...(categoryMods || []),
  ].forEach((item: any) => {

    if (
      item &&
      !relatedMap.has(item.id)
    ) {

      relatedMap.set(
        item.id,
        item
      );

    }

  });

  /* FINAL */
  const relatedMods =
    Array.from(
      relatedMap.values()
    ).slice(0, 10);

  return (
    <main
      className="
        relative
        min-h-screen
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

        {/* TOP GLOW */}
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
          max-w-[1450px]
          mx-auto
          px-4
          md:px-6
          py-6
        "
      >

        {/* TOP SECTION */}
        <div
          className="
            grid
            grid-cols-1
            xl:grid-cols-[minmax(0,1fr)_360px]
            gap-5
            items-start
          "
        >

          {/* HERO */}
          <div className="min-w-0">

            <ModHero
              mod={mod}
              images={images}
            />

          </div>

          {/* SIDEBAR */}
          <div
            className="
              xl:sticky
              xl:top-5
              self-start
            "
          >

            <ModSidebar
              mod={mod}
              creators={creators}
              favoritesCount={favoritesCount}
            />

          </div>

        </div>

        {/* CONTENT SECTION */}
        <div
          className="
            mt-6
            grid
            grid-cols-1
            xl:grid-cols-[minmax(0,1fr)_360px]
            gap-5
            items-start
          "
        >

          {/* LEFT CONTENT */}
          <div className="min-w-0">

            <ModTabs mod={mod} />

          </div>

          {/* RIGHT ECOSYSTEM */}
          <div className="space-y-5">

            {/* META */}
            <div
              className="
                rounded-[30px]
                border
                border-zinc-900
                bg-zinc-950/75
                backdrop-blur-xl
                p-5
              "
            >

              <div className="mb-5">

                <p
                  className="
                    text-[11px]
                    uppercase
                    tracking-[0.2em]
                    text-zinc-500
                  "
                >
                  Mod Information
                </p>

                <h3
                  className="
                    text-xl
                    font-semibold
                    mt-2
                  "
                >
                  Details
                </h3>

              </div>

              <ModMetaGrid
                mod={mod}
                creators={creators}
                images={images}
              />

            </div>

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