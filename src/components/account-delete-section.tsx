import Link from "next/link";
import { ShieldQuestion } from "lucide-react";

// Self-service account deletion was removed to prevent accidental deletion.
// Deletion requests now go through the contact form and are handled manually.
export function AccountDeleteSection() {
  return (
    <section className="mt-8 rounded-[var(--radius-card)] border border-slate-200 bg-white/80 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold tracking-[0.18em] text-slate-400 uppercase">
            Account
          </p>
          <h2 className="mt-2 text-xl font-bold">アカウント削除について</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            <span className="block">
              アカウントの削除をご希望の場合は、お問い合わせページよりご連絡ください。
            </span>
            <span className="block">
              削除すると、保存投稿・コレクション・タグ・AI分析結果・設定情報がすべて削除され、元に戻せません。
            </span>
            <span className="block">
              有料プランをご利用中の場合は、先に解約手続きをお願いいたします。
            </span>
          </p>
        </div>
        <Link
          href="/contact"
          className="button-secondary inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm sm:mt-9 sm:w-40 sm:shrink-0 sm:text-xs lg:w-44"
        >
          <ShieldQuestion size={16} />
          お問い合わせ
        </Link>
      </div>
    </section>
  );
}
