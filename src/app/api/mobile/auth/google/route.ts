import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { issueSessionToken } from "@/lib/auth";
import { findOrCreateGoogleUser } from "@/lib/google-account";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientInfo, logAuthEvent } from "@/lib/request-log";

const bodySchema = z.object({
  idToken: z.string().min(1),
});

// Allowed audiences for the Google ID token. Native Google Sign-In is normally
// configured with the Web OAuth client as the serverClientId, so the token's
// `aud` is GOOGLE_CLIENT_ID; GOOGLE_ANDROID_CLIENT_ID covers the Android client.
function allowedAudiences() {
  return [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
  ].filter((value): value is string => Boolean(value));
}

// Mobile Google sign-in. The native app obtains a Google ID token; we verify it
// server-side (signature + claims) via Google's tokeninfo endpoint, then
// find-or-create the user and return a session token in the body.
export async function POST(request: NextRequest) {
  const client = getClientInfo(request);
  try {
    const limit = rateLimit(`google-mobile:${client.ip}`, 10, 10 * 60_000);
    if (!limit.allowed) {
      logAuthEvent("google_mobile.rate_limited", client);
      return NextResponse.json(
        { error: "リクエストが多すぎます。しばらくしてからお試しください。" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
      );
    }

    const { idToken } = bodySchema.parse(await request.json());

    const audiences = allowedAudiences();
    if (!audiences.length) {
      // Server misconfiguration: no client id to validate against.
      return NextResponse.json(
        { error: "Googleログインは現在利用できません。" },
        { status: 503 },
      );
    }

    const verifyResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { cache: "no-store", signal: AbortSignal.timeout(10_000) },
    );
    if (!verifyResponse.ok) {
      return NextResponse.json(
        { error: "Googleの認証に失敗しました。" },
        { status: 401 },
      );
    }

    const claims = (await verifyResponse.json()) as {
      aud?: string;
      iss?: string;
      email?: string;
      email_verified?: boolean | string;
      name?: string;
      picture?: string;
    };

    const issuerOk =
      claims.iss === "accounts.google.com" ||
      claims.iss === "https://accounts.google.com";
    const audienceOk = Boolean(claims.aud && audiences.includes(claims.aud));
    // tokeninfo returns email_verified as the string "true"/"false".
    const emailVerified =
      claims.email_verified === true || claims.email_verified === "true";

    if (!issuerOk || !audienceOk || !claims.email || !emailVerified) {
      return NextResponse.json(
        { error: "Googleの認証に失敗しました。" },
        { status: 401 },
      );
    }

    logAuthEvent("google_mobile.login", client, { email: claims.email });

    const userId = await findOrCreateGoogleUser({
      email: claims.email,
      name: claims.name,
      picture: claims.picture,
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    const { token, expiresAt } = await issueSessionToken(userId);
    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
      user,
    });
  } catch (error) {
    return apiError(error);
  }
}
