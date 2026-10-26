import { NextResponse } from "next/server";

import { createClient }
from "@supabase/supabase-js";
import { parseCreatorBackupUrl } from "@/lib/server/creatorBackupUrl";
import { normalizeModCategory } from "@/lib/vehicle-subcategories";

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

    if (typeof body.category !== "string" || !body.category.trim()) {
      return NextResponse.json(
        { error: "Select a valid mod category." },
        { status: 400 }
      );
    }
    const normalizedCategory = normalizeModCategory(body.category, {
      title: body.title,
      description: body.description,
      tags: body.tags,
    }).category;

    const creatorBackup = parseCreatorBackupUrl(body.creator_backup_url);
    if (!creatorBackup.valid) {
      return NextResponse.json(
        { error: "Creator Backup must be a valid HTTPS URL." },
        { status: 400 }
      );
    }

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

    const parsedImages =
      body.images || [];

    /* -----------------------------
       FETCH CREATOR
    ----------------------------- */

    const {
      data: creatorData,
    } =
      await supabase
        .from("creators")
        .select("name, owner_id")
        .eq(
          "id",
          body.creator_id
        )
        .single();

    if (!creatorData || creatorData.owner_id !== user.id) {
      return NextResponse.json(
        { error: "You must own this creator profile to upload a mod." },
        { status: 403 }
      );
    }

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

          /* BASIC */

          title:
            body.title,

          category:
            normalizedCategory,

          description:
            body.description,

          creator:
            creatorData?.name || null,

          image:
            body.image,

          images:
            parsedImages,

          source_url:
            body.source_url,

          download_url:
            body.download_url,

          creator_backup_url:
            creatorBackup.url,

          features:
            body.features,

          requirements:
            body.requirements,

          notes:
            body.notes,

          credits:
            body.credits,

          /* MONETIZATION */

          visibility:
            body.visibility,

          delivery_mode:
            body.delivery_mode,

          support_url:
            body.support_url,

          external_purchase_url:
            body.external_purchase_url,

          ownership_required:
            body.ownership_required,

          release_state:
            body.release_state,

          /* FUTURE MARKETPLACE */

          is_paid:
            body.is_paid,

          price:
            body.price,

          /* SYSTEM */

          creator_id:
            body.creator_id,

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
        "MOD INSERT ERROR:",
        JSON.stringify(
          modError,
          null,
          2
        )
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

      modId:
        mod.id,

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
