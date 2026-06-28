import { NextResponse } from "next/server";
import { releaseScheduleIfAny, syncStripeSubscription } from "@/lib/billing";
import { apiError } from "@/lib/http";
import { getStripe, StripeConfigurationError } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/user";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (
      !user.stripeSubscriptionId ||
      (!user.subscriptionCancelAtPeriodEnd && !user.scheduledPlan)
    ) {
      return NextResponse.json(
        { error: "取り消せる予約がありません。" },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const current = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );
    // Cancel both kinds of pending reservation (downgrade schedule + cancel).
    await releaseScheduleIfAny(stripe, current);
    const subscription = await stripe.subscriptions.update(
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
