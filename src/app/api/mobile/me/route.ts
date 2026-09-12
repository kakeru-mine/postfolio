import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { apiError } from "@/lib/http";

// Returns the signed-in user plus their entitlement (subscription state). The
// mobile app calls this right after login and on resume to decide which paid
// features to unlock. `plan` is the single source of truth kept in sync with
// Stripe, so `plan !== FREE` already means "has paid access".
export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        onboardingSeenAt: user.onboardingSeenAt
          ? user.onboardingSeenAt.toISOString()
          : null,
      },
      entitlement: {
        plan: user.plan,
        active: user.plan !== "FREE",
        status: user.subscriptionStatus,
        periodEnd: user.subscriptionPeriodEnd
          ? user.subscriptionPeriodEnd.toISOString()
          : null,
        cancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd ?? false,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
