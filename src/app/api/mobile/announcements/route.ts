import { NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

// Public list of announcements for the mobile app (news are not user-specific).
export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, body: true, publishedAt: true },
      take: 50,
    });
    return NextResponse.json({ announcements });
  } catch (error) {
    return apiError(error);
  }
}
