import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { syncStripeSubscription } from "@/lib/billing";
import { apiError } from "@/lib/http";
import { getStripe, StripeConfigurationError } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/user";

const schema = z.object({ sessionId: z.string().startsWith("cs_") });

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { sessionId } = schema.parse(await request.json());
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionUserId =
      session.metadata?.userId || session.client_reference_id;

    if (
      sessionUserId !== user.id ||
      typeof session.subscription !== "string"
    ) {
      return NextResponse.json(
        { error: "この決済情報を同期できません。" },
        { status: 403 },
      );
    }

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription,
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
