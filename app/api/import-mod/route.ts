import { NextResponse } from "next/server";
import {
  canManageCreator,
  getDiscoveryRequestContext,
} from "@/lib/server/discovery-mod-auth";
import { getSourceUpdateValues } from "@/lib/server/discovery-update-values";
import {
  getGtaInsideExternalId,
  isSameGtaInsideProject,
  normalizeGtaInsideProjectUrl,
} from "@/lib/connectors/gtainside";
import { decideGtaInsideImport, getSourceMatchTitleSearchPatterns, isDiscoveryMatchCandidateVisible } from "@/lib/connectors/modSourceMatch";
import { isValidGta5ModsProjectUrl } from "@/lib/connectors/sourceProjectUrl";

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

export async function POST(request: Request) {
  try {
    const context = await getDiscoveryRequestContext(request);
    if (!context) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const creatorId = body?.creatorId;
    const project = body?.project;

    if (!isNonEmptyString(creatorId, 100) || !project || typeof project !== "object") {
      return NextResponse.json({ error: "Missing creator or project." }, { status: 400 });
    }
    if (!await canManageCreator(context, creatorId)) {
      return NextResponse.json({ error: "You are not authorized to import for this creator." }, { status: 403 });
    }

    const sourceValues = getSourceUpdateValues(project);
    const title = sourceValues.title;
    let sourceUrl = project.projectUrl;
    const platform = project.platform;
    if (!title || !isNonEmptyString(sourceUrl, 2048)) {
      return NextResponse.json({ error: "Project title and source URL are required." }, { status: 400 });
    }
    let parsedSourceUrl: URL;
    try {
      parsedSourceUrl = new URL(sourceUrl);
    } catch {
      return NextResponse.json({ error: "Project source URL is invalid." }, { status: 400 });
    }
    if (parsedSourceUrl.protocol !== "https:" || !isNonEmptyString(platform, 100)) {
      return NextResponse.json({ error: "Project source URL or platform is invalid." }, { status: 400 });
    }

    if (platform === "gtainside") {
      const canonicalUrl = normalizeGtaInsideProjectUrl(sourceUrl);
      const externalId = getGtaInsideExternalId(canonicalUrl);
      if (!canonicalUrl || !externalId || project.externalId !== externalId) {
        return NextResponse.json({ error: "GTAInside project identity is invalid." }, { status: 400 });
      }
      sourceUrl = canonicalUrl;
    } else if (platform === "gta5mods") {
      const segments = parsedSourceUrl.pathname.split("/").filter(Boolean);
      if (
        !isValidGta5ModsProjectUrl(sourceUrl) ||
        project.externalId !== segments[1]
      ) {
        return NextResponse.json({ error: "GTA5-Mods project identity is invalid." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Unsupported source platform." }, { status: 400 });
    }

    let existingMod: { id: string; title: string; source_url: string | null; creator: string | null; creator_id: string | null; status?: string | null; visibility?: string | null } | null = null;
    let existingError: unknown = null;
    if (platform === "gtainside") {
      const creatorMods: Array<{ id: string; title: string; creator: string | null; creator_id: string | null; source_url: string | null; status: string | null; visibility: string | null }> = [];
      for (let from = 0; ; from += 500) {
        const result = await context.supabase
          .from("mods")
          .select("id, title, creator, creator_id, source_url, status, visibility")
          .eq("creator_id", creatorId)
          .range(from, from + 499);
        if (result.error) {
          existingError = result.error;
          break;
        }
        creatorMods.push(...(result.data ?? []));
        if ((result.data ?? []).length < 500) break;
      }

      const titlePatterns = getSourceMatchTitleSearchPatterns(title, sourceUrl);
      const publicCandidates: typeof creatorMods = [];
      for (let index = 0; index < titlePatterns.length; index += 20) {
        for (let from = 0; ; from += 500) {
          const result = await context.supabase.from("mods")
            .select("id, title, creator, creator_id, source_url, status, visibility")
            .or(titlePatterns.slice(index, index + 20).map((pattern) => `title.ilike.${pattern}`).join(","))
            .eq("status", "published").in("visibility", ["public", "early_access"])
            .range(from, from + 499);
          if (result.error) {
            existingError = result.error;
            break;
          }
          publicCandidates.push(...(result.data ?? []));
          if ((result.data ?? []).length < 500) break;
        }
        if (existingError) break;
      }
      const linkedSource = await context.supabase.from("mod_sources")
        .select("mod_id")
        .eq("canonical_url", sourceUrl)
        .maybeSingle();
      if (linkedSource.error) existingError = linkedSource.error;
      if (linkedSource.data?.mod_id && !existingError) {
        const [publishedLink, ownedDraftLink] = await Promise.all([
          context.supabase.from("mods").select("id, title, creator, creator_id, source_url, status, visibility")
            .eq("id", linkedSource.data.mod_id).eq("status", "published").in("visibility", ["public", "early_access"]).maybeSingle(),
          context.supabase.from("mods").select("id, title, creator, creator_id, source_url, status, visibility")
            .eq("id", linkedSource.data.mod_id).eq("status", "draft").eq("creator_id", creatorId).maybeSingle(),
        ]);
        if (publishedLink.error || ownedDraftLink.error) existingError = publishedLink.error || ownedDraftLink.error;
        else if (publishedLink.data || ownedDraftLink.data) publicCandidates.push((publishedLink.data ?? ownedDraftLink.data)!);
      }
      const candidates = [...new Map([...creatorMods, ...publicCandidates]
        .filter((candidate) => candidate.status !== "draft" || candidate.creator_id === creatorId)
        .filter((candidate) => isDiscoveryMatchCandidateVisible(candidate, creatorId))
        .map((candidate) => [candidate.id, candidate])).values()];
      existingMod = candidates.find((mod) => isSameGtaInsideProject(project.externalId, sourceUrl, mod.source_url)) ?? null;

      if (!existingError) {
        const decision = decideGtaInsideImport({
          platform,
          externalId: project.externalId,
          title,
          author: project.author,
          projectUrl: sourceUrl,
        }, candidates, existingMod);

        if (decision.kind === "same_source_duplicate") existingMod = decision.mod;

        if (decision.kind === "cross_source_duplicate") {
          return NextResponse.json({
            error: "This GTAInside project matches an existing ModVault mod. Review it before adding.",
            code: "CROSS_SOURCE_DUPLICATE",
            reviewRequired: false,
            matchSource: "additional",
            mod: decision.mod,
          }, { status: 409 });
        }

        if (decision.kind === "review") {
          if (project.allowSeparateAfterReview !== true) {
            const matchCandidates = decision.candidates.map((candidate) => ({
              id: candidate.id,
              title: candidate.title,
              creator: candidate.creator,
              creator_id: candidate.creator_id,
              status: candidate.status,
              visibility: candidate.visibility,
              primarySourceUrl: candidate.source_url,
            }));
            return NextResponse.json({
              error: "The source creator is missing or the possible matches are ambiguous. Review before adding.",
              code: "SOURCE_MATCH_REVIEW_REQUIRED",
              reviewRequired: true,
              matchCandidates,
            }, { status: 409 });
          }
        }
      }
    } else {
      const result = await context.supabase
        .from("mods")
        .select("id, title, creator, creator_id, source_url")
        .eq("creator_id", creatorId)
        .eq("source_url", sourceUrl)
        .maybeSingle();
      existingMod = result.data;
      existingError = result.error;
    }
    if (existingError) {
      console.error("Import duplicate check failed:", existingError);
      return NextResponse.json({ error: "Could not check for an existing mod." }, { status: 500 });
    }
    if (existingMod) {
      return NextResponse.json({
        error: "This project is already in ModVault.",
        code: "SAME_SOURCE_DUPLICATE",
        reviewRequired: false,
        matchSource: "primary",
        mod: existingMod,
      }, { status: 409 });
    }

    const { data: mod, error: modError } = await context.supabase
      .from("mods")
      .insert({
        ...sourceValues,
        title,
        creator_id: creatorId,
        source_url: sourceUrl,
        status: "draft",
        release_state: "public",
        origin: platform,
      })
      .select("id, title, creator_id, source_url, status, origin, description, image, images, category, creator, features, requirements, notes, credits, download_url")
      .single();
    if (modError || !mod) {
      console.error("Mod import failed:", modError);
      return NextResponse.json({ error: "Could not create the mod record." }, { status: 500 });
    }

    const insertedValues = mod as unknown as Record<string, unknown>;
    if (Object.entries(sourceValues).some(([field, value]) => insertedValues[field] !== value)) {
      console.error("Imported source fields did not match the returned mod record.", {
        modId: mod.id,
        fields: Object.keys(sourceValues),
      });
      return NextResponse.json({
        error: "The mod was created, but imported source fields could not be verified. Contact support with the mod ID.",
        partial: true,
        modId: mod.id,
      }, { status: 500 });
    }

    const { error: creatorError } = await context.supabase
      .from("mod_creators")
      .insert({ mod_id: mod.id, creator_id: creatorId, role: "owner" });
    if (creatorError) {
      console.error("Mod creator relationship insert failed:", creatorError);
      return NextResponse.json({
        error: "The mod was created, but its creator relationship could not be saved. Contact support with the mod ID.",
        partial: true,
        modId: mod.id,
      }, { status: 500 });
    }

    if (platform === "gta5mods" || platform === "gtainside") {
      const { error: gameError } = await context.supabase
        .from("mod_games")
        .insert({ mod_id: mod.id, game_id: "84403598-540f-4e76-8955-968a058811eb" });
      if (gameError) {
        console.error("Mod game relationship insert failed:", gameError);
        return NextResponse.json({
          error: "The mod and creator relationship were saved, but the game relationship could not be saved. Contact support with the mod ID.",
          partial: true,
          modId: mod.id,
          mod,
        }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, mod }, { status: 201 });
  } catch (error) {
    console.error("Import mod API error:", error);
    return NextResponse.json({ error: "Unexpected import error." }, { status: 500 });
  }
}
