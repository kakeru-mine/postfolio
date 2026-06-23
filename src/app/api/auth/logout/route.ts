import { NextResponse } from "next/server";
import { deleteCurrentSession } from "@/lib/auth";
import { apiError } from "@/lib/http";

export async function POST() {
  try {
    await deleteCurrentSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
