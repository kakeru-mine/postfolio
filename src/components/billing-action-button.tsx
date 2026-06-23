"use client";

import { useState } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type BillingAction =
  | "checkout"
  | "portal"
  | "change-plan"
  | "cancel"
  | "resume";

export function BillingActionButton({
  action,
  plan,
  children,
  variant = "primary",
  disabled = false,
}: {
  action: BillingAction;
  plan?: "PRO" | "CREATOR";
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function run() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/billing/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:
          action === "checkout" || action === "change-plan"
            ? JSON.stringify({ plan })
            : undefined,
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "処理できませんでした。");
        return;
      }
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    } catch {
      setError("決済サービスへ接続できませんでした。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className={
          variant === "primary"
            ? "button-primary w-full px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm"
            : "button-secondary w-full px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm"
        }
        onClick={() => {
          if (requiresConfirmation(action)) setConfirmOpen(true);
          else void run();
        }}
        disabled={disabled || loading}
      >
        {loading ? <LoaderCircle className="animate-spin" size={17} /> : null}
        {loading ? "接続中..." : children}
      </button>
      {error ? (
        <p className="mt-2 text-center text-xs leading-5 text-rose-600">{error}</p>
      ) : null}
      {confirmOpen ? (
        <div
          className="theme-overlay fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) {
              setConfirmOpen(false);
            }
          }}
        >
          <div
            className="card w-full max-w-md p-6 text-center shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--primary)]">
              <AlertCircle size={22} />
            </div>
            <h3 className="mt-4 text-lg font-bold">
              {confirmationTitle(action, plan)}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {confirmationDescription(action)}
            </p>
            <ConfirmationDetails action={action} plan={plan} />
            {error ? (
              <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </p>
            ) : null}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="button-secondary justify-center"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
              >
                キャンセル
              </button>
              <button
                type="button"
                className={
                  action === "cancel"
                    ? "inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                    : "button-primary justify-center"
                }
                onClick={() => void run()}
                disabled={loading}
              >
                {loading ? <LoaderCircle className="animate-spin" size={17} /> : null}
                {loading ? "処理中..." : confirmationButtonLabel(action)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function requiresConfirmation(action: BillingAction) {
  return (
    action === "checkout" ||
    action === "change-plan" ||
    action === "cancel" ||
    action === "resume"
  );
}

function confirmationTitle(
  action: BillingAction,
  plan: "PRO" | "CREATOR" | undefined,
) {
  if (action === "checkout") {
    return `${plan === "PRO" ? "Pro" : "Creator"}プランを始めますか？`;
  }
  if (action === "change-plan") {
    return `${plan === "PRO" ? "Pro" : "Creator"}プランへ変更しますか？`;
  }
  if (action === "cancel") return "Freeプランへ変更しますか？";
  return "解約予約を取り消しますか？";
}

function confirmationDescription(action: BillingAction) {
  if (action === "checkout") {
    return "以下の内容を確認後、Stripeの決済画面へ進みます。決済画面でも金額と支払方法をご確認ください。";
  }
  if (action === "change-plan") {
    return "以下の内容でプランを変更します。変更後の請求や差額調整はStripe上の表示をご確認ください。";
  }
  if (action === "cancel") {
    return "現在の有料プランを解約予約します。すぐに利用停止にはなりません。";
  }
  return "現在の有料プランを継続し、次回更新日に通常どおり更新します。";
}

function ConfirmationDetails({
  action,
  plan,
}: {
  action: BillingAction;
  plan: "PRO" | "CREATOR" | undefined;
}) {
  const details = confirmationDetails(action, plan);
  if (!details.length) return null;

  return (
    <dl className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-left text-xs leading-5 text-slate-600">
      {details.map((detail) => (
        <div
          key={detail.label}
          className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-3"
        >
          <dt className="font-bold text-slate-500">{detail.label}</dt>
          <dd className="font-medium text-slate-700">{detail.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function confirmationDetails(
  action: BillingAction,
  plan: "PRO" | "CREATOR" | undefined,
) {
  if (action === "checkout" || action === "change-plan") {
    const planName = plan === "PRO" ? "Pro" : "Creator";
    const price = plan === "PRO" ? "月額500円（税込）" : "月額980円（税込）";
    const limit =
      plan === "PRO"
        ? "保存枠200件、AI分析 月100件"
        : "保存枠500件、AI分析 月200件";
    return [
      { label: "プラン", value: `${planName}プラン` },
      { label: "料金", value: price },
      { label: "内容", value: limit },
      { label: "支払方法", value: "Stripeの決済画面で選択・確認します。" },
      { label: "更新", value: "月単位で自動更新されます。" },
      {
        label: "解約",
        value:
          "いつでも解約予約できます。解約後も契約期間の終了日までは有料プランを利用できます。",
      },
      {
        label: "返金",
        value:
          "利用者都合による日割り返金は原則として行いません。",
      },
    ];
  }
  if (action === "cancel") {
    return [
      {
        label: "利用期限",
        value: "契約期間の終了日まで有料プランを利用できます。",
      },
      { label: "変更後", value: "契約期間終了後、Freeプランへ切り替わります。" },
      { label: "取消", value: "契約期間中であれば解約予約を取り消せます。" },
    ];
  }
  if (action === "resume") {
    return [
      {
        label: "更新",
        value: "次回更新日に、現在の有料プランが通常どおり更新されます。",
      },
    ];
  }
  return [];
}

function confirmationButtonLabel(action: BillingAction) {
  if (action === "checkout") return "決済画面へ進む";
  if (action === "change-plan") return "プランを変更";
  if (action === "cancel") return "解約を予約";
  return "継続する";
}
