import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "crypto";
import type { User } from "@prisma/client";
import { promisify } from "util";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "postfolio_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// Brute-force protection: lock an account after too many consecutive failed
// logins for a cooldown window. Tracked in the database so it holds across
// serverless instances.
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;

export class AuthenticationError extends Error {
  constructor() {
    super("ログインが必要です。");
    this.name = "AuthenticationError";
  }
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, keyHex] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !keyHex) return false;

  const storedKey = Buffer.from(keyHex, "hex");
  const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer;
  return (
    storedKey.length === derivedKey.length &&
    timingSafeEqual(storedKey, derivedKey)
  );
}

/**
 * Records a failed login. Once the consecutive failure count reaches the
 * threshold, the account is locked for {@link LOGIN_LOCK_DURATION_MS} and the
 * counter resets so the next window starts fresh after the lock expires.
 */
export async function registerFailedLogin(
  userId: string,
  currentAttempts: number,
) {
  if (currentAttempts + 1 >= MAX_FAILED_LOGIN_ATTEMPTS) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: new Date(Date.now() + LOGIN_LOCK_DURATION_MS),
      },
    });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: { increment: 1 } },
  });
}

/** Clears the failed-login counter and lock after a successful login. */
export async function clearFailedLogins(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}

/**
 * Mints a session token, persists it, and stamps the last-login time — but does
 * NOT set a cookie. This is the shared chokepoint for every sign-in. Web callers
 * use {@link createSession} (cookie); mobile/API callers take the returned token
 * and deliver it in the response body for `Authorization: Bearer` use.
 */
export async function issueSessionToken(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.$executeRaw`
    INSERT INTO "Session" ("id", "tokenHash", "userId", "expiresAt", "createdAt")
    VALUES (${randomUUID()}, ${tokenHash}, ${userId}, ${expiresAt}, NOW())
  `;

  // Track last login for the admin user list. Every sign-in flows through here.
  await prisma.$executeRaw`
    UPDATE "User" SET "lastLoginAt" = NOW() WHERE "id" = ${userId}
  `;

  return { token, expiresAt };
}

export async function createSession(userId: string) {
  const { token, expiresAt } = await issueSessionToken(userId);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.$executeRaw`
      DELETE FROM "Session"
      WHERE "tokenHash" = ${hashSessionToken(token)}
    `;
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Resolves a raw session token (from a cookie or an Authorization header) to its
 * user, deleting the row and returning null if the session has expired.
 */
async function resolveUserFromToken(token: string): Promise<User | null> {
  const sessions = await prisma.$queryRaw<
    Array<{ sessionId: string; expiresAt: Date } & User>
  >`
    SELECT
      s."id" AS "sessionId",
      s."expiresAt",
      u."id",
      u."email",
      u."name",
      u."avatarUrl",
      u."passwordHash",
      u."plan",
      u."stripeCustomerId",
      u."stripeSubscriptionId",
      u."stripePriceId",
      u."subscriptionStatus",
      u."subscriptionPeriodEnd",
      u."subscriptionCancelAtPeriodEnd",
      u."scheduledPlan",
      u."onboardingSeenAt",
      u."aiAnalysisUsedAt",
      u."themeBackground",
      u."themeMain",
      u."themeAccent",
      u."themeSidebar",
      u."createdAt",
      u."updatedAt"
    FROM "Session" s
    INNER JOIN "User" u ON u."id" = s."userId"
    WHERE s."tokenHash" = ${hashSessionToken(token)}
    LIMIT 1
  `;
  const session = sessions[0];

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.$executeRaw`
        DELETE FROM "Session"
        WHERE "id" = ${session.sessionId}
      `;
    }
    return null;
  }

  const { sessionId: _, expiresAt: __, ...user } = session;
  void _;
  void __;
  return user;
}

export const getAuthenticatedUser = cache(async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return resolveUserFromToken(token);
});

/** Reads the bearer token from an `Authorization: Bearer <token>` header. */
export function getBearerToken(request: Request): string | null {
  const header =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

/**
 * Authenticates an API request, accepting either an `Authorization: Bearer`
 * token (mobile clients) or the session cookie (web). The same endpoints can
 * therefore serve both. Throws {@link AuthenticationError} when unauthenticated.
 */
export async function requireApiUser(request: Request): Promise<User> {
  const bearer = getBearerToken(request);
  if (bearer) {
    const user = await resolveUserFromToken(bearer);
    if (!user) throw new AuthenticationError();
    return user;
  }
  const user = await getAuthenticatedUser();
  if (!user) throw new AuthenticationError();
  return user;
}

/** Revokes a session by its raw token (mobile logout). */
export async function deleteSessionByToken(token: string) {
  await prisma.$executeRaw`
    DELETE FROM "Session"
    WHERE "tokenHash" = ${hashSessionToken(token)}
  `;
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
