import { timingSafeEqual, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  hasAdminSession,
} from "@/lib/admin-session";

function passwordMatches(candidate: unknown) {
  const configured = process.env.ADMIN_PASSWORD;
  if (typeof candidate !== "string" || !configured) return false;
  const expected = createHash("sha256").update(configured).digest();
  const supplied = createHash("sha256").update(candidate).digest();
  return timingSafeEqual(expected, supplied);
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
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
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
  const password =
    typeof body === "object" && body !== null && "password" in body
      ? body.password
      : undefined;
  if (!passwordMatches(password)) {
    return NextResponse.json({ error: "The password was not accepted." }, { status: 401 });
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
  response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
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