import { LandingV0Page } from "@/components/landing-v0/landing-page";
import { getOptionalCurrentUser } from "@/lib/user";

export default async function WelcomePage() {
  const user = await getOptionalCurrentUser();

  return <LandingV0Page isLoggedIn={Boolean(user)} />;
}
