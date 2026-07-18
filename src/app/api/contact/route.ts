import { NextResponse } from "next/server";

const fallbackContactEmail = "postfolio0888@gmail.com";
const maxAttachmentCount = 3;
const maxFileBytes = 5 * 1024 * 1024;
const maxTotalBytes = 10 * 1024 * 1024;

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

type ResendAttachment = {
  filename: string;
  content: string;
};

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const toEmail =
      process.env.CONTACT_TO_EMAIL ??
      process.env.LEGAL_CONTACT_EMAIL ??
      fallbackContactEmail;
    const fromEmail =
      process.env.CONTACT_FROM_EMAIL ?? "Postfolio <onboarding@resend.dev>";

    if (!apiKey) {
      return jsonError(
        "メール送信設定が未完了です。RESEND_API_KEY を設定してください。",
        500,
      );
    }

    const formData = await request.formData();
    const name = getText(formData, "name");
    const replyTo = getText(formData, "replyTo");
    const subject = getText(formData, "subject");
    const body = getText(formData, "body");

    if (!name) {
      return jsonError("お名前を入力してください。");
    }

    if (!replyTo) {
      return jsonError("返信先メールアドレスを入力してください。");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
      return jsonError("返信先メールアドレスを確認してください。");
    }

    if (!subject) {
      return jsonError("件名を入力してください。");
    }

    if (!body) {
      return jsonError("お問い合わせ内容を入力してください。");
    }

    const files = formData
      .getAll("attachments")
      .filter((file): file is File => file instanceof File && file.size > 0);

    if (files.length > maxAttachmentCount) {
      return jsonError(`画像は${maxAttachmentCount}枚まで添付できます。`);
    }

    let totalBytes = 0;
    const attachments: ResendAttachment[] = [];

    for (const file of files) {
      if (!allowedImageTypes.has(file.type)) {
        return jsonError(
          "添付できる画像は jpg、jpeg、png、webp、gif、heic、heif のみです。",
        );
      }

      if (file.size > maxFileBytes) {
        return jsonError("添付画像は1枚5MB以内にしてください。");
      }

      totalBytes += file.size;
      if (totalBytes > maxTotalBytes) {
        return jsonError("添付画像の合計サイズは10MB以内にしてください。");
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      attachments.push({
        filename: file.name,
        content: bytes.toString("base64"),
      });
    }

    const text = [
      "Postfolioへのお問い合わせ",
      "",
      `お名前: ${name}`,
      `返信先メールアドレス: ${replyTo}`,
      "",
      "お問い合わせ内容:",
      body,
      "",
      attachments.length
        ? `添付画像: ${attachments.map((file) => file.filename).join(", ")}`
        : "添付画像: なし",
    ].join("\n");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject,
        text,
        reply_to: replyTo,
        attachments,
      }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      console.error("Contact email failed", result);
      return jsonError(
        "メール送信に失敗しました。送信設定を確認してください。",
        500,
      );
    }

    const autoReplyText = [
      `${name} 様`,
      "",
      "Postfolioへお問い合わせいただきありがとうございます。",
      "以下の内容でお問い合わせを受け付けました。",
      "確認後、必要に応じて返信いたします。",
      "",
      "件名:",
      subject,
      "",
      "お問い合わせ内容:",
      body,
      "",
      attachments.length
        ? `添付画像: ${attachments.map((file) => file.filename).join(", ")}`
        : "添付画像: なし",
      "",
      "※このメールは自動送信です。",
    ].join("\n");

    const autoReplyResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [replyTo],
        subject: "【Postfolio】お問い合わせを受け付けました",
        text: autoReplyText,
        reply_to: toEmail,
      }),
    });

    if (!autoReplyResponse.ok) {
      const result = (await autoReplyResponse.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      console.error("Contact auto reply failed", result);
    }

    return NextResponse.json({
      message: "お問い合わせを送信しました。",
    });
  } catch (error) {
    console.error(error);
    return jsonError(
      "送信に失敗しました。しばらくしてから再度お試しください。",
      500,
    );
  }
}
