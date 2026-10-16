import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { hasAdminSession } from "@/lib/admin-session";

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_BODY_LENGTH = 12_000;
type RouteContext = { params: Promise<{ identifier: string }> };

async function backendRequest(path: string, method: string, body?: string) {
  const origin = process.env.BOOKING_API_URL?.trim() || "http://localhost:5000";
  const url = new URL(path, `${origin.replace(/\/+$/, "")}/`);
  const headers = new Headers();
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (method !== "GET") {
    const token = process.env.ADMIN_API_TOKEN?.trim();
    if (!token) {
      return NextResponse.json(
        { error: "Fleet administration is not configured on the server." },
        { status: 503 },
      );
    }
    headers.set("X-Admin-API-Key", token);
  }
  try {
    const response = await fetch(url, {
      method,
      headers,
      ...(body !== undefined ? { body } : {}),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (method !== "GET" && response.ok) {
      revalidateTag("fleet", { expire: 0 });
    }
    return NextResponse.json(
      payload && typeof payload === "object"
        ? payload
        : { error: "Fleet service returned an invalid response." },
      { status: response.status, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Fleet data is temporarily unavailable." },
      { status: 503 },
    );
  }
}

async function readBody(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_LENGTH) return null;
  const body = await request.text();
  return new TextEncoder().encode(body).byteLength <= MAX_BODY_LENGTH ? body : null;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { identifier } = await params;
  return backendRequest(`/api/fleet/${encodeURIComponent(identifier)}`, "GET");
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Admin authorization required." }, { status: 401 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Send vehicle details as JSON." }, { status: 415 });
  }
  const body = await readBody(request);
  if (body === null) {
    return NextResponse.json({ error: "Vehicle details are too large." }, { status: 413 });
  }
  const { identifier } = await params;
  return backendRequest(`/api/fleet/${encodeURIComponent(identifier)}`, "PATCH", body);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Admin authorization required." }, { status: 401 });
  }
  const { identifier } = await params;
  return backendRequest(`/api/fleet/${encodeURIComponent(identifier)}`, "DELETE");
}