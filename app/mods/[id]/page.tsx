import { supabase } from "@/lib/supabase/client";

import ModHero from "@/components/mod/ModHero";
import ModSidebar from "@/components/mod/ModSidebar";
import ModTabs from "@/components/mod/ModTabs";
import RelatedMods from "@/components/mod/RelatedMods";
import ModMetaGrid from "@/components/mod/ModMetaGrid";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { getExternalDownloadTotal } from "@/lib/server/external-download-counts";
import { normalizeGtaInsideProjectUrl } from "@/lib/connectors/gtainside";
import { normalizeGta5ModsProjectUrl } from "@/lib/connectors/sourceProjectUrl";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAuthorizedModEditor } from "@/lib/server/mod-edit-authorization";

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
  mod.status !== "published"
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

  let canEdit = false;
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (user && mod.creator_id) {
    const { data: linkedCreator } = await authClient
      .from("creators")
      .select("id, owner_id")
      .eq("id", mod.creator_id)
      .maybeSingle();
    canEdit = isAuthorizedModEditor({
      userId: user.id,
      modCreatorId: mod.creator_id,
      linkedCreatorId: linkedCreator?.id,
      creatorOwnerId: linkedCreator?.owner_id,
    });
  }

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

  {mod.visibility === "supporters" && (
    <div
      className="
        mb-5
        rounded-[30px]
        border
        border-purple-500/10
        bg-purple-500/5
        p-6
      "
    >
      <p
        className="
          text-[11px]
          uppercase
          tracking-[0.2em]
          text-purple-400
        "
      >
        Release Information
      </p>

      <h3
        className="
          text-lg
          font-semibold
          mt-2
        "
      >
        Restricted / Supporter Release
      </h3>

      <p
        className="
          text-sm
          text-zinc-400
          mt-3
          leading-relaxed
        "
      >
        Release status is descriptive only.
        ModVault does not provide, sell, or facilitate access to externally
        restricted projects.
      </p>

      <p
        className="
          text-sm
          text-zinc-500
          mt-3
          leading-relaxed
        "
      >
        This project is documented as a restricted or supporter release.
        Any external release remains subject to the creator's rights,
        permissions, and the rules of the platform where it is distributed.
      </p>
    </div>
  )}

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
