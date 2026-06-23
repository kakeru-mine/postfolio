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
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    requestOrigin ||
    "http://localhost:3000"
  );
}

export class StripeConfigurationError extends Error {}
