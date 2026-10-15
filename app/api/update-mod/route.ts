import { NextResponse } from "next/server";
import {
  canManageCreator,
  getDiscoveryRequestContext,
} from "@/lib/server/discovery-mod-auth";
import {
  getSourceUpdateValues,
  normalizeProjectUrl,
  validateAcceptedUpdateValues,
} from "@/lib/server/discovery-update-values";

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
    const accepted = validateAcceptedUpdateValues(body.acceptedFields);
    if (!accepted) {
      return NextResponse.json({ error: "Select at least one valid field to update." }, { status: 400 });
    }

    const { data: mod, error: lookupError } = await context.supabase
      .from("mods")
      .select("id, creator_id, source_url, title, description, category, creator, image, images, features, requirements, notes, credits, download_url")
      .eq("id", body.modId)
      .maybeSingle();
    if (lookupError) {
      console.error("Mod update lookup failed:", lookupError);
      return NextResponse.json({ error: "Could not load this mod for update." }, { status: 500 });
    }
    if (!mod || !mod.creator_id || !await canManageCreator(context, mod.creator_id)) {
      return NextResponse.json({ error: "You are not authorized to manage this mod." }, { status: 403 });
    }
    if (normalizeProjectUrl(body.project.projectUrl) !== normalizeProjectUrl(mod.source_url)) {
      return NextResponse.json({ error: "The discovered project does not match this saved mod." }, { status: 400 });
    }

    const proposed = getSourceUpdateValues(body.project);
    for (const [field, value] of Object.entries(accepted)) {
      if (proposed[field as keyof typeof proposed] !== value) {
        return NextResponse.json({ error: "An accepted value no longer matches the comparison. Compare again." }, { status: 400 });
      }
    }

    const current: Record<string, unknown> = {
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
    const changes: Record<string, string> = {};
    for (const [field, value] of Object.entries(accepted)) {
      if (current[field] !== value) changes[field] = value;
    }
    if (!Object.keys(changes).length) {
      return NextResponse.json({ success: true, mod, updatedFields: [] });
    }

    const { data: updated, error: updateError } = await context.supabase
      .from("mods")
      .update(changes)
      .eq("id", mod.id)
      .eq("creator_id", mod.creator_id)
      .select("id, title, creator_id, source_url, description, category, creator, image, images, features, requirements, notes, credits, download_url")
      .single();

    if (updateError || !updated) {
      console.error("Mod update failed:", updateError);
      return NextResponse.json({ error: "The selected fields could not be updated." }, { status: 500 });
    }

    const updatedValues = updated as unknown as Record<string, unknown>;
    if (Object.entries(changes).some(([field, value]) => updatedValues[field] !== value)) {
      console.error("Mod update returned values that do not match the accepted fields.", {
        modId: mod.id,
        fields: Object.keys(changes),
      });
      return NextResponse.json({ error: "The saved values could not be verified. Reload the mod before retrying." }, { status: 500 });
    }

    return NextResponse.json({ success: true, mod: updated, updatedFields: Object.keys(changes) });
  } catch (error) {
    console.error("Update mod API error:", error);
    return NextResponse.json({ error: "Unexpected update error." }, { status: 500 });
  }
}
