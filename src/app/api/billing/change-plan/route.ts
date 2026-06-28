import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { syncStripeSubscription } from "@/lib/billing";
import { apiError } from "@/lib/http";
import { getPlanDefinition, priceIdForPlan } from "@/lib/plans";
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

    const isUpgrade =
      getPlanDefinition(plan).priceYen > getPlanDefinition(user.plan).priceYen;

    if (isUpgrade) {
      // Upgrade: create a proration invoice for the difference and let the
      // customer pay it on Stripe's hosted invoice page. The plan switch is
      // held as a pending update and only applied once the invoice is paid
      // (the resulting subscription.updated webhook syncs the plan).
      const updated = await stripe.subscriptions.update(subscription.id, {
        items: [{ id: item.id, price: priceId, quantity: 1 }],
        proration_behavior: "always_invoice",
        payment_behavior: "default_incomplete",
        cancel_at_period_end: false,
        metadata: { ...subscription.metadata, userId: user.id, plan },
        expand: ["latest_invoice"],
      });

      const invoice = updated.latest_invoice;
      if (invoice && typeof invoice !== "string") {
        if (invoice.status === "paid") {
          await syncStripeSubscription(
            await stripe.subscriptions.retrieve(subscription.id),
            user.id,
          );
          return NextResponse.json({ success: true });
        }
        if (invoice.hosted_invoice_url) {
          return NextResponse.json({ url: invoice.hosted_invoice_url });
        }
      }
      return NextResponse.json(
        {
          error:
            "差額の請求書を作成できませんでした。時間をおいて再度お試しください。",
        },
        { status: 502 },
      );
    }

    // Downgrade: schedule the change for the end of the current period so the
    // current plan stays usable until renewal. Don't change the plan now.
    const schedule = subscription.schedule
      ? await stripe.subscriptionSchedules.retrieve(
          typeof subscription.schedule === "string"
            ? subscription.schedule
            : subscription.schedule.id,
        )
      : await stripe.subscriptionSchedules.create({
          from_subscription: subscription.id,
        });
    const currentPhase = schedule.phases[0];

    await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: "release",
      proration_behavior: "none",
      phases: [
        {
          items: [{ price: item.price.id, quantity: 1 }],
          start_date: currentPhase.start_date,
          end_date: currentPhase.end_date,
        },
        {
          items: [{ price: priceId, quantity: 1 }],
        },
      ],
      metadata: { userId: user.id, plan },
    });

    const switchAt = item.current_period_end
      ? new Date(item.current_period_end * 1000)
      : null;
    const dateLabel = switchAt
      ? `${switchAt.getFullYear()}年${switchAt.getMonth() + 1}月${switchAt.getDate()}日`
      : "次回更新日";
    return NextResponse.json({
      scheduled: true,
      message: `${dateLabel}に${getPlanDefinition(plan).name}プランへ切り替わります。それまでは現在のプランをご利用いただけます。`,
    });
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return apiError(error);
  }
}
