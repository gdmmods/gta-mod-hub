import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  req: Request
) {

  try {

    const token =
      req.headers
        .get("Authorization")
        ?.replace(
          "Bearer ",
          ""
        );

    if (!token) {

      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );

    }

    const body =
      await req.json();

    const supabase =
      createClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,
        process.env
          .SUPABASE_SERVICE_ROLE_KEY!
      );

    /* -----------------------------
       AUTH USER
    ----------------------------- */

    const {
      data: { user },
      error: authError,
    } =
      await supabase.auth
        .getUser(token);

    if (
      authError ||
      !user
    ) {

      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );

    }

    /* -----------------------------
       PARSE IMAGES
    ----------------------------- */

    let parsedImages =
      body.images || [];

    /* -----------------------------
       CREATE MOD
    ----------------------------- */

    const {
      data: mod,
      error: modError,
    } = await supabase
      .from("mods")
      .insert([
        {
          title:
            body.title,

          description:
            body.description,

          image:
            body.image,

          images:
            parsedImages,

          source_url:
            body.source_url,

          download_url:
            body.download_url,

          features:
            body.features,

          requirements:
            body.requirements,

          notes:
            body.notes,

          credits:
            body.credits,

          created_by:
            user.id,

          downloads: 0,
          likes: 0,
          verified: false,
        },
      ])
      .select()
      .single();

    if (
      modError ||
      !mod
    ) {

      console.error(
        modError
      );

      return NextResponse.json(
        {
          error:
            "Upload failed",
        },
        {
          status: 500,
        }
      );

    }

    /* -----------------------------
       PRIMARY CREATOR
    ----------------------------- */

    await supabase
      .from("mod_creators")
      .insert([
        {
          mod_id:
            mod.id,

          creator_id:
            body.creator_id,

          role:
            "owner",
        },
      ]);

    /* -----------------------------
       COLLABORATORS
    ----------------------------- */

    if (
      body.collaborators?.length
    ) {

      const rows =
        body.collaborators.map(
          (
            creatorId: string
          ) => ({
            mod_id:
              mod.id,

            creator_id:
              creatorId,

            role:
              "collaborator",
          })
        );

      await supabase
        .from("mod_creators")
        .insert(rows);

    }

    return NextResponse.json({
      success: true,
      modId: mod.id,
    });

  } catch (err) {

    console.error(err);

    return NextResponse.json(
      {
        error:
          "Server error",
      },
      {
        status: 500,
      }
    );

  }

}