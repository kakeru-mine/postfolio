import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { collectionSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const collections = await prisma.collection.findMany({
      where: { userId: user.id },
      include: { _count: { select: { items: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ collections });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const input = collectionSchema.parse(await request.json());
    const collection = await prisma.collection.create({
      data: {
        userId: user.id,
        name: input.name,
        description: input.description || null,
        color: input.color,
      },
      include: { _count: { select: { items: true } } },
    });
    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
