import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StandaloneLanguageControls } from "@/components/standalone-language-controls";

export default function CommercialTransactionsPage() {
  const seller = process.env.LEGAL_SELLER_NAME || "Postfolio運営者";
  const responsiblePerson =
    process.env.LEGAL_RESPONSIBLE_PERSON || "峰芝 駆";
  const address =
    process.env.LEGAL_SELLER_ADDRESS ||
    "請求があった場合、遅滞なく開示します。";
  const phone =
    process.env.LEGAL_SELLER_PHONE ||
    "請求があった場合、遅滞なく開示します。";
  const contact =
    process.env.LEGAL_CONTACT_EMAIL || "minesiba0888@gmail.com";

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/terms"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[var(--primary)]"
        >
          <ArrowLeft size={17} />
          利用規約へ戻る
        </Link>
        <StandaloneLanguageControls />
      </div>

      <h1 className="mt-8 text-3xl font-bold">
        特定商取引法に基づく表記
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        最終更新日：2026年6月20日
      </p>

      <div className="card mt-8 divide-y divide-slate-100 overflow-hidden">
        <Row label="販売事業者">{seller}</Row>
        <Row label="運営責任者">{responsiblePerson}</Row>
        <Row label="所在地">{address}</Row>
        <Row label="電話番号">{phone}</Row>
        <Row label="メールアドレス">{contact}</Row>
        <Row label="販売価格">
          プラン一覧ページに表示された月額料金に従います。表示価格は税込です。
        </Row>
        <Row label="商品代金以外の必要料金">
          インターネット接続料金、通信料金、振込手数料その他利用者側で発生する費用は利用者の負担となります。
        </Row>
        <Row label="支払方法">クレジットカード決済（Stripe）</Row>
        <Row label="支払時期">
          初回申込時および契約更新時に、選択したプランの月額料金が請求されます。
        </Row>
        <Row label="サービス提供時期">
          決済完了後、利用可能な状態になり次第すぐに提供します。
        </Row>
        <Row label="解約について">
          利用者はアプリ内またはStripeの管理画面から解約できます。解約後も契約期間の終了日までは有料プランを利用でき、契約期間終了後にFreeプランへ切り替わります。
        </Row>
        <Row label="返品・キャンセル・返金">
          デジタルサービスの性質上、利用開始後の返品、キャンセル、利用者都合による返金、日割り返金は原則として行いません。ただし、法令上必要な場合、重複決済、運営者の責めに帰すべき事由がある場合は個別に対応します。
        </Row>
        <Row label="動作環境">
          最新版の主要ブラウザでの利用を推奨します。利用端末や通信環境により、一部機能が正常に動作しない場合があります。
        </Row>
      </div>
    </main>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-2 p-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6 sm:p-6">
      <h2 className="text-sm font-bold text-slate-500">{label}</h2>
      <p className="text-sm leading-7 text-slate-700">{children}</p>
    </section>
  );
}
