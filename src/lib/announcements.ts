import { cache } from "react";
import { translateAnnouncementToEnglish } from "@/lib/announcement-translate";
import { prisma } from "@/lib/prisma";

export type AnnouncementView = {
  id: string;
  title: string;
  body: string;
  titleEn: string | null;
  bodyEn: string | null;
  publishedAt: Date;
  read: boolean;
};

// An announcement counts as "unread" only when it was published AFTER the user
// registered. Anything from before they joined is treated as already seen, so a
// brand-new account does not light up with the entire back catalogue.
function unreadWhere(userId: string, since: Date | null) {
  return {
    published: true,
    ...(since ? { publishedAt: { gt: since } } : {}),
    reads: { none: { userId } },
  };
}

export const ANNOUNCEMENTS_PAGE_SIZE = 20;

// Public list with per-user read state, paginated (newest first). Anonymous
// visitors get every item marked as "read" (no badges / buttons).
export async function listAnnouncementsForUser(
  userId: string | null,
  since: Date | null,
  page = 1,
  pageSize = ANNOUNCEMENTS_PAGE_SIZE,
): Promise<{ items: AnnouncementView[]; total: number }> {
  const [total, announcements] = await Promise.all([
    prisma.announcement.count({ where: { published: true } }),
    prisma.announcement.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        body: true,
        titleEn: true,
        bodyEn: true,
        publishedAt: true,
        reads: userId
          ? { where: { userId }, select: { id: true }, take: 1 }
          : false,
      },
    }),
  ]);

  const items = announcements.map((announcement) => {
    const hasReadRecord = (announcement.reads?.length ?? 0) > 0;
    const publishedBeforeSignup = since
      ? announcement.publishedAt <= since
      : false;
    return {
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      titleEn: announcement.titleEn,
      bodyEn: announcement.bodyEn,
      publishedAt: announcement.publishedAt,
      read: userId ? hasReadRecord || publishedBeforeSignup : true,
    };
  });

  return { items, total };
}

// Cheaper than a COUNT: we only need to know whether at least one unread item
// exists, so stop at the first match. Memoised per request.
export const hasUnreadAnnouncements = cache(async function hasUnreadAnnouncements(
  userId: string,
  since: Date | null,
): Promise<boolean> {
  const first = await prisma.announcement.findFirst({
    where: unreadWhere(userId, since),
    select: { id: true },
  });
  return Boolean(first);
});

export async function markAnnouncementRead(userId: string, announcementId: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { id: true },
  });
  if (!announcement) return false;

  await prisma.announcementRead.upsert({
    where: { userId_announcementId: { userId, announcementId } },
    create: { userId, announcementId },
    update: {},
  });
  return true;
}

export async function markAllAnnouncementsRead(userId: string, since: Date | null) {
  const unread = await prisma.announcement.findMany({
    where: unreadWhere(userId, since),
    select: { id: true },
  });
  if (unread.length === 0) return;

  await prisma.announcementRead.createMany({
    data: unread.map((announcement) => ({
      userId,
      announcementId: announcement.id,
    })),
    skipDuplicates: true,
  });
}

// --- Admin ---

export function listAllAnnouncements() {
  return prisma.announcement.findMany({
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      body: true,
      published: true,
      publishedAt: true,
    },
  });
}

export async function createAnnouncement(data: {
  title: string;
  body: string;
  published: boolean;
}) {
  const translation = await translateAnnouncementToEnglish(data);
  return prisma.announcement.create({ data: { ...data, ...translation } });
}

export async function updateAnnouncement(
  id: string,
  data: { title: string; body: string; published: boolean },
) {
  const translation = await translateAnnouncementToEnglish(data);
  return prisma.announcement.update({
    where: { id },
    data: { ...data, ...translation },
  });
}

// Re-notify: bump the publish date to now and clear every read record so the
// announcement is unread again for all users (including those who joined after
// its original date).
export async function republishAnnouncement(
  id: string,
  data: { title: string; body: string; published: boolean },
) {
  const translation = await translateAnnouncementToEnglish(data);
  return prisma.$transaction([
    prisma.announcement.update({
      where: { id },
      data: { ...data, ...translation, publishedAt: new Date() },
    }),
    prisma.announcementRead.deleteMany({ where: { announcementId: id } }),
  ]);
}

export function deleteAnnouncement(id: string) {
  return prisma.announcement.delete({ where: { id } });
}
