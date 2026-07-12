import type { Metadata } from "next";
import { LandingV0Page } from "@/components/landing-v0/landing-page";
import { getOptionalCurrentUser } from "@/lib/user";

// Bump when the og.png design changes so crawlers (esp. X, which caches images
// by URL) fetch the new artwork instead of a stale cached copy.
const OG_VERSION = "14";
const OG_IMAGE = `/og.png?v=${OG_VERSION}`;

export function generateMetadata(): Metadata {
  return {
    // The bare domain ("/") renders the same LP for signed-out visitors and is
    // the canonical homepage; point /welcome there to consolidate ranking.
    alternates: { canonical: "/" },
    openGraph: {
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Postfolio" }],
    },
    twitter: { card: "summary_large_image", images: [OG_IMAGE] },
  };
}

export default async function WelcomePage() {
  const user = await getOptionalCurrentUser();

  return <LandingV0Page isLoggedIn={Boolean(user)} />;
}
