import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { canonicalAppUrl } from "@/lib/stripe";

const GOOGLE_STATE_COOKIE = "g_oauth_state";

// Kicks off the Google OAuth flow: sets a short-lived CSRF `state` cookie and
// redirects to Google's consent screen. The callback verifies the state.
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=google", request.url));
  }

  const state = randomBytes(24).toString("base64url");
  const redirectUri = `${canonicalAppUrl(request.nextUrl.origin)}/api/auth/google/callback`;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 minutes
  });
  return response;
}
