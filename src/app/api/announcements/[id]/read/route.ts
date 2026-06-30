import { NextRequest, NextResponse } from "next/server";
import { markAnnouncementRead } from "@/lib/announcements";
import { apiError } from "@/lib/http";
import { getCurrentUser } from "@/lib/user";

type Context = { params: Promise<{ id: string }> };

export async function POST(_: NextRequest, context: Context) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const ok = await markAnnouncementRead(user.id, id);
    if (!ok) {
      return NextResponse.json(
        { error: "お知らせが見つかりません。" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
