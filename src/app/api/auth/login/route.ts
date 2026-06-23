import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, verifyPassword } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().trim().email("メールアドレスを確認してください。"),
  password: z.string().min(1, "パスワードを入力してください。").max(128),
});

export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.parse(await request.json());
    const users = await prisma.$queryRaw<
      Array<{
        id: string;
        email: string;
        name: string | null;
        passwordHash: string | null;
      }>
    >`
      SELECT "id", "email", "name", "passwordHash"
      FROM "User"
      WHERE "email" = ${input.email.toLowerCase()}
      LIMIT 1
    `;
    const user = users[0];
    const valid =
      user?.passwordHash &&
      (await verifyPassword(input.password, user.passwordHash));

    if (!user || !valid) {
      return NextResponse.json(
        { error: "メールアドレスまたはパスワードが正しくありません。" },
        { status: 401 },
      );
    }

    await createSession(user.id);
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    return apiError(error);
  }
}
