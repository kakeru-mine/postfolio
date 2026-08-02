import { redirect } from "next/navigation";
import { AuthPage } from "@/components/auth-page";
import { getOptionalCurrentUser } from "@/lib/user";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getOptionalCurrentUser()) redirect("/");
  const { error } = await searchParams;
  return (
    <AuthPage
      mode="login"
      error={
        error === "google"
          ? "Googleログインに失敗しました。もう一度お試しください。"
          : undefined
      }
    />
  );
}
