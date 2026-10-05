import { NextResponse } from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export async function POST(
  request: Request
) {
  try {

    const authHeader =
      request.headers.get(
        "Authorization"
      );

    const accessToken =
      authHeader?.startsWith(
        "Bearer "
      )
        ? authHeader.slice(7)
        : null;

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const supabase =
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          },
        }
      );

    const body =
      await request.json();

    const {
      modId,
      project,
    } = body;

    if (
      !modId ||
      !project
    ) {
      return NextResponse.json(
        {
          error:
            "Missing mod or project.",
        },
        {
          status: 400,
        }
      );
    }

    if (!project.title) {
      return NextResponse.json(
        {
          error:
            "Project title is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Refresh only metadata discovered
      from the external platform.

      Ownership, publication state,
      game relationships, and provenance
      are not changed here.
    */

    const updateData: Record<
      string,
      any
    > = {
      title:
        project.title,
    };

    if (
      project.imageUrl
    ) {
      updateData.image =
        project.imageUrl;
    }

    const {
      data: mod,
      error: modError,
    } = await supabase
      .from("mods")
      .update(
        updateData
      )
      .eq(
        "id",
        modId
      )
      .select(
        "id, title, creator_id, source_url, image, status, release_state, origin"
      )
      .single();

    if (modError) {

      console.error(
        "MOD UPDATE ERROR:",
        modError
      );

      return NextResponse.json(
        {
          error:
            "Could not update the mod record.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        mod,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.error(
      "UPDATE MOD API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unexpected update error.",
      },
      {
        status: 500,
      }
    );
  }
}