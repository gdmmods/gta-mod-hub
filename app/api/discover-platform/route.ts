import {
  NextResponse,
} from "next/server";

import {
  getPlatformConnector,
} from "@/lib/connectors";

export async function POST(
  request: Request
) {

  try {

    const body =
      await request.json();

    const {
      connector,
      profileUrl,
    } = body;

    if (
      !connector ||
      !profileUrl
    ) {

      return NextResponse.json(
        {
          error:
            "Missing connector or profile URL.",
        },
        {
          status: 400,
        }
      );

    }

    const platformConnector =
      getPlatformConnector(
        connector
      );

    if (!platformConnector) {

  return NextResponse.json({
    projects: [],
    skipped: true,
    connector,
  });

}

    const projects =
      await platformConnector.discover(
        profileUrl
      );

    return NextResponse.json({
      projects,
    });

  } catch (error) {

    console.error(
      "PLATFORM DISCOVERY ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Platform discovery failed.",
      },
      {
        status: 500,
      }
    );

  }

}