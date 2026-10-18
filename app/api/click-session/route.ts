import { NextResponse } from "next/server";
import { createClickSessionToken, getClickAnalyticsSecret } from "@/lib/server/click-session";

const SESSION_COOKIE = "mv_click_session";

export async function POST() {
  const secret = getClickAnalyticsSecret();
  if (!secret) return NextResponse.json({ error: "Click tracking is unavailable." }, { status: 503 });

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE, createClickSessionToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
