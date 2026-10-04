import { NextResponse } from "next/server";

import {
  getPlatformConnector,
} from "@/lib/connectors";


export async function POST(
  request: Request
) {

  try {

    const body =
      await request.json();

    const connectorSlug =
      body.connector;

    const profileUrl =
      body.profileUrl;

    const verificationCode =
      body.verificationCode;

    if (
      !connectorSlug ||
      !profileUrl ||
      !verificationCode
    ) {
      return NextResponse.json(
        {
          error:
            "Missing verification data.",
        },
        {
          status: 400,
        }
      );
    }

    const connector =
      getPlatformConnector(
        connectorSlug
      );

    if (
      !connector?.verification?.check
    ) {
      return NextResponse.json(
        {
          error:
            "Platform verification is not supported.",
        },
        {
          status: 400,
        }
      );
    }

    const verified =
      await connector.verification.check(
        profileUrl,
        verificationCode
      );

    return NextResponse.json({
      verified,
    });

  } catch (error) {

    console.error(
      "PLATFORM VERIFICATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Verification request failed.",
      },
      {
        status: 500,
      }
    );

  }

}