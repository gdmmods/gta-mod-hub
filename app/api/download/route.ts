import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is retired. Use the validated outbound link." },
    { status: 410 }
  );
}
