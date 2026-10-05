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
      creatorId,
      project,
    } = body;

    if (
      !creatorId ||
      !project
    ) {
      return NextResponse.json(
        {
          error:
            "Missing creator or project.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !project.title ||
      !project.projectUrl
    ) {
      return NextResponse.json(
        {
          error:
            "Project title and source URL are required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Prevent importing the same external
      project twice for this creator.
    */

    const {
      data: existingMod,
      error: existingError,
    } = await supabase
      .from("mods")
      .select(
        "id, title, source_url"
      )
      .eq(
        "creator_id",
        creatorId
      )
      .eq(
        "source_url",
        project.projectUrl
      )
      .maybeSingle();

    if (existingError) {

      console.error(
        "EXISTING MOD CHECK ERROR:",
        existingError
      );

      return NextResponse.json(
        {
          error:
            "Could not check for an existing mod.",
        },
        {
          status: 500,
        }
      );
    }

    if (existingMod) {

      return NextResponse.json(
        {
          error:
            "This project is already in ModVault.",
          mod: existingMod,
        },
        {
          status: 409,
        }
      );
    }

    /*
      Create the ModVault mod record.

      We preserve the external source rather
      than downloading or rehosting files.
    */

   const {
    data: mod,
    error: modError,
    } = await supabase
    .from("mods")
    .insert({
        title:
        project.title,

        creator_id:
        creatorId,

        source_url:
        project.projectUrl,

        status:
        "draft",

        release_state:
        "public",

        origin:
        project.platform,
    })
      .select(
        "id, title, creator_id, source_url, status, origin"
      )
      .single();

    if (modError) {

      console.error(
        "MOD IMPORT ERROR:",
        modError
      );

      return NextResponse.json(
        {
          error:
            "Could not create the mod record.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      Preserve the creator relationship.
    */

    const {
      error: creatorError,
    } = await supabase
      .from("mod_creators")
      .insert({
        mod_id:
          mod.id,

        creator_id:
          creatorId,

        role:
          "owner",
      });

    if (creatorError) {

      console.error(
        "MOD CREATOR RELATIONSHIP ERROR:",
        creatorError
      );

      /*
        Roll back the mod if the creator
        relationship could not be created.
      */

      await supabase
        .from("mods")
        .delete()
        .eq(
          "id",
          mod.id
        );

      return NextResponse.json(
        {
          error:
            "Could not create the creator relationship.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      GTA5-Mods projects currently represent
      GTA V in the discovery flow.
    */

    if (
      project.platform ===
      "gta5mods"
    ) {

      const gtaVGameId =
        "84403598-540f-4e76-8955-968a058811eb";

      const {
        error: gameError,
      } = await supabase
        .from("mod_games")
        .insert({
          mod_id:
            mod.id,

          game_id:
            gtaVGameId,
        });

      if (gameError) {

        console.error(
          "MOD GAME RELATIONSHIP ERROR:",
          gameError
        );

        await supabase
          .from("mod_creators")
          .delete()
          .eq(
            "mod_id",
            mod.id
          );

        await supabase
          .from("mods")
          .delete()
          .eq(
            "id",
            mod.id
          );

        return NextResponse.json(
          {
            error:
              "Could not create the game relationship.",
          },
          {
            status: 500,
          }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        mod,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.error(
      "IMPORT MOD API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unexpected import error.",
      },
      {
        status: 500,
      }
    );
  }
}