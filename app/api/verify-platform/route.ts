import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlatformConnector } from "@/lib/connectors";

export const runtime = "nodejs";

const CHALLENGE_LIFETIME_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function generateVerificationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "MV-";

  for (let i = 0; i < 8; i++) {
    code += chars[randomInt(chars.length)];

    if (i === 3) {
      code += "-";
    }
  }

  return code;
}

function isValidProfileUrl(
  platform: string,
  value: unknown
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port
    ) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    if (platform === "gta5mods") {
      return (
        ["gta5-mods.com", "www.gta5-mods.com"].includes(hostname) &&
        /^\/users\/[^/]+\/?$/.test(url.pathname)
      );
    }

    if (platform === "gtainside") {
      return (
        ["gtainside.com", "www.gtainside.com"].includes(hostname) &&
        /^\/profile\/[^/]+\/?$/.test(url.pathname)
      );
    }

    return false;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  console.error("[VERIFY AUTH]", {
    hasUser: Boolean(user),
    errorName: authError?.name,
    errorMessage: authError?.message,
    status: authError?.status,
  });

  return NextResponse.json(
    { error: "You must be signed in to verify an identity." },
    { status: 401 }
  );
}

    let body: {
      action?: string;
      identityId?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { action, identityId } = body;

    if (
      typeof identityId !== "string" ||
      !identityId ||
      !["start", "check"].includes(action || "")
    ) {
      return NextResponse.json(
        { error: "Invalid verification request." },
        { status: 400 }
      );
    }

    // Load the identity through the authenticated client.
    // Never trust a profile URL or platform supplied by the browser.
    const { data: identity, error: identityError } = await supabase
      .from("external_identities")
      .select(`
        id,
        creator_id,
        profile_url,
        metadata,
        verification_status,
        platform:platforms (
          slug
        )
      `)
      .eq("id", identityId)
      .maybeSingle();

    if (identityError || !identity) {
      return NextResponse.json(
        { error: "Identity not found or access denied." },
        { status: 404 }
      );
    }

    // Preserve the existing creator ownership check.
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id")
      .eq("id", identity.creator_id)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: "You are not authorized to verify this identity." },
        { status: 403 }
      );
    }

    const platform = Array.isArray(identity.platform)
      ? identity.platform[0]
      : identity.platform;

    const platformSlug = platform?.slug;

    if (
      platformSlug !== "gta5mods" &&
      platformSlug !== "gtainside"
    ) {
      return NextResponse.json(
        { error: "Verification is not supported for this platform yet." },
        { status: 400 }
      );
    }

    if (!isValidProfileUrl(platformSlug, identity.profile_url)) {
      return NextResponse.json(
        { error: `The saved ${platformSlug} profile URL is invalid.` },
        { status: 400 }
      );
    }

    const connector = getPlatformConnector(platformSlug);

    if (!connector?.verification?.check) {
      return NextResponse.json(
        { error: "Verification is not available for this platform." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Verification server configuration is incomplete.");

      return NextResponse.json(
        { error: "Verification is temporarily unavailable." },
        { status: 500 }
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const metadata =
      identity.metadata &&
      typeof identity.metadata === "object" &&
      !Array.isArray(identity.metadata)
        ? identity.metadata
        : {};

    const existingChallenge = metadata.verification;

    if (action === "start") {
      if (identity.verification_status === "verified") {
        return NextResponse.json({
          verified: true,
          message: "This identity is already verified.",
        });
      }

      const now = new Date();

      const challenge = {
        code: generateVerificationCode(),
        createdAt: now.toISOString(),
        expiresAt: new Date(
          now.getTime() + CHALLENGE_LIFETIME_MS
        ).toISOString(),
        attempts: 0,
        status: "pending",
      };

      const { error: updateError } = await admin
        .from("external_identities")
        .update({
          metadata: {
            ...metadata,
            verification: challenge,
          },
          verification_status: "pending",
          verified_at: null,
        })
        .eq("id", identity.id);

      if (updateError) {
        console.error("VERIFICATION START ERROR:", updateError);

        return NextResponse.json(
          { error: "Could not start verification." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        verified: false,
        challenge,
        message: "Verification challenge created.",
      });
    }

    // From here onward, check the server-stored challenge.
    if (
      !existingChallenge ||
      typeof existingChallenge.code !== "string" ||
      existingChallenge.status !== "pending"
    ) {
      return NextResponse.json(
        { error: "No active verification challenge. Start again." },
        { status: 400 }
      );
    }

    const expiresAt = Date.parse(existingChallenge.expiresAt);

    if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
      const { error: expireError } = await admin
        .from("external_identities")
        .update({
          metadata: {
            ...metadata,
            verification: {
              ...existingChallenge,
              status: "expired",
            },
          },
        })
        .eq("id", identity.id);

      if (expireError) {
        console.error("CHALLENGE EXPIRATION ERROR:", expireError);
      }

      return NextResponse.json(
        { error: "The verification code has expired. Start again." },
        { status: 400 }
      );
    }

    const attempts = Number(existingChallenge.attempts || 0);

    if (attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many attempts. Start a new verification challenge." },
        { status: 429 }
      );
    }

    let verified = false;

    try {
      verified = await connector.verification.check(
        identity.profile_url,
        existingChallenge.code
      );
    } catch (error) {
      console.error("EXTERNAL VERIFICATION CHECK ERROR:", error);
    }

    if (!verified) {
      const nextAttempts = attempts + 1;

      const { error: attemptError } = await admin
        .from("external_identities")
        .update({
          metadata: {
            ...metadata,
            verification: {
              ...existingChallenge,
              attempts: nextAttempts,
              status: nextAttempts >= MAX_ATTEMPTS
                ? "expired"
                : "pending",
            },
          },
        })
        .eq("id", identity.id);

      if (attemptError) {
        console.error("VERIFICATION ATTEMPT UPDATE ERROR:", attemptError);
      }

      return NextResponse.json({
        verified: false,
        attemptsRemaining: Math.max(0, MAX_ATTEMPTS - nextAttempts),
        message: "The verification code was not found on the profile.",
      });
    }

    const verifiedAt = new Date().toISOString();

    const { error: verificationUpdateError } = await admin
      .from("external_identities")
      .update({
        verification_status: "verified",
        verified_at: verifiedAt,
        metadata: {
          ...metadata,
          verification: {
            ...existingChallenge,
            status: "verified",
            verifiedAt,
          },
        },
      })
      .eq("id", identity.id);

    if (verificationUpdateError) {
      console.error(
        "VERIFICATION UPDATE ERROR:",
        verificationUpdateError
      );

      return NextResponse.json(
        { error: "Verification succeeded, but saving the result failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verified: true,
      verifiedAt,
      message: "Identity verified successfully.",
    });
  } catch (error) {
    console.error("PLATFORM VERIFICATION ERROR:", error);

    return NextResponse.json(
      { error: "Verification request failed." },
      { status: 500 }
    );
  }
}