import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUserToken } from "@/lib/auth-tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { canonicalAppUrl } from "@/lib/stripe";

const schema = z.object({ email: z.string().trim().email() });

export async function POST(request: NextRequest) {
  try {
    const { email } = schema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, passwordHash: true },
    });

    // Only send to accounts that actually have a password set.
    if (user && user.passwordHash) {
      const token = await createUserToken(user.id, "PASSWORD_RESET");
      const resetUrl = `${canonicalAppUrl(request.nextUrl.origin)}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }

    // Always generic so the response can't reveal which emails are registered.
    return NextResponse.json({
      message:
        "パスワード再設定用のメールを送信しました。メールが届いた場合は、リンクから再設定してください。",
    });
  } catch (error) {
    return apiError(error);
  }
}
