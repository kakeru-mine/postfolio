import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { getCurrentUser } from "@/lib/user";
import { updateUserTheme } from "@/lib/user-theme";
import { themeSchema } from "@/lib/validation";

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const theme = themeSchema.parse(await request.json());
    const updatedTheme = await updateUserTheme(currentUser.id, theme);

    return NextResponse.json({ theme: updatedTheme });
  } catch (error) {
    return apiError(error);
  }
}
