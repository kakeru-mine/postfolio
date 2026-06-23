import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="card max-w-md p-8 text-center">
        <p className="text-sm font-bold text-[var(--primary)]">404</p>
        <h1 className="mt-2 text-2xl font-bold">ページが見つかりません</h1>
        <p className="mt-3 text-sm text-slate-500">
          削除されたか、URLが正しくない可能性があります。
        </p>
        <Link href="/" className="button-primary mt-6">
          保存一覧へ戻る
        </Link>
      </div>
    </div>
  );
}
