import { NextResponse } from "next/server";
import {
  canManageCreator,
  getDiscoveryRequestContext,
} from "@/lib/server/discovery-mod-auth";
import {
  getSourceUpdateValues,
  getSourceDescriptionDisplayValues,
  normalizeProjectUrl,
} from "@/lib/server/discovery-update-values";
import { isGtaInsideSourceRecord } from "@/lib/connectors/gtainside";
import { isValidGta5ModsProjectUrl } from "@/lib/connectors/sourceProjectUrl";

export async function POST(request: Request) {
  try {
    const context = await getDiscoveryRequestContext(request);
    if (!context) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    if (typeof body?.modId !== "string" || !body.project || typeof body.project !== "object") {
      return NextResponse.json({ error: "Missing mod or project." }, { status: 400 });
    }

    const { data: mod, error } = await context.supabase
      .from("mods")
      .select("id, creator_id, source_url, origin, title, description, category, creator, image, images, features, requirements, notes, credits, download_url")
      .eq("id", body.modId)
      .maybeSingle();
    if (error) {
      console.error("Mod comparison lookup failed:", error);
      return NextResponse.json({ error: "Could not load this mod for comparison." }, { status: 500 });
    }
    if (!mod || !mod.creator_id || !await canManageCreator(context, mod.creator_id)) {
      return NextResponse.json({ error: "You are not authorized to manage this mod." }, { status: 403 });
    }
    const isGtaInside = body.project.platform === "gtainside" || mod.origin === "gtainside";
    const matchesSource = isGtaInside
      ? body.project.platform === "gtainside" &&
        isGtaInsideSourceRecord(mod.origin, body.project.externalId, body.project.projectUrl, mod.source_url)
      : body.project.platform === "gta5mods" && isValidGta5ModsProjectUrl(body.project.projectUrl) &&
        normalizeProjectUrl(body.project.projectUrl) === normalizeProjectUrl(mod.source_url);
    if (!matchesSource) {
      return NextResponse.json({ error: "The discovered project does not match this saved mod." }, { status: 400 });
    }

    const current = {
      title: mod.title,
      description: mod.description,
      category: mod.category,
      creator: mod.creator,
      image: mod.image,
      images: mod.images,
      features: mod.features,
      requirements: mod.requirements,
      notes: mod.notes,
      credits: mod.credits,
      download_url: mod.download_url,
    };
    const proposed = getSourceUpdateValues(body.project);
    return NextResponse.json({ success: true, current, proposed, sourceDisplay: getSourceDescriptionDisplayValues(body.project) });
  } catch (error) {
    console.error("Compare mod API error:", error);
    return NextResponse.json({ error: "Unexpected comparison error." }, { status: 500 });
  }
}
