import { SubscriptionPlan } from "@prisma/client";
import type Stripe from "stripe";
import { planFromPriceId } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

const PAID_ACCESS_STATUSES = new Set(["active", "trialing", "past_due"]);

/**
 * Detaches the subscription schedule (a pending downgrade reservation) if one
 * exists, leaving the subscription on its current plan. Best-effort.
 */
export async function releaseScheduleIfAny(
  stripe: Stripe,
  subscription: Stripe.Subscription,
) {
  if (!subscription.schedule) return;
  const scheduleId =
    typeof subscription.schedule === "string"
      ? subscription.schedule
      : subscription.schedule.id;
  await stripe.subscriptionSchedules.release(scheduleId).catch(() => {});
}

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
      // Once the subscription is no longer governed by a schedule, any pending
      // downgrade reservation has been applied or released.
      ...(subscription.schedule ? {} : { scheduledPlan: null }),
    },
  });
}
