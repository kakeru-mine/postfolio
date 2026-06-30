import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteAnnouncement,
  republishAnnouncement,
  updateAnnouncement,
} from "@/lib/announcements";
import { isAdminEmail } from "@/lib/admin";
import { apiError } from "@/lib/http";
import { getCurrentUser } from "@/lib/user";

type Context = { params: Promise<{ id: string }> };

// Updating / re-notifying runs an OpenAI translation; allow headroom over the
// platform default so it doesn't 504 mid-translation.
export const maxDuration = 60;

const announcementSchema = z.object({
  title: z.string().trim().min(1, "タイトルを入力してください。").max(120),
  body: z.string().trim().min(1, "本文を入力してください。").max(4000),
  published: z.boolean().optional().default(true),
  // When true, reset read status and bump the publish date so the edit is
  // re-notified to every user as unread.
  resetReads: z.boolean().optional().default(false),
});

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await getCurrentUser();
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
    }
    const { id } = await context.params;
    const { resetReads, ...data } = announcementSchema.parse(await request.json());
    if (resetReads) {
      await republishAnnouncement(id, data);
    } else {
      await updateAnnouncement(id, data);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: NextRequest, context: Context) {
  try {
    const user = await getCurrentUser();
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
    }
    const { id } = await context.params;
    await deleteAnnouncement(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
