import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { StandaloneLanguageControls } from "@/components/standalone-language-controls";

export function AuthPage({
  mode,
  error,
}: {
  mode: "login" | "register";
  error?: string;
}) {
  const registering = mode === "register";

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/welcome" className="mx-auto block w-fit">
          <Image
            src="/postfolio-logo.png"
            alt="Postfolio"
            width={240}
            height={84}
            className="h-14 w-auto"
            priority
          />
        </Link>
        <section className="card mt-7 p-6 sm:p-8">
          <h1 className="text-center text-2xl font-bold">
            {registering ? "会員登録" : "ログイン"}
          </h1>
          {error ? (
            <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          <AuthForm mode={mode} />
        </section>
      </div>
      <StandaloneLanguageControls />
    </main>
  );
}
