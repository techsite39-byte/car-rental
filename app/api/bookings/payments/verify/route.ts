import { NextResponse } from "next/server";
import {
  BACKEND_API_URL_ERROR,
  getBackendApiUrl,
} from "@/lib/backend-api-url";

export async function POST(request: Request) {
  const backendUrl = getBackendApiUrl("/api/bookings/payments/verify");
  if (!backendUrl) {
    return NextResponse.json({ error: BACKEND_API_URL_ERROR }, { status: 503 });
  }
  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(await request.json()),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
    });
    return NextResponse.json(await response.json().catch(() => ({ error: "Payment verification unavailable." })), { status: response.status });
  } catch {
    return NextResponse.json({ error: "Payment verification unavailable." }, { status: 503 });
  }
}
