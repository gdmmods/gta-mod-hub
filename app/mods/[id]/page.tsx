import { supabase } from "@/lib/supabase/client";

import ModHero from "@/components/mod/ModHero";
import ModSidebar from "@/components/mod/ModSidebar";
import Announcements from "@/components/following/Announcements";
import ModDiscussions from "@/components/discussions/ModDiscussions";
import ModTabs from "@/components/mod/ModTabs";
import RelatedMods from "@/components/mod/RelatedMods";
import ModMetaGrid from "@/components/mod/ModMetaGrid";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { getExternalDownloadTotal } from "@/lib/server/external-download-counts";
import { normalizeGtaInsideProjectUrl } from "@/lib/connectors/gtainside";
import { normalizeGta5ModsProjectUrl } from "@/lib/connectors/sourceProjectUrl";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isPublicModRelease } from "@/lib/server/public-creator-mods";

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

if (
  !mod ||
  !isPublicModRelease(mod)
) {

  notFound();

}

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

  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  const { data: canEditMod } = user ? await authClient.rpc("can_edit_mod", { p_mod: mod.id }) : { data: false };
  const canEdit = canEditMod === true;

  /* ---------------------------------
     FAVORITES
  --------------------------------- */
  const favoritesCount =
    mod.favorites?.[0]?.count || 0;

  const { data: sourceRows, error: sourceError } = await supabase
    .from("mod_sources")
    .select("canonical_url, platform_id")
    .eq("mod_id", id);
  if (sourceError) console.error("MOD SOURCES LOAD ERROR:", sourceError);

  const sourcePlatformIds = [...new Set((sourceRows ?? []).map((source) => source.platform_id))];
  const { data: sourcePlatforms, error: platformError } = sourcePlatformIds.length
    ? await supabase.from("platforms").select("id, slug, name").in("id", sourcePlatformIds)
    : { data: [], error: null };
  if (platformError) console.error("MOD SOURCE PLATFORMS LOAD ERROR:", platformError);

  const sourcePlatformById = new Map((sourcePlatforms ?? []).map((platform) => [platform.id, platform]));
  const sourceLinks = (sourceRows ?? []).flatMap((source) => {
    const platform = sourcePlatformById.get(source.platform_id);
    return platform ? [{ canonical_url: source.canonical_url, platform }] : [];
  });
  const primarySourcePlatform = mod.origin === "gtainside" || mod.origin === "gta5mods"
    ? mod.origin
    : normalizeGtaInsideProjectUrl(mod.source_url) ? "gtainside"
      : normalizeGta5ModsProjectUrl(mod.source_url) ? "gta5mods" : null;
  const externalDownloadSources = [
    primarySourcePlatform
      ? { platform: primarySourcePlatform, url: mod.source_url }
      : null,
    ...sourceLinks.map((source) => ({ platform: source.platform.slug, url: source.canonical_url })),
  ].filter((source): source is { platform: string; url: string } => !!source?.url);
  const totalExternalDownloads = await getExternalDownloadTotal(externalDownloadSources);
  const { data: clickTotalRows } = await supabase
    .from("mod_click_totals")
    .select("click_count")
    .eq("mod_id", id);
  const clickCount = clickTotalRows?.length
    ? clickTotalRows.reduce((total, row) => total + row.click_count, 0)
    : mod.downloads ?? 0;

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
    min-h-screen
    bg-[#040404]
    text-white
  "
>

      <Navbar />

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
              canRefreshRatings={canEdit && mod.status === "published" && (mod.visibility === "public" || mod.visibility === "early_access")}
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
              sources={sourceLinks}
              totalExternalDownloads={totalExternalDownloads}
              clicks={clickCount}
              canEdit={canEdit}
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
  <Announcements id={mod.id} mod />
  <ModDiscussions targetId={mod.id} />

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
