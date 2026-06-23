import { SiteHeader } from "@/components/landing-v0/site-header";
import { Hero } from "@/components/landing-v0/sections/hero";
import { Problem } from "@/components/landing-v0/sections/problem";
import { Solution } from "@/components/landing-v0/sections/solution";
import { Features } from "@/components/landing-v0/sections/features";
import { Reuse } from "@/components/landing-v0/sections/reuse";
import { UseCase } from "@/components/landing-v0/sections/use-case";
import { Comparison } from "@/components/landing-v0/sections/comparison";
import { ProductMock } from "@/components/landing-v0/sections/product-mock";
import { Pricing } from "@/components/landing-v0/sections/pricing";
import { Faq } from "@/components/landing-v0/sections/faq";
import { FinalCta } from "@/components/landing-v0/sections/final-cta";
import { SiteFooter } from "@/components/landing-v0/site-footer";
import { LpRevealController } from "@/components/landing-v0/lp-reveal-controller";

export function LandingV0Page({ isLoggedIn }: { isLoggedIn: boolean }) {
  const primaryHref = isLoggedIn ? "/" : "/register";
  const pricingHref = isLoggedIn ? "/pricing" : "/register";

  return (
    <div className="min-h-screen bg-background">
      <LpRevealController />
      <SiteHeader primaryHref={primaryHref} />
      <main>
        <Hero primaryHref={primaryHref} />
        <Problem />
        <Solution />
        <Features />
        <Reuse />
        <UseCase />
        <Comparison />
        <ProductMock />
        <Pricing ctaHref={pricingHref} />
        <Faq />
        <FinalCta primaryHref={primaryHref} />
      </main>
      <SiteFooter />
    </div>
  );
}
