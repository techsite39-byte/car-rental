import { NextResponse } from "next/server";

export async function POST() {
  // Deliberately do not claim an email was sent. Configure SMTP and a persistent
  // admin store before enabling password reset in production.
  return NextResponse.json(
    {
      error: "Password reset email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and ADMIN_RESET_URL_BASE before enabling it.",
    },
    { status: 503 },
  );
}
