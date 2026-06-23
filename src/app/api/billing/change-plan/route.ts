import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { syncStripeSubscription } from "@/lib/billing";
import { apiError } from "@/lib/http";
import { priceIdForPlan } from "@/lib/plans";
import { getStripe, StripeConfigurationError } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/user";

const schema = z.object({ plan: z.enum(["PRO", "CREATOR"]) });

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { plan } = schema.parse(await request.json());
    if (!user.stripeSubscriptionId || user.plan === "FREE") {
      return NextResponse.json(
        { error: "変更できる有料契約がありません。" },
        { status: 400 },
      );
    }
    if (user.plan === plan && !user.subscriptionCancelAtPeriodEnd) {
      return NextResponse.json(
        { error: "すでにこのプランを利用しています。" },
        { status: 409 },
      );
    }

    const priceId = priceIdForPlan(plan);
    if (!priceId) {
      return NextResponse.json(
        { error: `${plan}プランのStripe Price IDが設定されていません。` },
        { status: 503 },
      );
    }

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );
    const item = subscription.items.data[0];
    if (!item) {
      return NextResponse.json(
        { error: "契約中の料金情報を取得できませんでした。" },
        { status: 409 },
      );
    }

    const updated = await stripe.subscriptions.update(subscription.id, {
      items: [{ id: item.id, price: priceId, quantity: 1 }],
      proration_behavior: "create_prorations",
      cancel_at_period_end: false,
      metadata: { ...subscription.metadata, userId: user.id, plan },
    });
    await syncStripeSubscription(updated, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return apiError(error);
  }
}
