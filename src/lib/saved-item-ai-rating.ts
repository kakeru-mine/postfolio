import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AiRating = "S" | "A" | "B" | "C" | "D" | "E";

type AiRatingRow = {
  aiRating: string | null;
};

export async function getSavedItemAiRating(itemId: string, userId: string) {
  const [item] = await prisma.$queryRaw<AiRatingRow[]>(Prisma.sql`
    SELECT "aiRating"
    FROM "SavedItem"
    WHERE "id" = ${itemId} AND "userId" = ${userId}
    LIMIT 1
  `);

  return isAiRating(item?.aiRating) ? item.aiRating : null;
}

export async function getSavedItemAiRatings(
  itemIds: string[],
  userId: string,
) {
  if (!itemIds.length) return new Map<string, AiRating>();

  const rows = await prisma.$queryRaw<Array<AiRatingRow & { id: string }>>(
    Prisma.sql`
      SELECT "id", "aiRating"
      FROM "SavedItem"
      WHERE "userId" = ${userId}
        AND "id" IN (${Prisma.join(itemIds)})
    `,
  );

  return new Map(
    rows.flatMap((row) =>
      isAiRating(row.aiRating) ? [[row.id, row.aiRating]] : [],
    ),
  );
}

export async function updateSavedItemAiRating(
  itemId: string,
  rating: AiRating,
) {
  await prisma.$executeRaw(Prisma.sql`
    UPDATE "SavedItem"
    SET "aiRating" = ${rating}, "updatedAt" = NOW()
    WHERE "id" = ${itemId}
  `);
}

function isAiRating(value: string | null | undefined): value is AiRating {
  return Boolean(value && ["S", "A", "B", "C", "D", "E"].includes(value));
}
