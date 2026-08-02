import { NextRequest, NextResponse } from "next/server";
import { deleteSessionByToken, getBearerToken } from "@/lib/auth";
import { apiError } from "@/lib/http";

// Revokes the caller's session server-side. Idempotent: returns ok even if no
// token is present, so the client can safely clear its stored token regardless.
export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (token) await deleteSessionByToken(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
