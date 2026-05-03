import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { error } = await supabase.from("mods").insert([
  {
    title: body.title,
    description: body.description,
    image: body.image,
    images: body.images || null,
    creator: body.creator,
    source_url: body.source_url,
    download_url: body.download_url || null,
    features: body.features || null,
    requirements: body.requirements || null,
    notes: body.notes || null,
    credits: body.credits || null,
    downloads: 0,
    likes: 0,
    verified: false,
  },
]);

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}