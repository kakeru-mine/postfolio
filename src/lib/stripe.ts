import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new StripeConfigurationError(
      "Stripeが未設定です。STRIPE_SECRET_KEYを設定してください。",
    );
  }

  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

export function appUrl(requestOrigin?: string) {
  return (
    requestOrigin?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}

// For links sent in emails we must use the stable public URL, not the
// per-request origin (which can be an ephemeral, access-protected deployment
// URL). Prefer NEXT_PUBLIC_APP_URL so verification/reset links always point at
// the canonical domain.
export function canonicalAppUrl(requestOrigin?: string) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    requestOrigin?.replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}

export class StripeConfigurationError extends Error {}
