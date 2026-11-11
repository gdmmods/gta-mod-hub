import { NextResponse } from "next/server";
import { isPublicModRelease } from "@/lib/server/public-creator-mods";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store, max-age=0" };
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

function unavailable() {
  return NextResponse.json({ error: "File not found" }, { status: 404, headers: noStore });
}

async function publicFile(modId: unknown) {
  if (typeof modId !== "string" || !uuid.test(modId)) return null;
  const { data: mod } = await supabaseAdmin.from("mods")
    .select("status,visibility,release_state").eq("id", modId).maybeSingle();
  if (!mod || !isPublicModRelease(mod)) return null;
  const { data: file } = await supabaseAdmin.from("mod_files")
    .select("storage_path,file_name").eq("mod_id", modId).order("created_at", { ascending: false })
    .limit(1).maybeSingle();
  return file?.storage_path?.startsWith(`mods/${modId}/`) ? file : null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const modId = body?.modId;
  if (!await publicFile(modId)) return unavailable();
  return NextResponse.json({ success: true, url: `/api/download-file?modId=${encodeURIComponent(modId)}` }, { headers: noStore });
}

export async function GET(request: Request) {
  const modId = new URL(request.url).searchParams.get("modId");
  const file = await publicFile(modId);
  if (!file) return unavailable();

  // Keep the short-lived storage URL server-side so every public request checks the release.
  const { data } = await supabaseAdmin.storage.from("mod-files-private").createSignedUrl(file.storage_path, 30);
  if (!data?.signedUrl) return unavailable();
  const upstream = await fetch(data.signedUrl, { cache: "no-store" }).catch(() => null);
  if (!upstream?.ok || !upstream.body) return unavailable();
  const filename = (file.file_name || "mod-download").replace(/[^a-zA-Z0-9_. -]/g, "_");
  return new Response(upstream.body, {
    headers: { ...noStore, "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${filename}"`, "X-Content-Type-Options": "nosniff" },
  });
}
