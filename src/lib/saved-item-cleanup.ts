import { deleteStoredImage, isOwnStorageUrl } from "@/lib/image-storage";
import { prisma } from "@/lib/prisma";

type ImageCarrier = { thumbnailUrl: string | null; mediaUrls: string[] };

/**
 * Removes re-hosted images for deleted saved items from Supabase Storage, but
 * only when no remaining item still references the same object (the same post
 * saved by another user dedupes onto the same path). Best-effort: failures are
 * swallowed so a leftover object never blocks a delete.
 */
export async function cleanupOrphanedImages(items: ImageCarrier[]) {
  const candidates = new Set<string>();
  for (const item of items) {
    if (item.thumbnailUrl) candidates.add(item.thumbnailUrl);
    for (const url of item.mediaUrls) candidates.add(url);
  }

  for (const url of candidates) {
    if (!isOwnStorageUrl(url)) continue;
    try {
      const stillUsed = await prisma.savedItem.count({
        where: { OR: [{ thumbnailUrl: url }, { mediaUrls: { has: url } }] },
      });
      if (stillUsed === 0) await deleteStoredImage(url);
    } catch {
      // Ignore cleanup failures; the delete itself has already succeeded.
    }
  }
}
