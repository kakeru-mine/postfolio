-- Move Collection <-> SavedItem from one-to-many (SavedItem.collectionId)
-- to many-to-many via the CollectionMembership join table.

-- 1. Create the join table.
CREATE TABLE "CollectionMembership" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "savedItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CollectionMembership_collectionId_savedItemId_key" ON "CollectionMembership"("collectionId", "savedItemId");
CREATE INDEX "CollectionMembership_savedItemId_idx" ON "CollectionMembership"("savedItemId");
CREATE INDEX "CollectionMembership_collectionId_idx" ON "CollectionMembership"("collectionId");

ALTER TABLE "CollectionMembership" ADD CONSTRAINT "CollectionMembership_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionMembership" ADD CONSTRAINT "CollectionMembership_savedItemId_fkey" FOREIGN KEY ("savedItemId") REFERENCES "SavedItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Backfill existing memberships from the old scalar column.
INSERT INTO "CollectionMembership" ("id", "collectionId", "savedItemId", "createdAt")
SELECT
    gen_random_uuid()::text,
    "collectionId",
    "id",
    CURRENT_TIMESTAMP
FROM "SavedItem"
WHERE "collectionId" IS NOT NULL;

-- 3. Drop the old one-to-many column, its FK and index.
ALTER TABLE "SavedItem" DROP CONSTRAINT IF EXISTS "SavedItem_collectionId_fkey";
DROP INDEX IF EXISTS "SavedItem_collectionId_idx";
ALTER TABLE "SavedItem" DROP COLUMN "collectionId";
