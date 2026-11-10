import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-session";

export async function GET() {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Admin authorization required." }, { status: 401 });
  const backendOrigin = process.env.BOOKING_API_URL?.trim() || "http://localhost:5000";
  const token = process.env.ADMIN_API_TOKEN?.trim() || process.env.ADMIN_SESSION_SECRET?.trim();
  if (!token) return NextResponse.json({ error: "Admin API is not configured." }, { status: 503 });
  try {
    const response = await fetch(`${backendOrigin.replace(/\/+$/, "")}/api/admin/bookings`, {
      headers: { "x-admin-api-token": token },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json(await response.json().catch(() => ({ error: "Unable to load bookings." })), { status: response.status });
  } catch {
    return NextResponse.json({ error: "Unable to load bookings." }, { status: 503 });
  }
}
