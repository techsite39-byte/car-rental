import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const backendOrigin = process.env.BOOKING_API_URL?.trim() || "http://localhost:5000";
  try {
    const response = await fetch(`${backendOrigin.replace(/\/+$/, "")}/api/bookings/payments/verify`, {
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
