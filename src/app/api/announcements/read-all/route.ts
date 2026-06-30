import { NextResponse } from "next/server";
import { markAllAnnouncementsRead } from "@/lib/announcements";
import { apiError } from "@/lib/http";
import { getCurrentUser } from "@/lib/user";

export async function POST() {
  try {
    const user = await getCurrentUser();
    await markAllAnnouncementsRead(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
