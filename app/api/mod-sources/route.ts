import { NextResponse } from "next/server";
import { getGtaInsideExternalId, normalizeGtaInsideProjectUrl } from "@/lib/connectors/gtainside";
import { normalizeGta5ModsProjectUrl } from "@/lib/connectors/sourceProjectUrl";
import { canManageCreator, getDiscoveryRequestContext } from "@/lib/server/discovery-mod-auth";

type LinkRequest = {
  modId?: unknown;
  platform?: unknown;
  projectUrl?: unknown;
  externalId?: unknown;
};

function normalizeVerifiedProjectUrl(link: LinkRequest): { platform: string; url: string } | null {
  if (link.platform === "gtainside") {
    const url = normalizeGtaInsideProjectUrl(link.projectUrl);
    if (!url || getGtaInsideExternalId(url) !== link.externalId) return null;
    return { platform: "gtainside", url };
  }

  if (link.platform === "gta5mods") {
    const url = normalizeGta5ModsProjectUrl(link.projectUrl);
    if (!url) return null;
    return { platform: "gta5mods", url };
  }

  return null;
}

export async function POST(request: Request) {
  const context = await getDiscoveryRequestContext(request);
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const links = body?.links;
    if (!Array.isArray(links) || links.length === 0 || links.length > 100) {
      return NextResponse.json({ error: "Provide between 1 and 100 source links." }, { status: 400 });
    }

    const results = [];
    const platforms = new Map<string, string>();

    for (const rawLink of links) {
      const link = rawLink && typeof rawLink === "object" ? rawLink as LinkRequest : {};
      const normalized = normalizeVerifiedProjectUrl(link);
      if (
        !normalized ||
        typeof link.modId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(link.modId)
      ) {
        results.push({ projectUrl: link.projectUrl ?? null, status: "invalid" });
        continue;
      }

      const { data: mod, error: modError } = await context.supabase
        .from("mods")
        .select("id, creator_id, source_url")
        .eq("id", link.modId)
        .maybeSingle();

      if (modError || !mod?.creator_id) {
        results.push({ projectUrl: normalized.url, status: "not_found" });
        continue;
      }
      if (!(await canManageCreator(context, mod.creator_id))) {
        results.push({ projectUrl: normalized.url, status: "forbidden" });
        continue;
      }

      const primaryUrl = normalized.platform === "gtainside"
        ? normalizeGtaInsideProjectUrl(mod.source_url)
        : normalizeGta5ModsProjectUrl(mod.source_url);
      if (primaryUrl === normalized.url) {
        results.push({ projectUrl: normalized.url, status: "primary_source" });
        continue;
      }

      let platformId = platforms.get(normalized.platform);
      if (!platformId) {
        const { data: platform, error: platformError } = await context.supabase
          .from("platforms")
          .select("id")
          .eq("slug", normalized.platform)
          .eq("status", "active")
          .maybeSingle();
        if (platformError || !platform) {
          results.push({ projectUrl: normalized.url, status: "platform_unavailable" });
          continue;
        }
        platformId = platform.id;
        platforms.set(normalized.platform, platform.id);
      }

      const { data: existingLink } = await context.supabase
        .from("mod_sources")
        .select("mod_id")
        .eq("platform_id", platformId)
        .eq("canonical_url", normalized.url)
        .maybeSingle();
      if (existingLink) {
        results.push({
          projectUrl: normalized.url,
          status: existingLink.mod_id === mod.id ? "already_linked" : "linked_elsewhere",
        });
        continue;
      }

      const { error: insertError } = await context.supabase
        .from("mod_sources")
        .insert({ mod_id: mod.id, platform_id: platformId, canonical_url: normalized.url });

      if (insertError?.code === "23505") {
        results.push({ projectUrl: normalized.url, status: "linked_elsewhere" });
      } else if (insertError) {
        console.error("Additional mod source insert failed:", insertError);
        results.push({ projectUrl: normalized.url, status: "failed" });
      } else {
        results.push({ projectUrl: normalized.url, status: "linked" });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Additional mod source request failed:", error);
    return NextResponse.json({ error: "Could not save additional source links." }, { status: 500 });
  }
}
