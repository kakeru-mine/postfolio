import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { consumeUserToken } from "@/lib/auth-tokens";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({ token: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    const { token } = schema.parse(await request.json());
    const userId = await consumeUserToken(token, "EMAIL_VERIFICATION");

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "確認リンクが無効か、有効期限が切れています。お手数ですが確認メールを再送してください。",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
      select: { id: true, name: true, email: true },
    });

    // Verification proves email ownership, so sign the user in directly.
    await createSession(user.id);
    return NextResponse.json({ user });
  } catch (error) {
    return apiError(error);
  }
}
