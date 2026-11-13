import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  hasAdminSession,
} from "@/lib/admin-session";
import {
  BACKEND_API_URL_ERROR,
  getBackendApiUrl,
} from "@/lib/backend-api-url";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_CLIENT = 10;
const MAX_TRACKED_CLIENTS = 2_000;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function loginAttemptKeys(request: Request) {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  const clientAddress =
    forwardedFor?.[0] || request.headers.get("x-real-ip")?.trim() || "unknown";
  return [`client:${clientAddress}`];
}

function pruneExpiredLoginAttempts(now: number) {
  for (const [key, bucket] of loginAttempts) {
    if (bucket.resetAt <= now) loginAttempts.delete(key);
  }
}

function blockedUntil(keys: string[], now: number) {
  pruneExpiredLoginAttempts(now);
  return keys.reduce<number | null>((latest, key) => {
    const bucket = loginAttempts.get(key);
    return bucket && bucket.count >= MAX_ATTEMPTS_PER_CLIENT
      ? Math.max(latest ?? 0, bucket.resetAt)
      : latest;
  }, null);
}

function recordFailedLogin(keys: string[], now: number) {
  pruneExpiredLoginAttempts(now);
  for (const key of keys) {
    const bucket = loginAttempts.get(key);
    if (!bucket && loginAttempts.size >= MAX_TRACKED_CLIENTS) continue;
    loginAttempts.set(
      key,
      bucket
        ? { ...bucket, count: bucket.count + 1 }
        : { count: 1, resetAt: now + LOGIN_WINDOW_MS },
    );
  }
}

function resetLoginAttempts(keys: string[]) {
  for (const key of keys) loginAttempts.delete(key);
}

async function verifyWithBackend(email: unknown, password: unknown) {
  const backendUrl = getBackendApiUrl("/api/admin/login");
  if (!backendUrl) return "unavailable";
  if (typeof email !== "string" || typeof password !== "string") {
    return "rejected";
  }

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
    if (response.ok) return "authenticated";
    if (response.status === 401 || response.status === 400) return "rejected";
    if (response.status === 429) return "rate_limited";
    return "unavailable";
  } catch {
    return "unavailable";
  }
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function GET() {
  return NextResponse.json(
    { authenticated: await hasAdminSession() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const sessionSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  const adminApiToken = process.env.ADMIN_API_TOKEN?.trim();
  const backendUrl = getBackendApiUrl("/api/admin/login");
  if (!sessionSecret || sessionSecret.length < 32 || !adminApiToken || !backendUrl) {
    return NextResponse.json(
      {
        error: !backendUrl
          ? BACKEND_API_URL_ERROR
          : "Admin access is not configured on the server.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter the admin password." }, { status: 400 });
  }
  const email =
    typeof body === "object" && body !== null && "email" in body ? body.email : undefined;
  const password =
    typeof body === "object" && body !== null && "password" in body ? body.password : undefined;
  const remember =
    typeof body === "object" && body !== null && "remember" in body && body.remember === true;
  const attemptKeys = loginAttemptKeys(request);
  const now = Date.now();
  const resetAt = blockedUntil(attemptKeys, now);
  if (resetAt !== null) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((resetAt - now) / 1000))) },
      },
    );
  }

  const backendResult = await verifyWithBackend(email, password);
  if (backendResult === "rate_limited") {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 },
    );
  }
  if (backendResult === "unavailable") {
    return NextResponse.json(
      {
        error: !getBackendApiUrl("/api/admin/login")
          ? BACKEND_API_URL_ERROR
          : "Admin authentication is temporarily unavailable.",
      },
      { status: 503 },
    );
  }
  if (backendResult !== "authenticated") {
    recordFailedLogin(attemptKeys, now);
    return NextResponse.json(
      { error: "Invalid email or password. Please try again." },
      { status: 401 },
    );
  }
  resetLoginAttempts(attemptKeys);

  let token: string;
  try {
    token = createAdminSessionToken();
  } catch {
    return NextResponse.json(
      { error: "Admin session signing is not configured." },
      { status: 503 },
    );
  }
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions(remember));
  return response;
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    ...adminSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
