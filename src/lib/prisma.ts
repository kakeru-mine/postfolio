import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: string | undefined;
};

const schemaVersion = "20260615-billing-subscription-state";

export const prisma =
  globalForPrisma.prisma && globalForPrisma.prismaSchemaVersion === schemaVersion
    ? globalForPrisma.prisma
    : new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["error", "warn"]
            : ["error"],
      });

if (
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prismaSchemaVersion !== schemaVersion
) {
  void globalForPrisma.prisma?.$disconnect();
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = schemaVersion;
}
