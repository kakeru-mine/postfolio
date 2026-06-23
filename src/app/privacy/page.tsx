import { BackToPreviousButton } from "@/components/back-to-previous-button";
import { StandaloneLanguageControls } from "@/components/standalone-language-controls";
import { getOptionalCurrentUser } from "@/lib/user";

export default async function PrivacyPage() {
  const operator = process.env.LEGAL_OPERATOR_NAME || "Postfolio運営者";
  const user = await getOptionalCurrentUser();

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex items-center justify-between gap-4">
        <BackToPreviousButton
          fallbackHref={user ? "/" : "/welcome"}
          preferHistory={Boolean(user)}
        />
        <StandaloneLanguageControls />
      </div>
      <h1 className="mt-8 text-3xl font-bold">プライバシーポリシー</h1>
      <p className="mt-2 text-sm text-slate-400">最終更新日：2026年6月20日</p>
      <div className="card mt-8 space-y-7 p-6 sm:p-10">
        <Section title="1. 取得する情報">
          {operator}
          は、メールアドレス、表示名、保存URL、メモ、タグ、コレクション、AI分析結果、契約プラン、利用量、決済識別子、お問い合わせフォームに入力された名前、返信先メールアドレス、件名、お問い合わせ内容、添付画像、IPアドレス、User-Agent、操作日時などのログ情報を取得する場合があります。
        </Section>
        <Section title="2. 利用目的">
          サービス提供、保存投稿の検索・AI分析、利用上限の管理、契約・課金管理、不正利用防止、障害調査、品質改善、お問い合わせ対応、自動返信、重要なお知らせや会員登録完了通知の送信のために利用します。
        </Section>
        <Section title="3. AI分析">
          AI分析を実行した場合、対象投稿のURL、タイトル、本文、説明、投稿者情報、画像をOpenAIへ送信します。ユーザーの用途、メモ、ユーザー作成タグ、引用投稿、スレッド情報はAI分析へ送信しません。
        </Section>
        <Section title="4. お問い合わせフォーム">
          お問い合わせフォームを送信した場合、入力内容および任意で添付された画像を、内容確認、返信、送信者への自動返信のために利用します。メール送信にはResendを利用する場合があります。
        </Section>
        <Section title="5. Cookie等の利用">
          本サービスは、ログイン状態の維持、セキュリティ、不正利用防止、利用状況の把握のためにCookie、セッション情報、これに類する技術を利用します。
        </Section>
        <Section title="6. 決済情報">
          決済はStripeが処理します。本サービスはカード番号そのものを保存せず、Stripeの顧客ID、契約ID、Price ID、契約状態を保存します。
        </Section>
        <Section title="7. 外部送信先・海外送信">
          OpenAI、Stripe、Resend、URL情報取得対象となる外部サイトへ、機能提供に必要な範囲で情報を送信します。これらの送信先には、日本国外に所在する事業者が含まれる場合があります。各事業者の取り扱いは、それぞれの規約・ポリシーに従います。
        </Section>
        <Section title="8. 第三者提供">
          法令に基づく場合、本人の同意がある場合、またはサービス提供に必要な業務委託先へ必要な範囲で取り扱いを委託する場合を除き、本人の同意なく個人情報を第三者に提供しません。
        </Section>
        <Section title="9. 保存期間とアカウント削除時の扱い">
          利用目的に必要な期間、情報を保存します。アカウント削除後、保存投稿、メモ、タグ、コレクション、AI分析結果、設定情報などは削除されます。ただし、契約・請求、不正対策、障害調査、法令対応に必要な情報は、必要な期間保持する場合があります。
        </Section>
        <Section title="10. 安全管理">
          アクセス制御、秘密情報の環境変数管理、Webhook署名検証など、合理的な安全管理措置を講じます。
        </Section>
        <Section title="11. 漏えい等が発生した場合の対応">
          個人情報の漏えい、滅失、毀損等が発生した場合、法令に従い、必要に応じて関係機関への報告、本人への通知、再発防止策の実施を行います。
        </Section>
        <Section title="12. 開示・訂正・削除">
          保有情報の開示、訂正、削除などを希望する場合は、本人確認に必要な情報を添えてお問い合わせください。
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">{children}</p>
    </section>
  );
}
