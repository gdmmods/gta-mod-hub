import { NextResponse } from "next/server";

import { createClient }
from "@supabase/supabase-js";
import { parseCreatorBackupUrl } from "@/lib/server/creatorBackupUrl";
import { normalizeModCategory } from "@/lib/vehicle-subcategories";
import { isPublicModRelease, publicCreatorModAccess } from "@/lib/server/public-creator-mods";
import { canUserUploadToCreator } from "@/lib/server/creator-upload-authorization";

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

    if (!creatorData || !(await canUserUploadToCreator(supabase, user.id, body.creator_id))) { return NextResponse.json({ error: "You do not have upload permission for this creator profile." }, { status: 403 }); }

    /* -----------------------------
       CREATE MOD
    ----------------------------- */

    const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
    const uploadId = body.uploadId ?? crypto.randomUUID();
    const collaborators: unknown = body.collaborators ?? [];
    const status = body.status ?? "published";
    const visibility = body.visibility ?? "public";
    const releaseState = body.release_state ?? "public";
    const accessStates: readonly string[] = [...publicCreatorModAccess, "supporters"];
    if (typeof uploadId !== "string" || !uuid.test(uploadId) ||
        !Array.isArray(collaborators) || collaborators.some(id => typeof id !== "string" || !uuid.test(id)) ||
        !["published", "draft", "pending", "archived"].includes(status) ||
        !accessStates.includes(visibility) || !accessStates.includes(releaseState) ||
        (body.notifyFollowers !== undefined && typeof body.notifyFollowers !== "boolean")) {
      return NextResponse.json({ error: "Invalid publication options." }, { status: 400 });
    }

    const { data: modId, error: modError } = await supabase.rpc("publish_uploaded_mod", {
      p_id: uploadId,
      p_collaborators: collaborators,
      p_payload: {
        title: body.title,
        category: normalizedCategory,
        description: body.description,
        creator: creatorData.name || null,
        image: body.image,
        images: parsedImages,
        source_url: body.source_url,
        download_url: body.download_url,
        creator_backup_url: creatorBackup.url,
        features: body.features,
        requirements: body.requirements,
        notes: body.notes,
        credits: body.credits,
        visibility,
        delivery_mode: body.delivery_mode,
        support_url: body.support_url,
        external_purchase_url: body.external_purchase_url,
        ownership_required: body.ownership_required,
        release_state: releaseState,
        is_paid: body.is_paid,
        price: body.price,
        creator_id: body.creator_id,
        created_by: user.id,
        downloads: 0,
        likes: 0,
        verified: false,
        status,
        notify_followers_on_publication: body.notifyFollowers === true && isPublicModRelease({ status, visibility, release_state: releaseState }),
      },
    });

    if (modError || !modId) {
      console.error("MOD INSERT ERROR:", modError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    return NextResponse.json({

      success: true,

      modId:
        modId,

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
