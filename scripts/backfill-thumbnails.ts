/**
 * Backfill: re-host already-saved Threads/Instagram thumbnails that still point
 * at expiring fbcdn/cdninstagram URLs onto permanent Supabase Storage.
 *
 * Run against the PRODUCTION database with the Supabase env configured, e.g.:
 *   npx tsx scripts/backfill-thumbnails.ts --env-file=.env.production.local --dry
 *   npx tsx scripts/backfill-thumbnails.ts --env-file=.env.production.local
 *
 * Flags:
 *   --env-file=PATH  Load env vars from PATH (default ".env").
 *   --dry            Report what would change without writing.
 *   --limit=N        Process at most N items.
 *   --delay=MS       Delay between items (default 1500ms) to be gentle on hosts.
 *   --force          Run even when Supabase Storage env is missing (not useful;
 *                    would only refresh still-expiring URLs).
 */
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
  const match = args.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : undefined;
};

function loadEnvFile(path: string) {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    console.warn(`env file not found: ${path} (relying on process env)`);
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}

loadEnvFile(option("env-file") ?? ".env");

const dry = flag("dry");
const limit = Number(option("limit") ?? "0") || undefined;
const delayMs = Number(option("delay") ?? "1500");

const supabaseReady = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);
if (!supabaseReady && !flag("force")) {
  console.error(
    "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です。本番envを --env-file で指定してください（テスト目的なら --force）。",
  );
  process.exit(1);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  // Import after env is loaded so modules read the intended configuration.
  const { PrismaClient } = await import("@prisma/client");
  const { fetchUrlMetadata } = await import("../src/lib/metadata");
  const { persistMetadataMedia, isOwnStorageUrl } = await import(
    "../src/lib/image-storage"
  );
  const { LiveBroadcastError } = await import("../src/lib/live-broadcast");

  const prisma = new PrismaClient();
  try {
    await run();
  } finally {
    await prisma.$disconnect();
  }

  async function run() {
  const items = await prisma.savedItem.findMany({
    where: {
      OR: [
        { thumbnailUrl: { contains: "fbcdn" } },
        { thumbnailUrl: { contains: "cdninstagram" } },
      ],
    },
    select: { id: true, normalizedUrl: true, thumbnailUrl: true },
    orderBy: { createdAt: "asc" },
    ...(limit ? { take: limit } : {}),
  });

  console.log(
    `対象 ${items.length} 件${dry ? "（dry-run）" : ""}${limit ? ` / limit=${limit}` : ""}`,
  );

  let persisted = 0;
  let skipped = 0;
  let failed = 0;

  for (const [index, item] of items.entries()) {
    const prefix = `[${index + 1}/${items.length}] ${item.id}`;
    try {
      const metadata = await persistMetadataMedia(
        await fetchUrlMetadata(item.normalizedUrl),
      );
      const newThumbnail = metadata.thumbnailUrl;

      if (!newThumbnail) {
        skipped += 1;
        console.log(`${prefix} skip: サムネ取得できず`);
      } else if (dry) {
        console.log(
          `${prefix} would update -> ${isOwnStorageUrl(newThumbnail) ? "[storage]" : "[external]"} ${newThumbnail.slice(0, 80)}`,
        );
      } else {
        await prisma.savedItem.update({
          where: { id: item.id },
          data: {
            thumbnailUrl: newThumbnail,
            ...(metadata.mediaUrls?.length
              ? { mediaUrls: metadata.mediaUrls }
              : {}),
          },
        });
        persisted += 1;
        console.log(
          `${prefix} updated ${isOwnStorageUrl(newThumbnail) ? "[storage]" : "[external]"}`,
        );
      }
    } catch (error) {
      if (error instanceof LiveBroadcastError) {
        skipped += 1;
        console.log(`${prefix} skip: ライブ/配信予定`);
      } else {
        failed += 1;
        console.warn(
          `${prefix} failed: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    if (index < items.length - 1) await sleep(delayMs);
  }

  console.log(
    `完了: 更新 ${persisted} / スキップ ${skipped} / 失敗 ${failed}`,
  );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
