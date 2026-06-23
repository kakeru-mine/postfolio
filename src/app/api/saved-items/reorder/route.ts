import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

const reorderSchema = z.object({
  itemIds: z.array(z.string().cuid()).min(1).max(500),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { itemIds } = reorderSchema.parse(await request.json());
    const uniqueIds = [...new Set(itemIds)];

    if (uniqueIds.length !== itemIds.length) {
      return NextResponse.json(
        { error: "並び順に重複したアイテムがあります。" },
        { status: 400 },
      );
    }

    const ownedItems = await prisma.savedItem.count({
      where: { userId: user.id, id: { in: uniqueIds } },
    });
    if (ownedItems !== uniqueIds.length) {
      return NextResponse.json(
        { error: "並び替えできないアイテムが含まれています。" },
        { status: 403 },
      );
    }

    await prisma.$transaction(
      uniqueIds.map((id, index) =>
        prisma.savedItem.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
