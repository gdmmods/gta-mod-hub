import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    /* -----------------------------
       CLEAN INPUTS
    ----------------------------- */

    const creatorName =
      body.creator?.trim() || "Unknown";

    let parsedImages = null;

    try {
      parsedImages = body.images
        ? JSON.parse(body.images)
        : null;
    } catch {
      parsedImages = null;
    }

    /* -----------------------------
       FIND OR CREATE CREATOR
    ----------------------------- */

    let creatorId: string | null = null;

    const { data: existingCreator } = await supabase
      .from("creators")
      .select("id")
      .ilike("name", creatorName)
      .maybeSingle();

    if (existingCreator) {
      creatorId = existingCreator.id;
    } else {
      const { data: newCreator, error: creatorError } =
        await supabase
          .from("creators")
          .insert([
            {
              name: creatorName,
            },
          ])
          .select()
          .single();

      if (creatorError) {
        console.error(
          "CREATOR INSERT ERROR:",
          creatorError
        );

        return NextResponse.json(
          { error: "Creator creation failed" },
          { status: 500 }
        );
      }

      creatorId = newCreator.id;
    }

    /* -----------------------------
       CREATE MOD
    ----------------------------- */

    const { data: mod, error: modError } =
      await supabase
        .from("mods")
        .insert([
          {
            title: body.title,
            description: body.description,
            image: body.image,
            images: parsedImages,
            creator: creatorName,
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
        ])
        .select()
        .single();

    if (modError || !mod) {
      console.error("MOD INSERT ERROR:", modError);

      return NextResponse.json(
        { error: "Mod upload failed" },
        { status: 500 }
      );
    }

    /* -----------------------------
       LINK MOD <-> CREATOR
    ----------------------------- */

    if (creatorId) {
      const { error: relationError } = await supabase
        .from("mod_creators")
        .insert([
          {
            mod_id: mod.id,
            creator_id: creatorId,
          },
        ]);

      if (relationError) {
        console.error(
          "RELATION INSERT ERROR:",
          relationError
        );
      }
    }

    return NextResponse.json({
      success: true,
      modId: mod.id,
    });

  } catch (err) {
    console.error("API ERROR:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}