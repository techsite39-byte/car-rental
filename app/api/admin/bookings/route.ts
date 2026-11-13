import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-session";
import {
  BACKEND_API_URL_ERROR,
  getBackendApiUrl,
} from "@/lib/backend-api-url";

export async function GET() {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Admin authorization required." }, { status: 401 });
  const backendUrl = getBackendApiUrl("/api/admin/bookings");
  if (!backendUrl) return NextResponse.json({ error: BACKEND_API_URL_ERROR }, { status: 503 });
  const token = process.env.ADMIN_API_TOKEN?.trim();
  if (!token) return NextResponse.json({ error: "Admin API is not configured." }, { status: 503 });
  try {
    const response = await fetch(backendUrl, {
      headers: { "x-admin-api-token": token },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json(await response.json().catch(() => ({ error: "Unable to load bookings." })), { status: response.status });
  } catch {
    return NextResponse.json({ error: "Unable to load bookings." }, { status: 503 });
  }
}
