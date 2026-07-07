import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { createUserToken } from "@/lib/auth-tokens";
import { sendNewUserAdminNotification, sendVerificationEmail } from "@/lib/email";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { canonicalAppUrl } from "@/lib/stripe";

const registerSchema = z.object({
  name: z.string().trim().min(1, "表示名を入力してください。").max(50),
  email: z.string().trim().email("メールアドレスを確認してください。"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください。").max(128),
});

export async function POST(request: NextRequest) {
  try {
    const input = registerSchema.parse(await request.json());
    const email = input.email.toLowerCase();
    const passwordHash = await hashPassword(input.password);
    const existingRows = await prisma.$queryRaw<
      Array<{ id: string; email: string; name: string | null; passwordHash: string | null }>
    >`
      SELECT "id", "email", "name", "passwordHash"
      FROM "User"
      WHERE "email" = ${email}
      LIMIT 1
    `;
    const existing = existingRows[0];

    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "このメールアドレスはすでに登録されています。" },
        { status: 409 },
      );
    }

    const legacyEmail =
      process.env.DEMO_USER_EMAIL?.toLowerCase() ?? "demo@example.com";
    const legacyRows = existing
      ? []
      : await prisma.$queryRaw<
          Array<{ id: string; email: string; passwordHash: string | null }>
        >`
          SELECT "id", "email", "passwordHash"
          FROM "User"
          WHERE "email" = ${legacyEmail}
          LIMIT 1
        `;
    const authenticatedUserCounts = existing
      ? []
      : await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint AS "count"
          FROM "User"
          WHERE "passwordHash" IS NOT NULL
        `;
    const unclaimedLegacyUser =
      legacyRows[0]?.passwordHash === null &&
      Number(authenticatedUserCounts[0]?.count ?? 1) === 0
        ? legacyRows[0]
        : null;

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { name: input.name },
        })
      : unclaimedLegacyUser
        ? await prisma.user.update({
            where: { id: unclaimedLegacyUser.id },
            data: { name: input.name, email },
          })
      : await prisma.user.create({
          data: { name: input.name, email },
        });
    await prisma.$executeRaw`
      UPDATE "User"
      SET "passwordHash" = ${passwordHash}, "emailVerifiedAt" = NULL, "updatedAt" = NOW()
      WHERE "id" = ${user.id}
    `;

    // Require email ownership confirmation before the account can sign in.
    const token = await createUserToken(user.id, "EMAIL_VERIFICATION");
    const verifyUrl = `${canonicalAppUrl(request.nextUrl.origin)}/verify-email?token=${token}`;
    const verificationSent = await sendVerificationEmail(email, verifyUrl);

    // If the confirmation email could not be sent, do not report the
    // registration as complete: the user would be stuck unable to verify or
    // sign in. The account row already exists, so retrying registration (or the
    // resend-verification flow) will re-issue the email.
    if (!verificationSent) {
      return NextResponse.json(
        {
          error:
            "確認メールの送信に失敗しました。しばらく時間をおいて、もう一度お試しください。",
        },
        { status: 502 },
      );
    }

    // Notify the operator that a new user registered. Kept non-blocking so a
    // notification failure never breaks the user's registration.
    try {
      const totalRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS "count"
        FROM "User"
        WHERE "passwordHash" IS NOT NULL
      `;
      await sendNewUserAdminNotification({
        email,
        name: user.name,
        totalUsers: Number(totalRows[0]?.count ?? 0),
      });
    } catch (notifyError) {
      console.error("Failed to send new-user admin notification", notifyError);
    }

    return NextResponse.json({
      pending: true,
      email,
      message:
        "確認メールを送信しました。メール内のリンクからメールアドレスの確認を完了してください。",
    });
  } catch (error) {
    return apiError(error);
  }
}
