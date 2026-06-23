import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.DEMO_USER_EMAIL ?? "demo@example.com";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Demo Creator" },
  });

  await prisma.collection.createMany({
    data: [
      {
        userId: user.id,
        name: "コンテンツ企画",
        description: "記事や投稿のネタ候補",
        color: "#6C63FF",
      },
      {
        userId: user.id,
        name: "競合リサーチ",
        description: "参考にしたい発信や事例",
        color: "#18A999",
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
