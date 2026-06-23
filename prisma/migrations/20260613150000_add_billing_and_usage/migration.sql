CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO', 'CREATOR');

ALTER TABLE "User"
ADD COLUMN "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "stripeSubscriptionId" TEXT,
ADD COLUMN "stripePriceId" TEXT,
ADD COLUMN "subscriptionStatus" TEXT,
ADD COLUMN "subscriptionPeriodEnd" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_stripeCustomerId_key"
ON "User"("stripeCustomerId");

CREATE UNIQUE INDEX "User_stripeSubscriptionId_key"
ON "User"("stripeSubscriptionId");

CREATE TABLE "AiUsageMonth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUsageMonth_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiUsageMonth_userId_periodKey_key"
ON "AiUsageMonth"("userId", "periodKey");

CREATE INDEX "AiUsageMonth_periodKey_idx"
ON "AiUsageMonth"("periodKey");

ALTER TABLE "AiUsageMonth"
ADD CONSTRAINT "AiUsageMonth_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
