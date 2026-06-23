import { NextResponse } from "next/server";
import { syncStripeSubscription } from "@/lib/billing";
import { apiError } from "@/lib/http";
import { getStripe, StripeConfigurationError } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/user";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user.stripeSubscriptionId || user.plan === "FREE") {
      return NextResponse.json(
        { error: "解約予約できる有料契約がありません。" },
        { status: 400 },
      );
    }

    const subscription = await getStripe().subscriptions.update(
      user.stripeSubscriptionId,
      { cancel_at_period_end: true },
    );
    await syncStripeSubscription(subscription, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return apiError(error);
  }
}
