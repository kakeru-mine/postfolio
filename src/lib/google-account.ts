import { sendNewUserAdminNotification } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export type GoogleProfile = {
  email: string;
  name?: string | null;
  picture?: string | null;
};

/**
 * Finds or creates a user from a verified Google profile (email-based linking),
 * backfilling name/avatar/verified-at on existing accounts and notifying the
 * operator on a brand-new signup. Shared by the web OAuth callback and the
 * mobile Google sign-in endpoint. Returns the user id.
 *
 * The caller is responsible for having verified the Google token and that the
 * email is Google-verified before calling this.
 */
export async function findOrCreateGoogleUser(
  profile: GoogleProfile,
): Promise<string> {
  const email = profile.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const data: { emailVerifiedAt?: Date; name?: string; avatarUrl?: string } = {};
    if (!existing.emailVerifiedAt) data.emailVerifiedAt = new Date();
    if (!existing.name && profile.name) data.name = profile.name;
    if (!existing.avatarUrl && profile.picture) data.avatarUrl = profile.picture;
    if (Object.keys(data).length) {
      await prisma.user.update({ where: { id: existing.id }, data });
    }
    return existing.id;
  }

  const created = await prisma.user.create({
    data: {
      email,
      name: profile.name ?? null,
      avatarUrl: profile.picture ?? null,
      emailVerifiedAt: new Date(),
    },
  });

  // Notify the operator of the new signup (Google is a signup channel too).
  // Non-blocking so a notification failure never breaks sign-in.
  try {
    const totalRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS "count"
      FROM "User"
      WHERE "passwordHash" IS NOT NULL OR "emailVerifiedAt" IS NOT NULL
    `;
    await sendNewUserAdminNotification({
      email,
      name: created.name,
      totalUsers: Number(totalRows[0]?.count ?? 0),
    });
  } catch (notifyError) {
    console.error("Failed to send new-user admin notification", notifyError);
  }

  return created.id;
}
