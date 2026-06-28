import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { releaseScheduleIfAny, syncStripeSubscription } from "@/lib/billing";
import { apiError } from "@/lib/http";
import { getPlanDefinition, priceIdForPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
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
    const hasReservation =
      user.subscriptionCancelAtPeriodEnd || Boolean(user.scheduledPlan);
    if (user.plan === plan && !hasReservation) {
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

    // Every change is evaluated against the current plan, so first clear any
    // pending downgrade reservation (subscription schedule).
    await releaseScheduleIfAny(stripe, subscription);

    // Re-selecting the current plan just cancels the pending reservation.
    if (user.plan === plan) {
      const cleared = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });
      await syncStripeSubscription(cleared, user.id);
      return NextResponse.json({
        scheduled: true,
        message: "プラン変更の予約を取り消しました。現在のプランを継続します。",
      });
    }

    const isUpgrade =
      getPlanDefinition(plan).priceYen > getPlanDefinition(user.plan).priceYen;

    if (isUpgrade) {
      // Upgrade: charge the prorated difference to the saved card immediately
      // and only switch once that charge is paid. The amount is shown in-app
      // beforehand via the preview endpoint, so no page redirect is needed.
      const updated = await stripe.subscriptions.update(subscription.id, {
        items: [{ id: item.id, price: priceId, quantity: 1 }],
        proration_behavior: "always_invoice",
        payment_behavior: "error_if_incomplete",
        cancel_at_period_end: false,
        metadata: { ...subscription.metadata, userId: user.id, plan },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { scheduledPlan: null, subscriptionCancelAtPeriodEnd: false },
      });
      await syncStripeSubscription(updated, user.id);
      return NextResponse.json({
        message: `${getPlanDefinition(plan).name}プランに切り替えました。`,
      });
    }

    // Downgrade: schedule the change for the end of the current period so the
    // current plan stays usable until renewal. Don't change the plan now.
    if (subscription.cancel_at_period_end) {
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });
    }
    const schedule = await stripe.subscriptionSchedules.create({
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
    await prisma.user.update({
      where: { id: user.id },
      data: { scheduledPlan: plan, subscriptionCancelAtPeriodEnd: false },
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
    if (isPaymentError(error)) {
      return NextResponse.json(
        {
          error:
            "差額のお支払いを完了できませんでした。お支払い方法をご確認のうえ、再度お試しください。",
        },
        { status: 402 },
      );
    }
    return apiError(error);
  }
}

// A failed immediate proration charge surfaces as a card error / HTTP 402.
function isPaymentError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const e = error as { type?: string; statusCode?: number };
  return e.type === "StripeCardError" || e.statusCode === 402;
}
