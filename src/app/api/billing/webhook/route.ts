import { SubscriptionPlan } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { syncStripeSubscription } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import {
  getStripe,
  StripeConfigurationError,
} from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRETが設定されていません。" },
      { status: 503 },
    );
  }

  try {
    const stripe = getStripe();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Stripe署名がありません。" },
        { status: 400 },
      );
    }

    const rawBody = await request.text();
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId || session.client_reference_id;
        if (userId && typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription,
          );
          await syncStripeSubscription(subscription, userId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.paused":
      case "customer.subscription.resumed": {
        await syncStripeSubscription(event.data.object);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: SubscriptionPlan.FREE,
            stripeSubscriptionId: null,
            stripePriceId: null,
            subscriptionStatus: subscription.status,
            subscriptionPeriodEnd: null,
            subscriptionCancelAtPeriodEnd: false,
            scheduledPlan: null,
          },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Stripe webhook error", error);
    return NextResponse.json(
      { error: "Webhookを処理できませんでした。" },
      { status: 400 },
    );
  }
}
