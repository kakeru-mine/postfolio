CREATE TABLE "GeneratedContent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "outputType" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sourceItemIds" TEXT[],
    "instruction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedContent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GeneratedContent_userId_createdAt_idx"
ON "GeneratedContent"("userId", "createdAt");

ALTER TABLE "GeneratedContent"
ADD CONSTRAINT "GeneratedContent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
