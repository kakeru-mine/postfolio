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
import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "postfolio_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

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

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.$executeRaw`
    INSERT INTO "Session" ("id", "tokenHash", "userId", "expiresAt", "createdAt")
    VALUES (${randomUUID()}, ${tokenHash}, ${userId}, ${expiresAt}, NOW())
  `;

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

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

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

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
