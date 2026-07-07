type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

/**
 * Sends a transactional email via Resend. Returns false (without throwing) when
 * RESEND_API_KEY is missing or the send fails, so callers can keep working in
 * local/dev environments without email configured.
 */
export async function sendEmail({
  to,
  subject,
  text,
}: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`RESEND_API_KEY is not set; skipping email to ${to}`);
    return false;
  }

  const from =
    process.env.CONTACT_FROM_EMAIL ?? "Postfolio <onboarding@resend.dev>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        "Email send failed",
        await response.text().catch(() => ""),
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email send error", error);
    return false;
  }
}

export function sendVerificationEmail(to: string, verifyUrl: string) {
  return sendEmail({
    to,
    subject: "【Postfolio】メールアドレスの確認をお願いします",
    text: [
      "Postfolioへのご登録ありがとうございます。",
      "",
      "下記のリンクを開いて、メールアドレスの確認を完了してください。",
      verifyUrl,
      "",
      "※このリンクの有効期限は24時間です。",
      "※心当たりがない場合は、このメールを破棄してください。",
    ].join("\n"),
  });
}

/**
 * Notifies the operator that a new user has registered. The recipient is taken
 * from ADMIN_NOTIFICATION_EMAIL (falling back to the contact address). When no
 * address is configured the send is skipped, so registration keeps working.
 */
export function sendNewUserAdminNotification(input: {
  email: string;
  name: string | null;
  totalUsers: number;
}) {
  const to =
    process.env.ADMIN_NOTIFICATION_EMAIL ??
    process.env.CONTACT_TO_EMAIL ??
    process.env.LEGAL_CONTACT_EMAIL;
  if (!to) {
    console.warn(
      "ADMIN_NOTIFICATION_EMAIL is not set; skipping new-user notification",
    );
    return Promise.resolve(false);
  }

  return sendEmail({
    to,
    subject: "【Postfolio】新規登録がありました",
    text: [
      "新しいユーザーが登録しました。",
      "",
      `表示名: ${input.name ?? "(未設定)"}`,
      `メールアドレス: ${input.email}`,
      `登録ユーザー数(累計): ${input.totalUsers}`,
      "",
      "※メールアドレス確認の完了状況に関わらず、登録操作の時点で送信しています。",
    ].join("\n"),
  });
}

export function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: "【Postfolio】パスワード再設定のご案内",
    text: [
      "パスワード再設定のリクエストを受け付けました。",
      "",
      "下記のリンクを開いて、新しいパスワードを設定してください。",
      resetUrl,
      "",
      "※このリンクの有効期限は1時間です。",
      "※心当たりがない場合は、このメールを破棄してください。パスワードは変更されません。",
    ].join("\n"),
  });
}
