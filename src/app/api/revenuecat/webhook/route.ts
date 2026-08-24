import { SubscriptionPlan } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { planFromEntitlementIds } from "@/lib/revenuecat";

// RevenueCat forwards Google Play (and, later, App Store) subscription lifecycle
// events here. We keep `user.plan` in our DB as the single source of truth — the
// same field Stripe writes — so the app's entitlement check (`/api/mobile/me`)
// is unchanged. RevenueCat's `app_user_id` is set to our `user.id` when the app
// calls Purchases.configure/logIn, so we can look the user up directly.
type RevenueCatEvent = {
  event?: {
    type?: string;
    app_user_id?: string;
    entitlement_ids?: string[] | null;
    expiration_at_ms?: number | null;
    product_id?: string | null;
  };
};

// The user currently has (or just regained) access.
const ACTIVE_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
]);

// Access has actually ended. CANCELLATION only turns off auto-renew — the user
// keeps access until EXPIRATION — so we intentionally do NOT downgrade on it.
const ENDED_EVENTS = new Set(["EXPIRATION"]);

export async function POST(request: NextRequest) {
  const expectedAuth = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (!expectedAuth) {
    return NextResponse.json(
      { error: "REVENUECAT_WEBHOOK_AUTHが設定されていません。" },
      { status: 503 },
    );
  }
  // RevenueCat sends the value you configure in its dashboard as the
  // Authorization header. This is the webhook's shared secret.
  if (request.headers.get("authorization") !== expectedAuth) {
    return NextResponse.json({ error: "認証に失敗しました。" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as RevenueCatEvent;
    const event = body.event;
    const userId = event?.app_user_id;
    const type = event?.type;

    // Ignore events without an app_user_id we can resolve (e.g. anonymous ids
    // from before the app called logIn).
    if (!userId || !type) {
      return NextResponse.json({ received: true });
    }

    if (ACTIVE_EVENTS.has(type)) {
      const plan = planFromEntitlementIds(event?.entitlement_ids);
      if (plan) {
        await prisma.user.updateMany({
          where: { id: userId },
          data: {
            plan,
            subscriptionStatus: "play_active",
            subscriptionPeriodEnd: event?.expiration_at_ms
              ? new Date(event.expiration_at_ms)
              : null,
            subscriptionCancelAtPeriodEnd: false,
          },
        });
      }
    } else if (ENDED_EVENTS.has(type)) {
      // Only downgrade users who are NOT on a Stripe subscription, so a Play
      // expiration can never clobber an active web (Stripe) subscription.
      await prisma.user.updateMany({
        where: { id: userId, stripeSubscriptionId: null },
        data: {
          plan: SubscriptionPlan.FREE,
          subscriptionStatus: "play_expired",
          subscriptionPeriodEnd: null,
          subscriptionCancelAtPeriodEnd: false,
        },
      });
    }
    // Other event types (CANCELLATION, BILLING_ISSUE, etc.) are acknowledged
    // without changing the plan.

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("RevenueCat webhook error", error);
    return NextResponse.json(
      { error: "Webhookを処理できませんでした。" },
      { status: 400 },
    );
  }
}
