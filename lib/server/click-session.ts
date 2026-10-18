import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export function createClickSessionToken(secret: string): string {
  const sessionId = randomBytes(32).toString("hex");
  const signature = createHmac("sha256", secret).update(sessionId).digest("hex");
  return `${sessionId}.${signature}`;
}

export function verifyClickSessionToken(token: string | null, secret: string): string | null {
  if (!token) return null;
  const [sessionId, signature, ...extra] = token.split(".");
  if (extra.length || !TOKEN_PATTERN.test(sessionId ?? "") || !TOKEN_PATTERN.test(signature ?? "")) return null;
  const expected = createHmac("sha256", secret).update(sessionId).digest();
  const actual = Buffer.from(signature, "hex");
  return timingSafeEqual(expected, actual) ? sessionId : null;
}

export function getClickAnalyticsSecret(): string | null {
  return process.env.CLICK_ANALYTICS_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}
