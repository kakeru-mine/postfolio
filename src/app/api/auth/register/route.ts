import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { createUserToken } from "@/lib/auth-tokens";
import { sendNewUserAdminNotification, sendVerificationEmail } from "@/lib/email";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientInfo, logAuthEvent } from "@/lib/request-log";
import { canonicalAppUrl } from "@/lib/stripe";

const registerSchema = z.object({
  name: z.string().trim().min(1, "表示名を入力してください。").max(50),
  email: z.string().trim().email("メールアドレスを確認してください。"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください。").max(128),
  // "app" when the registration comes from the mobile app, so the verification
  // link returns the user into the app instead of the web dashboard.
  source: z.enum(["app", "web"]).optional(),
  // Honeypot: hidden from real users; only form-filling bots set it.
  website: z.string().optional(),
});

// Reserved / test-only email domains that legitimate users never sign up with
// (RFC 2606). Automated signups repeatedly used these, so reject them.
function isBlockedEmailDomain(email: string): boolean {
  const domain = email.split("@")[1] ?? "";
  if (["example.com", "example.net", "example.org", "test.com"].includes(domain))
    return true;
  return /\.(test|example|invalid|localhost)$/.test(domain);
}

export async function POST(request: NextRequest) {
  const client = getClientInfo(request);
  try {
    const limit = rateLimit(`register:${client.ip}`, 5, 10 * 60_000);
    if (!limit.allowed) {
      logAuthEvent("register.rate_limited", client);
      return NextResponse.json(
        { error: "リクエストが多すぎます。しばらく時間をおいてからお試しください。" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
      );
    }

    const input = registerSchema.parse(await request.json());

    // Honeypot tripped: pretend it succeeded but create nothing.
    if (input.website && input.website.trim().length > 0) {
      logAuthEvent("register.honeypot", client, { email: input.email });
      return NextResponse.json({
        pending: true,
        email: input.email.toLowerCase(),
        message:
          "確認メールを送信しました。メール内のリンクからメールアドレスの確認を完了してください。",
      });
    }

    const email = input.email.toLowerCase();

    if (isBlockedEmailDomain(email)) {
      logAuthEvent("register.blocked_domain", client, { email });
      return NextResponse.json(
        { error: "このメールアドレスは利用できません。" },
        { status: 400 },
      );
    }

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
    const verifyUrl = `${canonicalAppUrl(request.nextUrl.origin)}/verify-email?token=${token}${
      input.source === "app" ? "&source=app" : ""
    }`;
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
        WHERE "passwordHash" IS NOT NULL OR "emailVerifiedAt" IS NOT NULL
      `;
      await sendNewUserAdminNotification({
        email,
        name: user.name,
        totalUsers: Number(totalRows[0]?.count ?? 0),
      });
    } catch (notifyError) {
      console.error("Failed to send new-user admin notification", notifyError);
    }

    logAuthEvent("register.created", client, { email });

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
