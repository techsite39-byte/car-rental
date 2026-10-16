import { NextResponse } from "next/server";

const MAX_BODY_LENGTH = 12_000;
const BACKEND_TIMEOUT_MS = 12_000;

async function readLimitedBody(request: Request) {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let byteLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) return chunks.join("") + decoder.decode();

    byteLength += value.byteLength;
    if (byteLength > MAX_BODY_LENGTH) {
      await reader.cancel();
      return null;
    }
    chunks.push(decoder.decode(value, { stream: true }));
  }
}

function unavailableResponse() {
  return NextResponse.json(
    {
      code: "database_unavailable",
      error: "Booking confirmation is temporarily unavailable.",
    },
    { status: 503 },
  );
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json(
      { error: "Send booking details as JSON." },
      { status: 415 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { error: "Booking details are too large." },
      { status: 413 },
    );
  }

  const body = await readLimitedBody(request);
  if (body === null) {
    return NextResponse.json(
      { error: "Booking details are too large." },
      { status: 413 },
    );
  }

  const backendOrigin =
    process.env.BOOKING_API_URL?.trim() || "http://localhost:5000";
  let backendUrl: URL;
  try {
    backendUrl = new URL("/api/bookings", `${backendOrigin.replace(/\/+$/, "")}/`);
  } catch {
    return unavailableResponse();
  }

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": request.headers.get("idempotency-key") ?? "",
      },
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return unavailableResponse();
    }
    const headers = new Headers();
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) headers.set("Retry-After", retryAfter);
    return NextResponse.json(payload, {
      status: response.status,
      headers,
    });
  } catch {
    return unavailableResponse();
  }
}
