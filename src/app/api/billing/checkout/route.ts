import { SubscriptionPlan } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/http";
import { priceIdForPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import {
  appUrl,
  getStripe,
  StripeConfigurationError,
} from "@/lib/stripe";
import { getCurrentUser } from "@/lib/user";

const checkoutSchema = z.object({
  plan: z.enum(["PRO", "CREATOR"]),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { plan } = checkoutSchema.parse(await request.json());
    if (user.stripeSubscriptionId && user.plan !== SubscriptionPlan.FREE) {
      return NextResponse.json(
        { error: "現在のプラン変更は「支払いを管理」から行ってください。" },
        { status: 409 },
      );
    }
    const targetPlan = SubscriptionPlan[plan];
    const priceId = priceIdForPlan(targetPlan);
    if (!priceId) {
      return NextResponse.json(
        { error: `${plan}プランのStripe Price IDが設定されていません。` },
        { status: 503 },
      );
    }

    const stripe = getStripe();
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const baseUrl = appUrl(request.nextUrl.origin);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${baseUrl}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
      metadata: { userId: user.id, plan },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "決済ページを作成できませんでした。" },
        { status: 502 },
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return apiError(error);
  }
}
