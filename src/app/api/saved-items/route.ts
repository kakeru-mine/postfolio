import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { fetchUrlMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import {
  detectPlatform,
  isSupportedPlatform,
  parseSupportedPlatform,
} from "@/lib/platform";
import { getCurrentUser } from "@/lib/user";
import { normalizeUrl } from "@/lib/utils";
import { savedItemCreateSchema } from "@/lib/validation";
import { updateSavedItemPublishedAt } from "@/lib/saved-item-published-at";
import { assertCanSaveItem, UsageLimitError } from "@/lib/usage";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
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
        ...(collectionId ? { collectionId } : {}),
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
      include: { collection: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ items });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = savedItemCreateSchema.parse(await request.json());
    const user = await getCurrentUser();
    await assertCanSaveItem(user);
    const normalizedUrl = normalizeUrl(input.url);
    const parsedUrl = new URL(normalizedUrl);
    const detectedPlatform = detectPlatform(parsedUrl.hostname);

    if (!isSupportedPlatform(detectedPlatform)) {
      return NextResponse.json(
        {
          error:
            "対応しているSNSのURLを入力してください。X、Instagram、Threads、YouTube、note、Substack、TikTokに対応しています。",
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
      metadata = await fetchUrlMetadata(normalizedUrl);
    } catch {
      // Saving the URL is more important than metadata enrichment in Phase 1.
    }

    if (!isSupportedPlatform(metadata.sourcePlatform)) {
      return NextResponse.json(
        { error: "リダイレクト先が対応SNSではないため保存できません。" },
        { status: 400 },
      );
    }

    const { publishedAt, ...storedMetadata } = metadata;
    const item = await prisma.savedItem.create({
      data: {
        userId: user.id,
        url: input.url,
        normalizedUrl,
        userMemo: input.memo || null,
        purpose: input.purpose || null,
        userTags: input.tags,
        collectionId: input.collectionId || null,
        ...storedMetadata,
      },
      include: { collection: true },
    });
    await updateSavedItemPublishedAt(item.id, publishedAt);

    return NextResponse.json(
      { item: { ...item, publishedAt: publishedAt ?? null } },
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
