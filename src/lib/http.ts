import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthenticationError } from "@/lib/auth";

export function apiError(error: unknown) {
  if (error instanceof AuthenticationError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "入力内容を確認してください。" },
      { status: 400 },
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { error: "同じ内容がすでに登録されています。" },
      { status: 409 },
    );
  }

  console.error(error);
  return NextResponse.json(
    {
      error: "処理に失敗しました。しばらくしてから再度お試しください。",
      ...(process.env.NODE_ENV === "development" && error instanceof Error
        ? { detail: error.message }
        : {}),
    },
    { status: 500 },
  );
}
