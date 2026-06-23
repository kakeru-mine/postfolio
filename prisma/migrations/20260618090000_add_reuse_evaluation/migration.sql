ALTER TABLE "SavedItem"
  ADD COLUMN "reuseScore" INTEGER,
  ADD COLUMN "referencePoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "usefulFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "reuseStatus" TEXT NOT NULL DEFAULT 'idea',
  ADD COLUMN "evaluationNote" TEXT;

CREATE INDEX "SavedItem_userId_reuseScore_idx" ON "SavedItem"("userId", "reuseScore");
CREATE INDEX "SavedItem_userId_reuseStatus_idx" ON "SavedItem"("userId", "reuseStatus");
