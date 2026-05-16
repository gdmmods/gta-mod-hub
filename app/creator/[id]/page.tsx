export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase/client";

import ClaimCreatorButton from "@/components/creator/ClaimCreatorButton";
import CreatorPageShell from "@/components/creator/profile/CreatorPageShell";
import CreatorNavbar from "@/components/creator/profile/CreatorNavbar";
import CreatorHero from "@/components/creator/profile/CreatorHero";
import CreatorActivity from "@/components/creator/profile/CreatorActivity";
import CreatorFeaturedMod from "@/components/creator/profile/CreatorFeaturedMod";
import CreatorModsSection from "@/components/creator/profile/CreatorModsSection";
import CreatorSidebar from "@/components/creator/profile/CreatorSidebar";

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
      })
    ) || [];

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
     FEATURED MOD
  ----------------------------- */
  const featured =
    mods.length > 0
      ? [...mods].sort(
          (a, b) =>
            b.downloads -
            a.downloads
        )[0]
      : null;

  const bannerImage =
    creator.banner ||
    featured?.image ||
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

      <CreatorNavbar
        creatorId={creator.id}
      />

      <CreatorHero
        creator={creator}
        bannerImage={bannerImage}
        socials={socials}
        modsCount={mods.length}
        totalLikes={totalLikes}
        totalDownloads={totalDownloads}
      />

      {/* ACTIVITY + SIDEBAR */}
      <section
        className="
          max-w-[1450px]
          mx-auto
          px-6
          mt-14
        "
      >

        <div
          className="
            grid
            grid-cols-1
            xl:grid-cols-[1.2fr_0.8fr]
            gap-6
          "
        >

          <CreatorActivity />

          <div className="space-y-6">

  <CreatorSidebar
    creator={creator}
  />

  <div
    className="
      rounded-[28px]
      border
      border-zinc-800
      bg-zinc-950/60
      backdrop-blur-xl
      p-6
    "
  >

    <p
      className="
        text-sm
        uppercase
        tracking-[0.2em]
        text-purple-400
        mb-3
      "
    >
      Ownership
    </p>

    <h3
      className="
        text-2xl
        font-black
        mb-3
      "
    >
      Claim Creator Profile
    </h3>

    <p
      className="
        text-sm
        text-zinc-400
        leading-relaxed
        mb-5
      "
    >
      Claim this creator profile and
      unlock editing tools, uploads,
      customize your profile, and
      grow your presence on ModVault.
    </p>

    {!isManaged ? (

  <ClaimCreatorButton
    creatorId={creator.id}
  />

) : (

  <div
    className="
      rounded-2xl
      border
      border-emerald-500/20
      bg-emerald-500/10
      px-5
      py-4
      text-sm
      text-emerald-300
    "
  >
    This creator profile is already managed.
  </div>

)}

  </div>

</div>

        </div>

      </section>

      <CreatorFeaturedMod
        featured={featured}
      />

      <CreatorModsSection
        mods={mods}
      />

    </CreatorPageShell>

  );

}