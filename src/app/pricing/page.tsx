import { Check } from "lucide-react";
import { BillingActionButton } from "@/components/billing-action-button";
import { CheckoutSync } from "@/components/checkout-sync";
import { PageHeader } from "@/components/page-header";
import { aiLimitLabel, planDefinitions } from "@/lib/plans";
import { requirePageUser } from "@/lib/user";

type SearchParams = Promise<{ checkout?: string; session_id?: string }>;

export default async function PricingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requirePageUser();
  const params = await searchParams;
  const hasPaidSubscription = Boolean(
    user.stripeSubscriptionId && user.plan !== "FREE",
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
      <PageHeader
        eyebrow="Simple monthly plans"
        title="プラン一覧"
        description="プランの確認と変更ができます。"
      />
      {params.checkout === "success" && params.session_id ? (
        <CheckoutSync sessionId={params.session_id} />
      ) : params.checkout === "success" ? (
        <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          お申し込みを受け付けました。プランが反映されました。
        </p>
      ) : null}
      {params.checkout === "cancelled" ? (
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-700">
          お申し込みはキャンセルされました。料金は発生していません。
        </p>
      ) : null}
      {user.subscriptionCancelAtPeriodEnd && user.subscriptionPeriodEnd ? (
        <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700">
          現在の有料プランは契約期間の終了時にFreeへ切り替わる予定です。
        </p>
      ) : null}

      <section className="mt-4 grid gap-2.5 sm:mt-8 sm:gap-5 lg:grid-cols-3">
        {Object.values(planDefinitions).map((definition) => {
          const isCurrent = user.plan === definition.plan;
          const isRecommended = definition.plan === "PRO";
          return (
            <article
              key={definition.plan}
              className={`card relative flex flex-col p-3 sm:p-6 ${
                isRecommended ? "border-[var(--primary)] ring-1 ring-[var(--primary)]" : ""
              }`}
            >
              {isRecommended ? (
                <span className="absolute -top-2 left-4 rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold text-[var(--primary-foreground)] sm:-top-3 sm:left-6 sm:px-3 sm:py-1 sm:text-xs">
                  おすすめ
                </span>
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-bold sm:text-xl">{definition.name}</h2>
                {isCurrent ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:px-2.5 sm:py-1 sm:text-xs">
                    現在のプラン
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-slate-500 sm:mt-3 sm:min-h-12 sm:line-clamp-none sm:text-sm sm:leading-6">
                {definition.description}
              </p>
              <p className="mt-1 sm:mt-5">
                <span className="text-2xl font-bold sm:text-4xl">
                  ¥{definition.priceYen.toLocaleString()}
                </span>
                <span className="ml-1 text-xs text-slate-400 sm:text-sm">
                  {definition.priceYen ? "/月" : ""}
                </span>
              </p>

              <ul className="mt-1.5 flex flex-wrap gap-1 border-t border-slate-100 pt-1.5 text-[11px] text-slate-600 sm:mt-6 sm:block sm:flex-1 sm:space-y-3 sm:pt-5 sm:text-sm">
                <Feature text={`保存枠 ${definition.savedItemLimit}件`} />
                <Feature
                  text={aiLimitLabel(definition)}
                />
              </ul>

              <div className="mt-2 sm:mt-7">
                {definition.plan === "FREE" ? (
                  <BillingActionButton
                    action="cancel"
                    variant="secondary"
                    disabled={
                      !hasPaidSubscription || user.subscriptionCancelAtPeriodEnd
                    }
                  >
                    {isCurrent
                      ? "利用中"
                      : user.subscriptionCancelAtPeriodEnd
                        ? "Freeへ変更予定"
                        : "Freeへ変更"}
                  </BillingActionButton>
                ) : isCurrent ? (
                  user.subscriptionCancelAtPeriodEnd ? (
                    <BillingActionButton action="resume" variant="secondary">
                      解約予約を取り消す
                    </BillingActionButton>
                  ) : (
                    <BillingActionButton
                      action="change-plan"
                      plan={definition.plan}
                      disabled
                    >
                      利用中
                    </BillingActionButton>
                  )
                ) : hasPaidSubscription ? (
                  <BillingActionButton
                    action="change-plan"
                    plan={definition.plan}
                    variant="secondary"
                  >
                    {definition.name}へ変更
                  </BillingActionButton>
                ) : (
                  <BillingActionButton
                    action="checkout"
                    plan={definition.plan}
                    disabled={isCurrent}
                  >
                    {isCurrent ? "利用中" : `${definition.name}を始める`}
                  </BillingActionButton>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs leading-6 text-slate-500 sm:mt-6 sm:p-5 sm:text-sm">
        <h2 className="font-bold text-slate-700">お申し込み前の確認</h2>
        <p className="mt-2">
          有料プランは月額制で、契約は月単位で自動更新されます。解約後も契約期間の終了日までは有料プランを利用でき、期間終了後にFreeプランへ切り替わります。利用者都合による日割り返金は原則として行いません。
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4 sm:mt-5 sm:p-5">
        <h2 className="text-sm font-bold text-slate-800 sm:text-base">
          課金・解約について
        </h2>
        <div className="mt-3 grid gap-3 text-xs leading-6 text-slate-500 sm:grid-cols-2 sm:text-sm">
          <Faq
            question="解約したらいつまで使えますか？"
            answer="契約期間の終了日までは有料プランを利用できます。終了後にFreeプランへ切り替わります。"
          />
          <Faq
            question="返金はありますか？"
            answer="利用者都合による日割り返金は原則として行いません。重複決済などは個別に確認します。"
          />
          <Faq
            question="プラン変更はいつ反映されますか？"
            answer="上位プランへの変更は、Stripeの請求ページで差額をお支払い後にすぐ反映されます。下位プランへの変更は、現在の契約期間の終了時に切り替わり、それまでは現在のプランをご利用いただけます。"
          />
          <Faq
            question="保存した投稿は消えますか？"
            answer="プラン変更や解約予約だけで保存投稿は削除されません。ただし、Freeの保存枠を超える場合は新規保存が制限されることがあります。"
          />
        </div>
      </section>

    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <li className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 sm:flex sm:gap-2 sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0">
      <Check size={12} className="text-[var(--primary)] sm:size-4" />
      {text}
    </li>
  );
}

function Faq({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
      <h3 className="font-bold text-slate-700">{question}</h3>
      <p className="mt-1">{answer}</p>
    </div>
  );
}
