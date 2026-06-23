ALTER TABLE "SavedItem"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "SavedItem_userId_sortOrder_idx"
ON "SavedItem"("userId", "sortOrder");
