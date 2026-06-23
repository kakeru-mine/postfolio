import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import {
  appUrl,
  getStripe,
  StripeConfigurationError,
} from "@/lib/stripe";
import { getCurrentUser } from "@/lib/user";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "管理する有料契約がありません。" },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl(request.nextUrl.origin)}/settings`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return apiError(error);
  }
}
