import { NextRequest, NextResponse } from "next/server";
import { deleteCurrentSession, requireApiUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { cleanupOrphanedImages } from "@/lib/saved-item-cleanup";

// Removing re-hosted images for every saved item can take a while.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const hasActivePaidSubscription =
      user.plan !== "FREE" &&
      Boolean(user.stripeSubscriptionId);

    if (hasActivePaidSubscription) {
      return NextResponse.json(
        {
          error:
            "有料プラン契約中です。先にプラン一覧からFreeへの変更予約を行い、契約期間終了後に退会してください。",
        },
        { status: 400 },
      );
    }

    const deletedEmail = user.email;
    const deletedName = user.name;
    // Capture image URLs before the cascade delete removes the rows.
    const storedImages = await prisma.savedItem.findMany({
      where: { userId: user.id },
      select: { thumbnailUrl: true, mediaUrls: true },
    });
    await prisma.user.delete({ where: { id: user.id } });
    await deleteCurrentSession();
    await cleanupOrphanedImages(storedImages).catch((error) => {
      console.error("Account deletion image cleanup failed", error);
    });
    await sendAccountDeletedEmail({
      email: deletedEmail,
      name: deletedName,
    }).catch((error) => {
      console.error("Account deletion email failed", error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}

async function sendAccountDeletedEmail({
  email,
  name,
}: {
  email: string;
  name: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const fromEmail =
    process.env.CONTACT_FROM_EMAIL ?? "Postfolio <onboarding@resend.dev>";
  const contactEmail =
    process.env.CONTACT_TO_EMAIL ??
    process.env.LEGAL_CONTACT_EMAIL ??
    "postfolio0888@gmail.com";
  const displayName = name || email;
  const text = [
    `${displayName} 様`,
    "",
    "Postfolioのアカウント削除を受け付けました。",
    "保存投稿、コレクション、タグ、AI分析結果、設定情報は削除対象になります。",
    "",
    "この操作に心当たりがない場合は、下記の連絡先までお問い合わせください。",
    contactEmail,
    "",
    "※このメールは自動送信です。",
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: "【Postfolio】アカウント削除を受け付けました",
      text,
      reply_to: contactEmail,
    }),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as
      | { message?: string; error?: string }
      | null;
    console.error("Account deletion email failed", result);
  }
}
