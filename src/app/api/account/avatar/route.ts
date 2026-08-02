import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";

const MAX_AVATAR_BYTES = 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "画像ファイルを選択してください。" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: "JPG、PNG、WebP、GIFの画像を選択してください。" },
        { status: 400 },
      );
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        { message: "画像サイズは1MB以内にしてください。" },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const avatarUrl = `data:${file.type};base64,${bytes.toString("base64")}`;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
      select: { avatarUrl: true },
    });

    return NextResponse.json({ avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    return apiError(error);
  }
}
