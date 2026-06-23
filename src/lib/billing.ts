import { SubscriptionPlan } from "@prisma/client";
import type Stripe from "stripe";
import { planFromPriceId } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

const PAID_ACCESS_STATUSES = new Set(["active", "trialing", "past_due"]);

export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  explicitUserId?: string,
) {
  const priceId = subscription.items.data[0]?.price.id;
  const plan = PAID_ACCESS_STATUSES.has(subscription.status)
    ? planFromPriceId(priceId)
    : SubscriptionPlan.FREE;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const periodEnd = subscription.items.data[0]?.current_period_end;
  const userId = explicitUserId || subscription.metadata.userId;

  await prisma.user.updateMany({
    where: userId
      ? { id: userId }
      : {
          OR: [
            { stripeSubscriptionId: subscription.id },
            { stripeCustomerId: customerId },
          ],
        },
    data: {
      plan,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId || null,
      subscriptionStatus: subscription.status,
      subscriptionPeriodEnd: periodEnd
        ? new Date(periodEnd * 1000)
        : null,
      subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}
