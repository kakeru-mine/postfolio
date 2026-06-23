-- CreateEnum
CREATE TYPE "SourcePlatform" AS ENUM ('X', 'NOTE', 'YOUTUBE', 'SUBSTACK', 'TIKTOK', 'INSTAGRAM', 'THREADS', 'LINKEDIN', 'REDDIT', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "sourcePlatform" "SourcePlatform" NOT NULL DEFAULT 'OTHER',
    "title" TEXT,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "domain" TEXT,
    "authorName" TEXT,
    "userMemo" TEXT,
    "purpose" TEXT,
    "userTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiSummary" TEXT,
    "aiTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiUseCases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiGrowthReason" TEXT,
    "aiContentAngles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "collectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6C63FF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SavedItem_userId_createdAt_idx" ON "SavedItem"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SavedItem_userId_sourcePlatform_idx" ON "SavedItem"("userId", "sourcePlatform");

-- CreateIndex
CREATE INDEX "SavedItem_collectionId_idx" ON "SavedItem"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedItem_userId_normalizedUrl_key" ON "SavedItem"("userId", "normalizedUrl");

-- CreateIndex
CREATE INDEX "Collection_userId_updatedAt_idx" ON "Collection"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_userId_name_key" ON "Collection"("userId", "name");

-- AddForeignKey
ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
