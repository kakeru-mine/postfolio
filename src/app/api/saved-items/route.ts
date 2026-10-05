import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { persistMetadataMedia } from "@/lib/image-storage";
import { LiveBroadcastError } from "@/lib/live-broadcast";
import { fetchUrlMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import {
  detectPlatform,
  isSupportedPlatform,
  parseSupportedPlatform,
} from "@/lib/platform";
import { requireApiUser } from "@/lib/auth";
import { flattenItemCollections, itemCollectionsSelect } from "@/lib/collections";
import { normalizeUrl } from "@/lib/utils";
import { savedItemCreateSchema } from "@/lib/validation";
import { updateSavedItemPublishedAt } from "@/lib/saved-item-published-at";
import { assertCanSaveItem, UsageLimitError } from "@/lib/usage";

// Saving fetches page metadata and re-hosts CDN images, which can exceed the
// platform's default function timeout.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const params = request.nextUrl.searchParams;
    const q = params.get("q")?.trim();
    const rawPlatform = params.get("platform");
    const platform = parseSupportedPlatform(rawPlatform);
    const collectionId = params.get("collectionId");
    const tag = params.get("tag")?.trim();

    const items = await prisma.savedItem.findMany({
      where: {
        userId: user.id,
        ...(platform ? { sourcePlatform: platform } : {}),
        ...(collectionId ? { collections: { some: { collectionId } } } : {}),
        ...(tag ? { userTags: { has: tag } } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { userMemo: { contains: q, mode: "insensitive" } },
                { url: { contains: q, mode: "insensitive" } },
                { userTags: { has: q } },
              ],
            }
          : {}),
      },
      include: itemCollectionsSelect,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      items: items.map((item) => ({
        ...item,
        collections: flattenItemCollections(item.collections),
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = savedItemCreateSchema.parse(await request.json());
    const user = await requireApiUser(request);
    await assertCanSaveItem(user);
    const normalizedUrl = normalizeUrl(input.url);
    const parsedUrl = new URL(normalizedUrl);
    const detectedPlatform = detectPlatform(parsedUrl.hostname);

    if (!isSupportedPlatform(detectedPlatform)) {
      return NextResponse.json(
        {
          error:
            "対応しているSNSのURLを入力してください。X、Instagram、Threads、YouTube、note、Substack、TikTok、Bluesky、Pinterestに対応しています。",
        },
        { status: 400 },
      );
    }

    let metadata = {
      title: undefined as string | undefined,
      description: undefined as string | undefined,
      thumbnailUrl: undefined as string | undefined,
      authorName: undefined as string | undefined,
      publishedAt: undefined as Date | undefined,
      domain: parsedUrl.hostname.replace(/^www\./, ""),
      sourcePlatform: detectedPlatform,
    };

    try {
      metadata = await persistMetadataMedia(await fetchUrlMetadata(normalizedUrl));
    } catch (error) {
      // Live broadcasts have no stable content to save, so reject outright.
      if (error instanceof LiveBroadcastError) throw error;
      // Otherwise saving the URL is more important than metadata enrichment.
    }

    if (!isSupportedPlatform(metadata.sourcePlatform)) {
      return NextResponse.json(
        { error: "リダイレクト先が対応SNSではないため保存できません。" },
        { status: 400 },
      );
    }

    // Accept either the single-pick `collectionId` (save form) or a full
    // `collectionIds` set, de-duplicated. Memberships are only created for
    // collections the user actually owns.
    const requestedCollectionIds = [
      ...new Set(
        [...(input.collectionIds ?? []), input.collectionId].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    ];
    const ownedCollectionIds = requestedCollectionIds.length
      ? (
          await prisma.collection.findMany({
            where: { id: { in: requestedCollectionIds }, userId: user.id },
            select: { id: true },
          })
        ).map((collection) => collection.id)
      : [];

    const { publishedAt, ...storedMetadata } = metadata;
    const item = await prisma.savedItem.create({
      data: {
        userId: user.id,
        url: input.url,
        normalizedUrl,
        userMemo: input.memo || null,
        purpose: input.purpose || null,
        userTags: input.tags,
        collections: {
          create: ownedCollectionIds.map((id) => ({ collectionId: id })),
        },
        ...storedMetadata,
      },
      include: itemCollectionsSelect,
    });
    await updateSavedItemPublishedAt(item.id, publishedAt);

    return NextResponse.json(
      {
        item: {
          ...item,
          collections: flattenItemCollections(item.collections),
          publishedAt: publishedAt ?? null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return NextResponse.json(
        {
          error: error.message,
          resource: error.resource,
          details: error.details,
        },
        { status: 403 },
      );
    }
    return apiError(error);
  }
}
