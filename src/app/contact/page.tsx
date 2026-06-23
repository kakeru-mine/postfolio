import { BackToPreviousButton } from "@/components/back-to-previous-button";
import { ContactForm } from "@/components/contact-form";
import { StandaloneLanguageControls } from "@/components/standalone-language-controls";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex items-center justify-between gap-4">
        <BackToPreviousButton />
        <StandaloneLanguageControls />
      </div>

      <div className="mt-8">
        <p className="text-sm font-bold tracking-[0.28em] text-[var(--primary)] uppercase">
          Contact
        </p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">お問い合わせ</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Postfolioに関するご質問、不具合報告、ご要望などはこちらからご連絡ください。
        </p>
      </div>

      <ContactForm />

      <section className="card mt-5 p-6 sm:p-8">
        <h2 className="font-bold">
          ●ご連絡時には、こちらの情報を載せて頂けると幸いです
        </h2>
        <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-600">
          <li>発生した画面や操作内容</li>
          <li>保存しようとしたSNSの種類</li>
          <li>表示されたエラーメッセージ</li>
          <li>可能であればスクリーンショット</li>
        </ul>
      </section>
    </main>
  );
}
