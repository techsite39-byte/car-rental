import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  hasAdminSession,
} from "@/lib/admin-session";

const DEFAULT_ADMIN_PASSWORD_HASH =
  "$2b$12$mZWyEV.THzfBX2Mava0S/.7CANeLu9YErQoXMtVC/W3yWNgzExJ6e";

async function credentialsMatch(email: unknown, password: unknown) {
  const configuredEmail =
    process.env.ADMIN_EMAIL?.trim().replace(/^['"]|['"]$/g, "").toLowerCase() ||
    "yourssanjay63@gmail.com";
  if (
    typeof email !== "string" ||
    email.trim().toLowerCase() !== configuredEmail ||
    typeof password !== "string"
  ) {
    return false;
  }

  const configuredHash = process.env.ADMIN_PASSWORD_HASH?.trim() || "";
  const usableHash = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(configuredHash)
    ? configuredHash
    : DEFAULT_ADMIN_PASSWORD_HASH;
  return bcrypt.compare(password, usableHash);
}

async function verifyWithBackend(email: unknown, password: unknown) {
  const backendUrl = process.env.BOOKING_API_URL?.trim();
  if (typeof email !== "string" || typeof password !== "string" || !backendUrl) return null;
  try {
    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
    if (response.ok) return true;
    if (response.status === 401 || response.status === 400) return false;
    return null;
  } catch {
    return null;
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
  if (
    (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) ||
    !process.env.ADMIN_SESSION_SECRET
  ) {
    return NextResponse.json(
      { error: "Admin access is not configured on the server." },
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
  const backendMatch = await verifyWithBackend(email, password);
  const validCredentials =
    backendMatch === null ? await credentialsMatch(email, password) : backendMatch;
  if (!validCredentials) {
    return NextResponse.json(
      { error: "Invalid email or password. Please try again." },
      { status: 401 },
    );
  }

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
