import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { collectionSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { id } = await context.params;
    const input = collectionSchema.parse(await request.json());
    const exists = await prisma.collection.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!exists) {
      return NextResponse.json({ error: "コレクションが見つかりません。" }, { status: 404 });
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description || null,
        color: input.color,
      },
      include: { _count: { select: { items: true } } },
    });

    return NextResponse.json({ collection });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { id } = await context.params;
    const result = await prisma.collection.deleteMany({
      where: { id, userId: user.id },
    });

    if (!result.count) {
      return NextResponse.json({ error: "コレクションが見つかりません。" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
