import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUserToken } from "@/lib/auth-tokens";
import { sendVerificationEmail } from "@/lib/email";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/stripe";

const schema = z.object({ email: z.string().trim().email() });

export async function POST(request: NextRequest) {
  try {
    const { email } = schema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, emailVerifiedAt: true, passwordHash: true },
    });

    if (user && user.passwordHash && !user.emailVerifiedAt) {
      const token = await createUserToken(user.id, "EMAIL_VERIFICATION");
      const verifyUrl = `${appUrl(request.nextUrl.origin)}/verify-email?token=${token}`;
      await sendVerificationEmail(user.email, verifyUrl);
    }

    // Always generic so the response can't reveal which emails are registered.
    return NextResponse.json({
      message:
        "確認メールを送信しました。メールが届かない場合は、入力したメールアドレスをご確認ください。",
    });
  } catch (error) {
    return apiError(error);
  }
}
