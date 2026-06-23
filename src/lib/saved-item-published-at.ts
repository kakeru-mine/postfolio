import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PublishedAtRow = {
  publishedAt: Date | null;
};

export async function getSavedItemPublishedAt(
  itemId: string,
  userId: string,
) {
  const [item] = await prisma.$queryRaw<PublishedAtRow[]>(Prisma.sql`
    SELECT "publishedAt"
    FROM "SavedItem"
    WHERE "id" = ${itemId} AND "userId" = ${userId}
    LIMIT 1
  `);

  return item?.publishedAt ?? null;
}

export async function updateSavedItemPublishedAt(
  itemId: string,
  publishedAt: Date | undefined,
) {
  if (!publishedAt) return;

  await prisma.$executeRaw(Prisma.sql`
    UPDATE "SavedItem"
    SET "publishedAt" = ${publishedAt}, "updatedAt" = NOW()
    WHERE "id" = ${itemId}
  `);
}
