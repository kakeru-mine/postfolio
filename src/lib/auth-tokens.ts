import { createHash, randomBytes } from "crypto";
import type { UserTokenType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS: Record<UserTokenType, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET: 60 * 60 * 1000, // 1 hour
};

// Minimum interval between sending the same type of email to a user, to throttle
// repeated requests (abuse / inbox spam / quota exhaustion).
export const RESEND_THROTTLE_MS = 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * True when a token of this type was issued to the user within `withinMs`,
 * i.e. an email was just sent and another should be throttled.
 */
export async function tokenIssuedRecently(
  userId: string,
  type: UserTokenType,
  withinMs: number = RESEND_THROTTLE_MS,
) {
  const recent = await prisma.userToken.count({
    where: {
      userId,
      type,
      createdAt: { gte: new Date(Date.now() - withinMs) },
    },
  });
  return recent > 0;
}

/**
 * Issues a single-use token of the given type for a user. Only the SHA-256 hash
 * is stored; the returned raw token is what goes into the emailed link. Any
 * existing token of the same type is replaced so only the latest link works.
 */
export async function createUserToken(userId: string, type: UserTokenType) {
  await prisma.userToken.deleteMany({ where: { userId, type } });

  const token = randomBytes(32).toString("base64url");
  await prisma.userToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS[type]),
    },
  });
  return token;
}

/**
 * Validates and consumes a token. Returns the userId on success (deleting the
 * token so it can't be reused), or null when the token is missing, the wrong
 * type, or expired.
 */
export async function consumeUserToken(
  token: string | undefined,
  type: UserTokenType,
) {
  if (!token) return null;

  const record = await prisma.userToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.type !== type) return null;

  if (record.expiresAt <= new Date()) {
    await prisma.userToken.delete({ where: { id: record.id } }).catch(() => {});
    return null;
  }

  await prisma.userToken.delete({ where: { id: record.id } });
  return record.userId;
}
