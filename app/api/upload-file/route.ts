import { NextResponse } from "next/server";

import { createClient }
from "@supabase/supabase-js";

export async function POST(
  req: Request
) {

  try {

    const formData =
      await req.formData();

    const file =
      formData.get("file") as File;

    const modId =
      formData.get("modId") as string;

    if (!file || !modId) {

      return NextResponse.json(
        {
          error:
            "Missing file or modId",
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

    const bytes =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(bytes);

    const filePath = `
mods/${modId}/${Date.now()}-${file.name}
`;

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from(
          "mod-files-private"
        )
        .upload(
          filePath,
          buffer,
          {
            contentType:
              file.type,
          }
        );

    if (uploadError) {

      console.error(
        uploadError
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

    const {
      error: dbError,
    } =
      await supabase
        .from("mod_files")
        .insert([
          {
            mod_id: modId,

            file_name:
              file.name,

            storage_path:
              filePath,

            file_size:
              file.size,
          },
        ]);

    if (dbError) {

      console.error(
        dbError
      );

    }

    return NextResponse.json({
      success: true,
      path: filePath,
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