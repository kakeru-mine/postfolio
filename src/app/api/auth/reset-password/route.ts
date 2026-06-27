import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { consumeUserToken } from "@/lib/auth-tokens";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください。")
    .max(128),
});

export async function POST(request: NextRequest) {
  try {
    const { token, password } = schema.parse(await request.json());
    const userId = await consumeUserToken(token, "PASSWORD_RESET");

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "再設定リンクが無効か、有効期限が切れています。お手数ですが再度お試しください。",
        },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        // Completing a reset proves email ownership and unlocks the account.
        emailVerifiedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    return NextResponse.json({
      message:
        "パスワードを再設定しました。新しいパスワードでログインしてください。",
    });
  } catch (error) {
    return apiError(error);
  }
}
