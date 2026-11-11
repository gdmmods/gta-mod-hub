export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase/client";

import Navbar from "@/components/layout/Navbar";

import ClaimCreatorButton from "@/components/creator/ClaimCreatorButton";
import CreatorPageShell from "@/components/creator/profile/CreatorPageShell";
import DiscussionHistory from "@/components/discussions/DiscussionHistory";
import CreatorHero from "@/components/creator/profile/CreatorHero";
import CreatorActivity from "@/components/creator/profile/CreatorActivity";
import CreatorFeaturedMod from "@/components/creator/profile/CreatorFeaturedMod";
import CreatorModsSection from "@/components/creator/profile/CreatorModsSection";
import CreatorSidebar from "@/components/creator/profile/CreatorSidebar";
import PublicTeamRoster, { type PublicTeamMember, type PublicTeamMod } from "@/components/creator/profile/PublicTeamRoster";
import { getCreatorExternalDownloadSummary, getExternalDownloadDataByMod, type CreatorExternalDownloadSource } from "@/lib/server/external-download-counts";
import { calculateTeamProfileStats, isMissingClickTotalsTable, sumLegacyDownloadClicks } from "@/lib/server/team-profile-stats-core.mjs";
import { selectTeamFeaturedMods } from "@/lib/server/team-featured-mods-core.mjs";
import { normalizeGtaInsideProjectUrl } from "@/lib/connectors/gtainside";
import { normalizeGta5ModsProjectUrl } from "@/lib/connectors/sourceProjectUrl";

type CreatorGame = { id: string; name: string; slug: string };
type CreatorMod = PublicTeamMod & {
  mod_creators?: Array<{ creators: { id: string; name: string }[] | { id: string; name: string } | null }>;
};
type FeaturedCardMod = { id: string; title: string; image: string; likes: number | null; downloads: number | null };
type TeamFeatureModRow = {
  id: string;
  title: string | null;
  image: string | null;
  category: string | null;
  description: string | null;
  likes: number | null;
  downloads: number | null;
  source_url: string | null;
  tags: string[] | null;
  visibility: string | null;
  release_state: string | null;
  origin: string | null;
};

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
      status,
      games,
      owner_type,
      team_id
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
     FETCH CREATOR GAMES
  ----------------------------- */

  const creatorGameIds =
    creator.games || [];

  let creatorGames: CreatorGame[] = [];

  if (creatorGameIds.length > 0) {

    const {
      data: games,
      error: gamesError,
    } = await supabase
      .from("games")
      .select(`
        id,
        name,
        slug
      `)
      .in(
        "id",
        creatorGameIds
      );

    if (gamesError) {

      console.error(
        "CREATOR GAMES ERROR:",
        gamesError
      );

    }

    creatorGames =
      games || [];

  }

  /* -----------------------------
     CREATOR OWNERSHIP
  ----------------------------- */

  const { data: managedResult, error: managedError } = await supabase.rpc(
    "is_creator_managed",
    { p_creator_id: creatorId },
  );
  if (managedError) console.error("CREATOR MANAGEMENT STATUS ERROR:", managedError);
  const isManaged = managedResult === true;

  const { data: teamLifecycle } = creator.owner_type === 'team' && creator.team_id
    ? await supabase.from('teams').select('status').eq('id', creator.team_id).maybeSingle()
    : { data: null };
  const archivedTeam = teamLifecycle?.status === 'archived';
  let publicTeamMembers: PublicTeamMember[] = [];
  const teamModsByCreator: Record<string, PublicTeamMod[]> = {};
  let teamModRelationships: Array<{ creator_id: string; mod_id: string }> = [];
  let teamPublishedMods: TeamFeatureModRow[] = [];
  if (creator.owner_type === "team" && creator.team_id) {
    const { data: roster, error: rosterError } = await supabase.rpc(
      "get_public_team_members",
      { p_team_id: creator.team_id },
    );
    if (rosterError) console.error("PUBLIC TEAM ROSTER ERROR:", rosterError);
    publicTeamMembers = roster ?? [];

    const memberCreatorIds = publicTeamMembers.map((member) => member.creator_id);
    if (memberCreatorIds.length > 0) {
      const { data: teamRelations, error: teamRelationsError } = await supabase
        .from("mod_creators").select("creator_id,mod_id").in("creator_id", memberCreatorIds);
      if (teamRelationsError) console.error("TEAM MOD RELATION ERROR:", teamRelationsError);
      const relationRows = teamRelations ?? [];
      teamModRelationships = relationRows;
      const teamModIds = [...new Set(relationRows.map((relation) => relation.mod_id))];
      if (teamModIds.length > 0) {
        const { data: publishedTeamMods, error: teamModsError } = await supabase
          .from("mods")
          .select("id,title,image,category,description,likes,downloads,source_url,tags,visibility,release_state,origin")
          .in("id", teamModIds)
          .eq("status", "published")
          .in("visibility", ["public", "early_access"]);
        if (teamModsError) console.error("TEAM PUBLISHED MODS ERROR:", teamModsError);
        teamPublishedMods = (publishedTeamMods ?? []) as TeamFeatureModRow[];
        const modsById = new Map<string, PublicTeamMod>(teamPublishedMods.map((mod) => [mod.id, {
          ...mod,
          title: mod.title ?? "Untitled",
          image: mod.image ?? "/placeholder.jpg",
          category: mod.category ?? null,
          description: mod.description ?? "",
          likes: mod.likes ?? 0,
          downloads: mod.downloads ?? 0,
          source_url: mod.source_url ?? "#",
          tags: mod.tags ?? [],
          visibility: mod.visibility ?? "public",
          release_state: mod.release_state ?? "public",
        } as PublicTeamMod]));
        const rosterMemberById = new Map(publicTeamMembers.map((member) => [member.creator_id, member]));
        for (const relation of relationRows) {
          const mod = modsById.get(relation.mod_id);
          const member = rosterMemberById.get(relation.creator_id);
          if (!mod || !member) continue;
          (teamModsByCreator[relation.creator_id] ??= []).push({
            ...mod,
            mod_creators: [{ creators: { id: member.creator_id, name: member.creator_name } }],
          });
        }
      }
    }
  }

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

  let modsData: CreatorMod[] = [];

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
    
        visibility,
        release_state,
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
    (m) => ({
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

      // release information

      visibility:
        m.visibility ?? "public",

      release_state:
        m.release_state ?? "public",

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

  const isTeamProfile = creator.owner_type === "team";
  const publishedModsForExternalCounts = !isTeamProfile && modIds.length
    ? await supabase.from("mods")
      .select("id, origin, source_url")
      .in("id", modIds)
      .eq("status", "published")
      .in("visibility", ["public", "early_access"])
    : { data: [], error: null };
  if (publishedModsForExternalCounts.error) console.error("CREATOR EXTERNAL COUNT MOD LOAD ERROR:", publishedModsForExternalCounts.error);
  const publishedExternalMods = publishedModsForExternalCounts.data ?? [];
  const publishedExternalModIds = publishedExternalMods.map((mod) => mod.id);
  const linkedSourcesQuery = !isTeamProfile && publishedExternalModIds.length
    ? await supabase.from("mod_sources").select("mod_id, canonical_url, platform_id").in("mod_id", publishedExternalModIds)
    : { data: [], error: null };
  if (linkedSourcesQuery.error) console.error("CREATOR EXTERNAL SOURCE LOAD ERROR:", linkedSourcesQuery.error);
  const linkedPlatformIds = [...new Set((linkedSourcesQuery.data ?? []).map((source) => source.platform_id))];
  const linkedPlatformsQuery = !isTeamProfile && linkedPlatformIds.length
    ? await supabase.from("platforms").select("id, slug").in("id", linkedPlatformIds)
    : { data: [], error: null };
  if (linkedPlatformsQuery.error) console.error("CREATOR EXTERNAL PLATFORM LOAD ERROR:", linkedPlatformsQuery.error);
  const externalSourcesByMod: CreatorExternalDownloadSource[] = [];
  for (const mod of publishedExternalMods) {
    const primaryPlatform = mod.origin === "gtainside" || mod.origin === "gta5mods"
      ? mod.origin
      : normalizeGtaInsideProjectUrl(mod.source_url) ? "gtainside"
        : normalizeGta5ModsProjectUrl(mod.source_url) ? "gta5mods" : null;
    if (primaryPlatform && mod.source_url) externalSourcesByMod.push({ modId: mod.id, platform: primaryPlatform, url: mod.source_url });
  }
  const platformSlugById = new Map((linkedPlatformsQuery.data ?? []).map((platform) => [platform.id, platform.slug]));
  for (const source of linkedSourcesQuery.data ?? []) {
    const platform = platformSlugById.get(source.platform_id);
    if (platform && source.canonical_url) externalSourcesByMod.push({ modId: source.mod_id, platform, url: source.canonical_url });
  }
  const externalDownloadSummary = await getCreatorExternalDownloadSummary(externalSourcesByMod);

  // Creator profiles retain their existing statistics; team profiles override
  // these values below using the public owner + active-member mod set.
  let profileModsCount = isTeamProfile ? 0 : mods.length;
  let profileTotalLikes = isTeamProfile ? 0 : totalLikes;
  let profileClicks = isTeamProfile ? 0 : totalDownloads;
  let profileExternalDownloadSummary = externalDownloadSummary;

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

  let featuredMostDownloaded: FeaturedCardMod | null = mostDownloaded;
  let featuredMostLiked: FeaturedCardMod | null = mostLiked;
  let featuredEmptyMessage: string | undefined;

  if (creator.owner_type === "team" && creator.team_id) {
    const teamCreatorIds = [...new Set(publicTeamMembers.map((member) => member.creator_id))];
    const eligibleTeamMods = [...new Map(teamPublishedMods.map((mod) => [mod.id, mod])).values()];
    const teamModIds = eligibleTeamMods.map((mod) => mod.id);
    const { data: clickRows, error: clickTotalsError } = teamModIds.length
      ? await supabase.from("mod_click_totals").select("mod_id,action_type,click_count").in("mod_id", teamModIds)
      : { data: [], error: null };
    const clickTotalsTableMissing = isMissingClickTotalsTable(clickTotalsError);
    if (clickTotalsTableMissing) {
      console.warn("TEAM CLICK TOTALS TABLE IS NOT DEPLOYED; USING LEGACY MOD DOWNLOAD COUNTS.");
    } else if (clickTotalsError) {
      console.error(`TEAM CLICK TOTALS LOAD ERROR (${clickTotalsError.code}): ${clickTotalsError.message}`);
    }
    const teamStats = calculateTeamProfileStats(eligibleTeamMods, clickRows ?? []);
    profileModsCount = teamStats.modsCount;
    profileTotalLikes = teamStats.totalLikes;
    profileClicks = clickTotalsTableMissing ? sumLegacyDownloadClicks(eligibleTeamMods) : teamStats.totalClicks;

    const { data: sourceRows, error: sourceError } = teamModIds.length
      ? await supabase.from("mod_sources").select("mod_id,canonical_url,platform_id").in("mod_id", teamModIds)
      : { data: [], error: null };
    if (sourceError) console.error("TEAM FEATURE SOURCE LOAD ERROR:", sourceError);

    const sourcePlatformIds = [...new Set((sourceRows ?? []).map((source) => source.platform_id))];
    const { data: sourcePlatforms, error: platformError } = sourcePlatformIds.length
      ? await supabase.from("platforms").select("id,slug").in("id", sourcePlatformIds)
      : { data: [], error: null };
    if (platformError) console.error("TEAM FEATURE PLATFORM LOAD ERROR:", platformError);

    const platformSlugById = new Map((sourcePlatforms ?? []).map((platform) => [platform.id, platform.slug]));
    const externalSources: CreatorExternalDownloadSource[] = [];
    for (const mod of eligibleTeamMods) {
      const primaryPlatform = mod.origin === "gtainside" || mod.origin === "gta5mods"
        ? mod.origin
        : normalizeGtaInsideProjectUrl(mod.source_url) ? "gtainside"
          : normalizeGta5ModsProjectUrl(mod.source_url) ? "gta5mods" : null;
      if (primaryPlatform && mod.source_url) externalSources.push({ modId: mod.id, platform: primaryPlatform, url: mod.source_url });
    }
    for (const source of sourceRows ?? []) {
      const platform = platformSlugById.get(source.platform_id);
      if (platform && source.canonical_url) externalSources.push({ modId: source.mod_id, platform, url: source.canonical_url });
    }

    const externalDownloadData = await getExternalDownloadDataByMod(externalSources);
    const externalTotalsByMod = externalDownloadData.totalsByMod;
    profileExternalDownloadSummary = externalDownloadData.summary;
    const creatorIdsByMod = new Map<string, string[]>();
    for (const relation of teamModRelationships) {
      const creatorIds = creatorIdsByMod.get(relation.mod_id) ?? [];
      creatorIds.push(relation.creator_id);
      creatorIdsByMod.set(relation.mod_id, creatorIds);
    }

    const teamFeatured = selectTeamFeaturedMods(eligibleTeamMods.map((mod) => ({
      id: mod.id,
      title: mod.title,
      image: mod.image,
      likes: mod.likes,
      externalDownloads: externalTotalsByMod.get(mod.id) ?? null,
      status: "published",
      visibility: mod.visibility ?? "public",
      creatorIds: creatorIdsByMod.get(mod.id) ?? [],
    })), teamCreatorIds);
    featuredMostDownloaded = teamFeatured.mostDownloaded;
    featuredMostLiked = teamFeatured.mostLiked;
    featuredEmptyMessage = "No eligible published mods are available for this team yet.";
  }

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

      {archivedTeam && <p className="relative mx-auto mt-6 max-w-6xl rounded-2xl border border-amber-500/30 bg-zinc-900 px-6 py-4 text-sm text-amber-200">Archived team · This profile preserves the team's contributions and history. Team publishing and management are inactive.</p>}
      {/* HERO */}
      <CreatorHero
        creator={creator}
        bannerImage={bannerImage}
        socials={socials}
        modsCount={profileModsCount}
        totalLikes={profileTotalLikes}
        totalDownloads={profileClicks}
        externalDownloadSummary={profileExternalDownloadSummary}
        isManaged={isManaged}
        creatorGames={creatorGames}
      />

      <DiscussionHistory recent className="relative mx-auto max-w-[1450px] px-5 py-6" identity={{ type: 'creator', id: creatorId }} historyHref={`/creator/${creatorId}/discussions`} />

      {/* FEATURED CREATIONS */}
      <CreatorFeaturedMod
        mostDownloaded={featuredMostDownloaded}
        mostLiked={featuredMostLiked}
        emptyMessage={featuredEmptyMessage}
      />

      {/* MODS FIRST */}
      {creator.owner_type === "team" ? (
        <PublicTeamRoster members={publicTeamMembers} modsByCreator={teamModsByCreator} />
      ) : (
        <CreatorModsSection mods={mods} />
      )}

    

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

            {!isManaged && !archivedTeam && (

              <div id="claim-profile">

                <ClaimCreatorButton
                  creatorId={creator.id}
                />

              </div>

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
