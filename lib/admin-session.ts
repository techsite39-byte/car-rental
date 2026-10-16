import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "epicdrive_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

function signature(expiresAt: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`epicdrive-admin:${expiresAt}`)
    .digest("base64url");
}

export function createAdminSessionToken(now = Date.now()) {
  const secret = sessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  const expiresAt = String(Math.floor(now / 1000) + ADMIN_SESSION_MAX_AGE);
  return `${expiresAt}.${signature(expiresAt, secret)}`;
}

export function verifyAdminSessionToken(token: string | undefined, now = Date.now()) {
  const secret = sessionSecret();
  if (!secret || !token) return false;
  const [expiresAt, suppliedSignature, extra] = token.split(".");
  if (!expiresAt || !suppliedSignature || extra || !/^\d+$/.test(expiresAt)) {
    return false;
  }
  if (Number(expiresAt) <= Math.floor(now / 1000)) return false;
  const expected = Buffer.from(signature(expiresAt, secret));
  const supplied = Buffer.from(suppliedSignature);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export async function hasAdminSession() {
  if (process.env.NODE_ENV === "development") return true;

  // TODO: Complete production auth hardening before configuring these secrets.
  if (!process.env.ADMIN_PASSWORD?.trim() || !sessionSecret()) return false;

  const cookieStore = await cookies();
  return verifyAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  };
}