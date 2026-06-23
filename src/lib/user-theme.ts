import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeTheme, type ThemeColors } from "@/lib/theme";

type ThemeRow = {
  background: string;
  main: string;
  accent: string;
  sidebar: string;
};

export async function getUserTheme(userId: string): Promise<ThemeColors> {
  const [theme] = await prisma.$queryRaw<ThemeRow[]>(Prisma.sql`
    SELECT
      "themeBackground" AS "background",
      "themeMain" AS "main",
      "themeAccent" AS "accent",
      "themeSidebar" AS "sidebar"
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `);

  return normalizeTheme(theme ?? {});
}

export async function updateUserTheme(
  userId: string,
  theme: ThemeColors,
): Promise<ThemeColors> {
  const normalized = normalizeTheme(theme);
  const [updatedTheme] = await prisma.$queryRaw<ThemeRow[]>(Prisma.sql`
    UPDATE "User"
    SET
      "themeBackground" = ${normalized.background},
      "themeMain" = ${normalized.main},
      "themeAccent" = ${normalized.accent},
      "themeSidebar" = ${normalized.sidebar},
      "updatedAt" = NOW()
    WHERE "id" = ${userId}
    RETURNING
      "themeBackground" AS "background",
      "themeMain" AS "main",
      "themeAccent" AS "accent",
      "themeSidebar" AS "sidebar"
  `);

  return normalizeTheme(updatedTheme ?? normalized);
}
