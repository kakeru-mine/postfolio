import { redirect } from "next/navigation";
import { AuthPage } from "@/components/auth-page";
import { getOptionalCurrentUser } from "@/lib/user";

export default async function RegisterPage() {
  if (await getOptionalCurrentUser()) redirect("/");
  return <AuthPage mode="register" />;
}
