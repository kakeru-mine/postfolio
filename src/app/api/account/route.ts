import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { requireApiUser } from "@/lib/auth";
import { deleteStoredImage, isOwnStorageUrl } from "@/lib/image-storage";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// Permanently deletes the signed-in user's account and all their data. Used by
// the in-app "delete account" flow (web settings and the mobile app), so users
// can erase their data themselves (Play Data safety: in-app deletion).
//
// Deleting the User row cascades to sessions, tokens, saved items, collections,
// memberships, AI usage and announcement reads (see schema onDelete: Cascade).
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireApiUser(request);

    // Gather re-hosted images to remove from storage after the DB rows go.
    // (The avatar is stored inline as a data URI, so it leaves with the row.)
    const items = await prisma.savedItem.findMany({
      where: { userId: user.id },
      select: { thumbnailUrl: true, mediaUrls: true },
    });
    const imageUrls = new Set<string>();
    for (const item of items) {
      if (item.thumbnailUrl) imageUrls.add(item.thumbnailUrl);
      for (const url of item.mediaUrls) imageUrls.add(url);
    }

    // Best-effort: stop any active Stripe (web) subscription so deleting the
    // account doesn't leave an orphaned subscription billing the customer.
    // Play (RevenueCat) subscriptions are managed by the user in Google Play.
    if (user.stripeSubscriptionId) {
      try {
        await getStripe().subscriptions.cancel(user.stripeSubscriptionId);
      } catch {
        // Ignore: the subscription may already be cancelled or Stripe may be
        // unavailable; account deletion should still proceed.
      }
    }

    await prisma.user.delete({ where: { id: user.id } });

    // Clean up orphaned storage images after the rows are gone (best-effort).
    for (const url of imageUrls) {
      if (!isOwnStorageUrl(url)) continue;
      try {
        await deleteStoredImage(url);
      } catch {
        // Ignore individual failures; the account is already deleted.
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
