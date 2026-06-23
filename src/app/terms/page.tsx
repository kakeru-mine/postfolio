import Link from "next/link";
import { BackToPreviousButton } from "@/components/back-to-previous-button";
import { StandaloneLanguageControls } from "@/components/standalone-language-controls";
import { getOptionalCurrentUser } from "@/lib/user";

export default async function TermsPage() {
  const operator = process.env.LEGAL_OPERATOR_NAME || "Postfolio運営者";
  const user = await getOptionalCurrentUser();

  return (
    <LegalPage title="利用規約" updatedAt="2026年6月20日" isLoggedIn={Boolean(user)}>
      <Section title="1. 適用">
        本規約は、{operator}
        が提供するSNSリサーチサービス「Postfolio」の利用条件を定めるものです。
      </Section>
      <Section title="2. アカウント">
        利用者は、登録情報を正確に管理し、アカウントや認証情報を第三者に利用させないものとします。
      </Section>
      <Section title="3. 未成年の利用">
        未成年者は、親権者など法定代理人の同意を得たうえで本サービスを利用するものとします。
      </Section>
      <Section title="4. プランと利用制限">
        各プランには保存中アイテム数とAI分析回数の上限があります。保存操作の累計回数には制限を設けませんが、保存中アイテム数が上限に達している場合、新たな保存ができないことがあります。
      </Section>
      <Section title="5. 有料プラン">
        有料プランは月額制です。決済、請求、プラン変更、解約などの手続きにはStripeのサービスを利用します。解約後も契約期間の終了日までは有料プランの機能を利用できます。
      </Section>
      <Section title="6. 返金">
        デジタルサービスの性質上、利用者都合による返金や日割り返金は原則として行いません。ただし、法令上必要な場合、重複決済、運営者の責めに帰すべき事情がある場合は個別に確認のうえ対応します。
      </Section>
      <Section title="7. 退会・アカウント削除">
        利用者は、所定の手続きによりアカウントを削除できます。アカウント削除後、保存投稿、コレクション、タグ、AI分析結果、設定情報などは削除され、元に戻すことはできません。有料プラン契約中の場合、契約期間終了後に削除可能となる場合があります。
      </Section>
      <Section title="8. 禁止事項">
        法令違反、第三者の権利侵害、不正アクセス、サービスへの過度な負荷、APIキーなどの不正利用、その他運営者が不適切と判断する行為を禁止します。
      </Section>
      <Section title="9. 外部サービスとAI">
        本サービスはOpenAI、Stripe、各SNSなどの外部サービスを利用します。外部サービスの障害、仕様変更、取得情報の欠落、AI出力の正確性について完全性を保証しません。
      </Section>
      <Section title="10. 保存コンテンツと権利">
        利用者は、保存するURL、メモ、画像その他の情報について必要な権利または利用権限を有するものとします。第三者の著作権、肖像権、プライバシー、各SNSの規約その他の権利を侵害しない範囲で利用してください。
      </Section>
      <Section title="11. アカウント停止・データ削除">
        利用者が本規約に違反した場合、不正利用が疑われる場合、またはサービス運営上必要がある場合、運営者は事前通知なくアカウントの利用停止、投稿データの削除、利用制限を行うことがあります。
      </Section>
      <Section title="12. 免責">
        AI分析結果は参考情報であり、事実性、適法性、特定目的への適合性を保証するものではありません。重要な判断は利用者自身で確認してください。
      </Section>
      <Section title="13. 料金・プラン内容の変更">
        運営者は、事前に合理的な方法で通知したうえで、プラン内容、料金、保存枠、AI分析回数その他の利用条件を変更できるものとします。
      </Section>
      <Section title="14. 通知方法">
        運営者から利用者への通知は、アプリ内表示、登録メールアドレスへの送信、Webサイト上での掲載、その他合理的な方法により行います。
      </Section>
      <Section title="15. 変更・停止">
        運営者は、必要に応じて本サービスまたは本規約を変更・停止できます。重要な変更は合理的な方法で通知します。
      </Section>
      <Section title="16. 準拠法・管轄">
        本規約は日本法に準拠します。本サービスに関して紛争が生じた場合、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
      </Section>
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="font-bold">特定商取引法に基づく表記</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          有料プランの販売条件、事業者情報、解約・返金条件などは以下のページで確認できます。
        </p>
        <Link
          href="/commercial-transactions"
          className="mt-4 inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-[var(--primary-foreground)] transition hover:opacity-90"
        >
          特商法表記を確認する
        </Link>
      </section>
    </LegalPage>
  );
}

function LegalPage({
  title,
  updatedAt,
  isLoggedIn,
  children,
}: {
  title: string;
  updatedAt: string;
  isLoggedIn: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex items-center justify-between gap-4">
        <BackToPreviousButton
          fallbackHref={isLoggedIn ? "/" : "/welcome"}
          preferHistory={isLoggedIn}
        />
        <StandaloneLanguageControls />
      </div>
      <h1 className="mt-8 text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-slate-400">最終更新日：{updatedAt}</p>
      <div className="card mt-8 space-y-7 p-6 sm:p-10">{children}</div>
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
