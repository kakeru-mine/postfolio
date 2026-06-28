import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/http";
import { getPlanDefinition, priceIdForPlan } from "@/lib/plans";
import { getStripe, StripeConfigurationError } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/user";

const schema = z.object({ plan: z.enum(["PRO", "CREATOR"]) });

// Returns the immediate prorated charge for switching plans so the amount can
// be confirmed in-app before the change is made. Downgrades take effect at
// period end with no immediate charge, so they report isUpgrade: false.
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

    const isUpgrade =
      getPlanDefinition(plan).priceYen > getPlanDefinition(user.plan).priceYen;
    if (!isUpgrade || user.plan === plan) {
      return NextResponse.json({ isUpgrade: false });
    }

    const priceId = priceIdForPlan(plan);
    if (!priceId || !user.stripeCustomerId) {
      return NextResponse.json({ isUpgrade: true });
    }

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );
    const item = subscription.items.data[0];
    if (!item) {
      return NextResponse.json({ isUpgrade: true });
    }

    const preview = await stripe.invoices.createPreview({
      customer: user.stripeCustomerId,
      subscription: subscription.id,
      subscription_details: {
        items: [{ id: item.id, price: priceId }],
        proration_behavior: "create_prorations",
      },
    });
    const amount = preview.lines.data
      .filter((line) => {
        const parent = line.parent;
        return Boolean(
          parent?.subscription_item_details?.proration ||
            parent?.invoice_item_details?.proration,
        );
      })
      .reduce((sum, line) => sum + line.amount, 0);

    return NextResponse.json({
      isUpgrade: true,
      amount: Math.max(0, amount),
    });
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return apiError(error);
  }
}
