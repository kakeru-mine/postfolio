import { SubscriptionPlan } from "@prisma/client";

// Maps a RevenueCat entitlement identifier to our plan. Entitlement ids are
// defined in the RevenueCat dashboard (e.g. "pro" / "creator"); override the
// defaults via env if you name them differently. Creator outranks Pro when both
// somehow appear.
export function planFromEntitlementIds(
  entitlementIds: string[] | undefined | null,
): SubscriptionPlan | null {
  const ids = (entitlementIds ?? []).map((value) => value.toLowerCase());
  const creator = (
    process.env.REVENUECAT_CREATOR_ENTITLEMENT || "creator"
  ).toLowerCase();
  const pro = (process.env.REVENUECAT_PRO_ENTITLEMENT || "pro").toLowerCase();

  if (ids.includes(creator)) return SubscriptionPlan.CREATOR;
  if (ids.includes(pro)) return SubscriptionPlan.PRO;
  return null;
}
