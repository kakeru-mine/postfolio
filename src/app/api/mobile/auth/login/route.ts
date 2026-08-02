import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  clearFailedLogins,
  issueSessionToken,
  registerFailedLogin,
  verifyPassword,
} from "@/lib/auth";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().trim().email("メールアドレスを確認してください。"),
  password: z.string().min(1, "パスワードを入力してください。").max(128),
});

// Mobile counterpart of /api/auth/login. Same credential checks, brute-force
// lock, and email-verified gate as the web login, but returns the session token
// in the response body (for `Authorization: Bearer`) instead of a cookie.
export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.parse(await request.json());
    const users = await prisma.$queryRaw<
      Array<{
        id: string;
        email: string;
        name: string | null;
        passwordHash: string | null;
        emailVerifiedAt: Date | null;
        failedLoginAttempts: number;
        lockedUntil: Date | null;
      }>
    >`
      SELECT "id", "email", "name", "passwordHash", "emailVerifiedAt", "failedLoginAttempts", "lockedUntil"
      FROM "User"
      WHERE "email" = ${input.email.toLowerCase()}
      LIMIT 1
    `;
    const user = users[0];

    if (!user) {
      return NextResponse.json(
        {
          error:
            "このメールアドレスは登録されていません。会員登録がお済みでない場合は、新規登録してください。",
          code: "NOT_REGISTERED",
        },
        { status: 401 },
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60_000,
      );
      return NextResponse.json(
        {
          error: `ログインの試行回数が上限を超えました。約${minutes}分後に再度お試しください。`,
        },
        { status: 429 },
      );
    }

    const valid =
      user.passwordHash &&
      (await verifyPassword(input.password, user.passwordHash));

    if (!valid) {
      await registerFailedLogin(user.id, user.failedLoginAttempts);
      return NextResponse.json(
        { error: "メールアドレスまたはパスワードが正しくありません。" },
        { status: 401 },
      );
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json(
        {
          error:
            "メールアドレスが未確認です。登録時に送信した確認メールのリンクから有効化してください。",
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 403 },
      );
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await clearFailedLogins(user.id);
    }

    const { token, expiresAt } = await issueSessionToken(user.id);
    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    return apiError(error);
  }
}
