import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/http";

// Marks the welcome guide as seen for the signed-in account. Shared by web
// (session cookie) and mobile (bearer token) via requireApiUser, so the guide
// shows only once per account across every device and browser.
export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    if (!user.onboardingSeenAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingSeenAt: new Date() },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
