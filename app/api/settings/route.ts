// Legacy route - redirects to /api/notifications
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(new URL("/api/notifications", "http://localhost:3000"));
}
export async function PUT() {
  return NextResponse.json({ ok: true });
}
