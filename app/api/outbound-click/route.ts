import { createHash, createHmac, randomUUID } from "node:crypto";
import { isPublicModRelease } from "@/lib/server/public-creator-mods";
import { NextResponse } from "next/server";
import { parseCreatorBackupUrl } from "@/lib/server/creatorBackupUrl";
import {
  isCreatorSelfClick,
  isEligibleOutboundTarget,
  isOutboundClickAction,
  normalizeTrackedHttpsUrl,
} from "@/lib/server/click-analytics";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getClickAnalyticsSecret, verifyClickSessionToken } from "@/lib/server/click-session";

const SESSION_COOKIE = "mv_click_session";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readCookie(header: string | null, name: string): string | null {
  const cookie = header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return cookie?.slice(name.length + 1) ?? null;
}

export async function GET(request: Request) {
  let destination: string | null = null;
  try {
    const url = new URL(request.url);
    const modId = url.searchParams.get("mod");
    const action = url.searchParams.get("action");
    const target = normalizeTrackedHttpsUrl(url.searchParams.get("target"));
    const eventParam = url.searchParams.get("event");
    const eventId = eventParam && UUID_PATTERN.test(eventParam) ? eventParam : randomUUID();

    if (!modId || !UUID_PATTERN.test(modId) || !isOutboundClickAction(action) || !target) {
      return NextResponse.json({ error: "Invalid outbound link." }, { status: 400 });
    }

    const { data: mod, error: modError } = await supabaseAdmin
      .from("mods")
      .select("id, creator_id, status, visibility, release_state, download_url, source_url, creator_backup_url")
      .eq("id", modId)
      .maybeSingle();
    if (modError || !mod || !isPublicModRelease(mod)) {
      return NextResponse.json({ error: "Outbound link unavailable." }, { status: 404 });
    }

    const normalizedBackup = parseCreatorBackupUrl(mod.creator_backup_url);
    let otherSourceUrls: string[] = [];
    if (action === "other_source") {
      const { data: sources, error: sourceError } = await supabaseAdmin
        .from("mod_sources")
        .select("canonical_url")
        .eq("mod_id", mod.id);
      if (!sourceError) otherSourceUrls = (sources ?? []).map((source) => source.canonical_url);
    }
    const isValidTarget = isEligibleOutboundTarget({
      action,
      targetUrl: target,
      downloadUrl: mod.download_url,
      primarySourceUrl: mod.source_url,
      creatorBackupUrl: normalizedBackup.valid ? mod.creator_backup_url : null,
      otherSourceUrls,
    });
    if (!isValidTarget) {
      return NextResponse.json({ error: "Outbound link no longer matches this mod." }, { status: 404 });
    }
    const databaseTarget = action === "download"
      ? mod.download_url
      : action === "primary_source"
        ? mod.source_url
        : action === "creator_backup"
          ? mod.creator_backup_url
          : otherSourceUrls.find((source) => normalizeTrackedHttpsUrl(source) === target) ?? null;
    if (!databaseTarget) return NextResponse.json({ error: "Outbound link no longer matches this mod." }, { status: 404 });
    destination = target;

    const authClient = await createSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    let creatorOwnerId: string | null = null;
    if (mod.creator_id) {
      const { data: creator } = await supabaseAdmin
        .from("creators")
        .select("owner_id")
        .eq("id", mod.creator_id)
        .maybeSingle();
      creatorOwnerId = creator?.owner_id ?? null;
    }

    const sessionSecret = getClickAnalyticsSecret();
    const sessionId = sessionSecret
      ? verifyClickSessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), sessionSecret)
      : null;
    if (sessionSecret && sessionId && !isCreatorSelfClick(user?.id, creatorOwnerId)) {
      const sessionHash = createHmac("sha256", sessionSecret).update(sessionId).digest("hex");
      const targetHash = createHash("sha256").update(target).digest("hex");
      const { error: recordError } = await supabaseAdmin.rpc("record_mod_click", {
        p_event_id: eventId,
        p_mod_id: mod.id,
        p_action_type: action,
        p_target_hash: targetHash,
        p_target_url: databaseTarget,
        p_session_hash: sessionHash,
      });
      if (recordError) console.error("Outbound click recording failed:", recordError.message);
    }

    const response = NextResponse.redirect(destination, 302);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("Outbound click request failed:", error);
    if (destination) return NextResponse.redirect(destination, { status: 302, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ error: "Outbound link unavailable." }, { status: 500 });
  }
}
