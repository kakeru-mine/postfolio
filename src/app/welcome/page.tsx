import type { Metadata } from "next";
import { LandingV0Page } from "@/components/landing-v0/landing-page";
import { getOptionalCurrentUser } from "@/lib/user";

const OG_VARIANTS = 6;

// Deterministic pick so the same share URL always resolves to the same card
// (crawlers re-fetch the page; a stable og:image is required for X to build the
// card). Different referral sources get different cards, giving some variety.
function pickOgImage(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return `/og-${(hash % OG_VARIANTS) + 1}.png`;
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const source =
    typeof params.utm_source === "string" ? params.utm_source : "default";
  const ogImage = pickOgImage(source);
  return {
    openGraph: {
      images: [{ url: ogImage, width: 1200, height: 630, alt: "Postfolio" }],
    },
    twitter: { card: "summary_large_image", images: [ogImage] },
  };
}

export default async function WelcomePage() {
  const user = await getOptionalCurrentUser();

  return <LandingV0Page isLoggedIn={Boolean(user)} />;
}
