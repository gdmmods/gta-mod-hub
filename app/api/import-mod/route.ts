import { NextResponse } from "next/server";
import {
  canManageCreator,
  getDiscoveryRequestContext,
} from "@/lib/server/discovery-mod-auth";
import { getSourceUpdateValues } from "@/lib/server/discovery-update-values";

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
    const sourceUrl = project.projectUrl;
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

    const { data: existingMod, error: existingError } = await context.supabase
      .from("mods")
      .select("id, title, source_url")
      .eq("creator_id", creatorId)
      .eq("source_url", sourceUrl)
      .maybeSingle();
    if (existingError) {
      console.error("Import duplicate check failed:", existingError);
      return NextResponse.json({ error: "Could not check for an existing mod." }, { status: 500 });
    }
    if (existingMod) {
      return NextResponse.json({ error: "This project is already in ModVault.", mod: existingMod }, { status: 409 });
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

    if (platform === "gta5mods") {
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
