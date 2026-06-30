import { prisma } from "@/lib/prisma";

export type AnnouncementView = {
  id: string;
  title: string;
  body: string;
  publishedAt: Date;
  read: boolean;
};

// Public list with per-user read state. Unread = no AnnouncementRead row for
// this user. Anonymous visitors get every item marked as "read" (no buttons).
export async function listAnnouncementsForUser(
  userId: string | null,
): Promise<AnnouncementView[]> {
  const announcements = await prisma.announcement.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      body: true,
      publishedAt: true,
      reads: userId
        ? { where: { userId }, select: { id: true }, take: 1 }
        : false,
    },
  });

  return announcements.map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    publishedAt: announcement.publishedAt,
    read: userId ? (announcement.reads?.length ?? 0) > 0 : true,
  }));
}

export async function countUnreadAnnouncements(userId: string): Promise<number> {
  return prisma.announcement.count({
    where: { published: true, reads: { none: { userId } } },
  });
}

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

export async function markAllAnnouncementsRead(userId: string) {
  const unread = await prisma.announcement.findMany({
    where: { published: true, reads: { none: { userId } } },
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

export function createAnnouncement(data: { title: string; body: string; published: boolean }) {
  return prisma.announcement.create({ data });
}

export function updateAnnouncement(
  id: string,
  data: { title: string; body: string; published: boolean },
) {
  return prisma.announcement.update({ where: { id }, data });
}

export function deleteAnnouncement(id: string) {
  return prisma.announcement.delete({ where: { id } });
}
