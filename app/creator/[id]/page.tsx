export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase/client";

import Navbar from "@/components/layout/Navbar";

import ClaimCreatorButton from "@/components/creator/ClaimCreatorButton";
import CreatorPageShell from "@/components/creator/profile/CreatorPageShell";
import CreatorHero from "@/components/creator/profile/CreatorHero";
import CreatorActivity from "@/components/creator/profile/CreatorActivity";
import CreatorFeaturedMod from "@/components/creator/profile/CreatorFeaturedMod";
import CreatorModsSection from "@/components/creator/profile/CreatorModsSection";
import CreatorSidebar from "@/components/creator/profile/CreatorSidebar";
import ModMonetizationHub from "@/components/mod/ModMonetizationHub";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id: creatorId } =
    await params;

  if (
    !creatorId ||
    creatorId.startsWith(
      "legacy-"
    )
  ) {

    return (
      <div className="text-white p-10">
        Invalid creator
      </div>
    );

  }

  /* -----------------------------
     FETCH CREATOR
  ----------------------------- */

  const {
    data: creator,
    error: creatorError,
  } = await supabase
    .from("creators")
    .select(`
      id,
      name,
      avatar,
      bio,
      banner,
      tagline,
      location,
      specialization,
      socials,
      verified,
      status
    `)
    .eq("id", creatorId)
    .maybeSingle();

  if (
    creatorError ||
    !creator
  ) {

    console.error(
      "CREATOR ERROR:",
      creatorError
    );

    return (
      <div className="text-white p-10">
        Creator not found
      </div>
    );

  }

  /* -----------------------------
     CREATOR OWNERSHIP
  ----------------------------- */

  const {
    data: members,
  } = await supabase
    .from("creator_members")
    .select(`
      id,
      role,
      status
    `)
    .eq(
      "creator_id",
      creatorId
    )
    .eq(
      "status",
      "approved"
    );

  const isManaged =
    (members?.length || 0) > 0;

  /* -----------------------------
     FETCH RELATIONS
  ----------------------------- */

  const {
    data: relations,
    error: relationError,
  } = await supabase
    .from("mod_creators")
    .select("mod_id")
    .eq(
      "creator_id",
      creatorId
    );

  if (relationError) {

    console.error(
      "RELATION ERROR:",
      relationError
    );

  }

  const modIds =
    relations
      ?.map(
        (r) => r.mod_id
      )
      .filter(Boolean) || [];

  /* -----------------------------
     FETCH MODS
  ----------------------------- */

  let modsData: any[] = [];

  if (modIds.length > 0) {

    const {
      data,
      error,
    } = await supabase
      .from("mods")
      .select(`
        id,
        title,
        image,
        category,
        description,
        likes,
        downloads,
        source_url,
        tags,

        is_paid,
        price,
        support_url,
        external_purchase_url,
        visibility,
        early_access,

        mod_creators (
          creators (
            id,
            name
          )
        )
      `)
      .in("id", modIds);

    if (error) {

      console.error(
        "MOD FETCH ERROR:",
        error
      );

    }

    modsData =
      data || [];

  }

  /* -----------------------------
     NORMALIZE MODS
  ----------------------------- */

  const mods =
  modsData.map(
    (m: any) => ({
      id: m.id,

      title:
        m.title ??
        "Untitled",

      image:
        m.image ??
        "/placeholder.jpg",

      category:
        m.category ?? null,

      description:
        m.description ?? "",

      likes:
        m.likes ?? 0,

      downloads:
        m.downloads ?? 0,

      source_url:
        m.source_url ?? "#",

      tags:
        m.tags ?? [],

      mod_creators:
        m.mod_creators ?? [],

      // monetization

      visibility:
        m.visibility ?? "public",

      release_state:
        m.release_state ?? "public",

      support_url:
        m.support_url ?? null,

      external_purchase_url:
        m.external_purchase_url ?? null,

      is_paid:
        m.is_paid ?? false,

      price:
        m.price ?? 0,
    })
  ) || [];

    const premiumMods =
  mods.filter(
    (mod: any) =>
      mod.is_paid ||
      mod.visibility !== "public"
  );

  /* -----------------------------
     STATS
  ----------------------------- */

  const totalLikes =
    mods.reduce(
      (s, m) =>
        s + (m.likes || 0),
      0
    );

  const totalDownloads =
    mods.reduce(
      (s, m) =>
        s +
        (m.downloads || 0),
      0
    );

  /* -----------------------------
     FEATURED MODS
  ----------------------------- */

  const mostDownloaded =
    mods.length > 0
      ? [...mods].sort(
          (a, b) =>
            (b.downloads || 0) -
            (a.downloads || 0)
        )[0]
      : null;

  const mostLiked =
    mods.length > 0
      ? [...mods].sort(
          (a, b) =>
            (b.likes || 0) -
            (a.likes || 0)
        )[0]
      : null;

  const bannerImage =
    creator.banner ||
    mostDownloaded?.image ||
    "/placeholder.jpg";

  const socials =
    typeof creator.socials ===
    "string"
      ? JSON.parse(
          creator.socials
        )
      : creator.socials || {};

  return (

    <CreatorPageShell>

      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <CreatorHero
        creator={creator}
        bannerImage={bannerImage}
        socials={socials}
        modsCount={mods.length}
        totalLikes={totalLikes}
        totalDownloads={totalDownloads}
      />

      {/* MODS FIRST */}
      <CreatorModsSection
        mods={mods}
      />

      {/* PREMIUM ECOSYSTEM */}
      {premiumMods.length > 0 && (

        <ModMonetizationHub
          creator={creator}
          premiumMods={premiumMods}
        />

      )}

      {/* FEATURED CREATIONS */}
      <CreatorFeaturedMod
        mostDownloaded={mostDownloaded}
        mostLiked={mostLiked}
      />

      {/* SECONDARY ECOSYSTEM */}
      <section
        className="
          max-w-[1450px]
          mx-auto
          px-6
          mt-6
          pb-24
        "
      >

        <div
          className="
            grid
            grid-cols-1
            xl:grid-cols-[1.2fr_0.8fr]
            gap-5
          "
        >

          {/* ACTIVITY */}
          <CreatorActivity />

          {/* SIDEBAR */}
          <div className="space-y-5">

            <CreatorSidebar
              creator={creator}
            />

            {!isManaged && (

              <ClaimCreatorButton
                creatorId={creator.id}
              />

            )}

            {isManaged && (

              <div
                className="
                  rounded-[24px]
                  border
                  border-emerald-500/20
                  bg-emerald-500/10
                  px-5
                  py-4
                  text-sm
                  text-emerald-300
                  backdrop-blur-xl
                "
              >
                This creator profile is already managed.
              </div>

            )}

          </div>

        </div>

      </section>

    </CreatorPageShell>

  );

}