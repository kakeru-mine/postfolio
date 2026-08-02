import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { findOrCreateGoogleUser } from "@/lib/google-account";
import { canonicalAppUrl } from "@/lib/stripe";

const GOOGLE_STATE_COOKIE = "g_oauth_state";

function loginError(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login?error=google", request.url));
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  return response;
}

// Handles Google's OAuth redirect: verifies CSRF state, exchanges the code for
// tokens, reads the (verified) profile, then finds-or-creates the user by email
// and signs them in via the existing session layer. Google-verified email means
// no separate email-verification step is needed.
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return loginError(request);

  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return loginError(request);
  }

  try {
    const redirectUri = `${canonicalAppUrl(origin)}/api/auth/google/callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResponse.ok) return loginError(request);
    const tokens = (await tokenResponse.json()) as { access_token?: string };
    if (!tokens.access_token) return loginError(request);

    const userinfoResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!userinfoResponse.ok) return loginError(request);
    const profile = (await userinfoResponse.json()) as {
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };

    // Only trust a Google-verified email; otherwise never link/create an account.
    if (!profile.email || profile.email_verified !== true) {
      return loginError(request);
    }
    const userId = await findOrCreateGoogleUser({
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    });

    // Clear the CSRF cookie, then issue the session (sets the session cookie via
    // next/headers) and redirect into the app.
    const cookieStore = await cookies();
    cookieStore.delete(GOOGLE_STATE_COOKIE);
    await createSession(userId);
    return NextResponse.redirect(new URL("/", request.url));
  } catch {
    return loginError(request);
  }
}
