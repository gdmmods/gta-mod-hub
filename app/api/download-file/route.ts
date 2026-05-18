import { NextResponse }
from "next/server";

import { createClient }
from "@supabase/supabase-js";

export async function POST(
  req: Request
) {

  try {

    const body =
      await req.json();

    const {
      modId,
    } = body;

    if (!modId) {

      return NextResponse.json(
        {
          error:
            "Missing modId",
        },
        {
          status: 400,
        }
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
       FIND FILE
    ----------------------------- */

    const {
      data: file,
      error: fileError,
    } =
      await supabase
        .from("mod_files")
        .select("*")
        .eq(
          "mod_id",
          modId
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .single();

    if (
      fileError ||
      !file
    ) {

      return NextResponse.json(
        {
          error:
            "File not found",
        },
        {
          status: 404,
        }
      );

    }

    /* -----------------------------
       CREATE SIGNED URL
    ----------------------------- */

    const {
      data,
      error,
    } =
      await supabase.storage
        .from(
          "mod-files-private"
        )
        .createSignedUrl(
          file.storage_path,
          60
        );

    if (
      error ||
      !data?.signedUrl
    ) {

      console.error(
        error
      );

      return NextResponse.json(
        {
          error:
            "Could not generate download",
        },
        {
          status: 500,
        }
      );

    }

    return NextResponse.json({
      success: true,
      url: data.signedUrl,
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