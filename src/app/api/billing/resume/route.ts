import { NextResponse } from "next/server";
import { syncStripeSubscription } from "@/lib/billing";
import { apiError } from "@/lib/http";
import { getStripe, StripeConfigurationError } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/user";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user.stripeSubscriptionId || !user.subscriptionCancelAtPeriodEnd) {
      return NextResponse.json(
        { error: "取り消せる解約予約がありません。" },
        { status: 400 },
      );
    }

    const subscription = await getStripe().subscriptions.update(
      user.stripeSubscriptionId,
      { cancel_at_period_end: false },
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
