import { randomBytes, createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright-core";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { PrismaClient } from "@prisma/client";

const root = process.cwd();
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const manualDir = path.join(root, "public", "manual");
const frameDir = path.join(root, "tmp", "manual-recording-frames");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const prisma = new PrismaClient();

const viewport = { width: 960, height: 540 };
const videoSize = "960:540";

function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function setupDemoData() {
  const email = "manual-video-demo@postfolio.local";
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: "Manual Demo", plan: "CREATOR" },
    create: { email, name: "Manual Demo", plan: "CREATOR" },
  });

  await prisma.savedItem.deleteMany({ where: { userId: user.id } });
  await prisma.collection.deleteMany({ where: { userId: user.id } });

  const collection = await prisma.collection.create({
    data: {
      userId: user.id,
      name: "テスト",
      description: "マニュアル録画用",
      color: "#2563EB",
    },
  });

  const item = await prisma.savedItem.create({
    data: {
      userId: user.id,
      collectionId: collection.id,
      url: "https://substack.com/@kakesannote/note/c-275914848",
      normalizedUrl: "https://substack.com/@kakesannote/note/c-275914848",
      sourcePlatform: "SUBSTACK",
      title: "発信の構成を学べるSubstack投稿",
      description: "導入、構成、言い回しの参考になる投稿です。",
      domain: "substack.com",
      authorName: "かけさん",
      postText:
        "読者の悩みを先に提示し、具体例で理解しやすくする構成が参考になります。",
      userMemo: "導入文と構成の参考にする",
      userTags: ["文章", "構成"],
      publishedAt: new Date("2026-06-14T09:00:00+09:00"),
      aiSummary: "読者の悩みを起点に、具体例で展開する投稿です。",
      aiRating: "A",
      aiGrowthReason:
        "冒頭で読者の課題を明確にしている点が強みです。構成も分かりやすく、保存後に再利用しやすい投稿です。",
      aiContentAngles: ["導入文の作り方", "読者課題から展開する構成"],
      sortOrder: 1,
    },
  });

  await prisma.savedItem.createMany({
    data: [
      {
        userId: user.id,
        collectionId: collection.id,
        url: "https://x.com/postfolio_demo/status/1",
        normalizedUrl: "https://x.com/postfolio_demo/status/1",
        sourcePlatform: "X",
        title: "短文コピーの参考投稿",
        description: "短い一文で関心を引く投稿。",
        domain: "x.com",
        userMemo: "X投稿の導入に使う",
        userTags: ["コピー", "短文"],
        sortOrder: 2,
      },
      {
        userId: user.id,
        collectionId: collection.id,
        url: "https://youtube.com/watch?v=postfolio-demo",
        normalizedUrl: "https://youtube.com/watch?v=postfolio-demo",
        sourcePlatform: "YOUTUBE",
        title: "動画台本の参考投稿",
        description: "冒頭の掴みが分かりやすい動画。",
        domain: "youtube.com",
        userMemo: "YouTube台本の参考",
        userTags: ["動画", "台本"],
        sortOrder: 3,
      },
    ],
  });

  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return { token, itemId: item.id };
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

function cursorSvg(x, y, click = false) {
  return Buffer.from(`
    <svg width="${viewport.width}" height="${viewport.height}" viewBox="0 0 ${viewport.width} ${viewport.height}" xmlns="http://www.w3.org/2000/svg">
      ${click ? `<circle cx="${x}" cy="${y}" r="28" fill="#ff6b6b" opacity="0.25"/>` : ""}
      <path d="M ${x} ${y} L ${x} ${y + 34} L ${x + 9} ${y + 25} L ${x + 18} ${y + 45} L ${x + 28} ${y + 40} L ${x + 19} ${y + 21} L ${x + 33} ${y + 21} Z" fill="#0f172a" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
    </svg>
  `);
}

async function capture(page, file, index, options = {}) {
  const screenshot = await page.screenshot({
    type: "png",
    fullPage: false,
  });
  const image = sharp(screenshot).resize(viewport.width, viewport.height, {
    fit: "cover",
  });

  if (options.cursor) {
    image.composite([
      {
        input: cursorSvg(options.cursor.x, options.cursor.y, options.click),
        left: 0,
        top: 0,
      },
    ]);
  }

  const out = path.join(frameDir, `${file}-${String(index).padStart(2, "0")}.png`);
  await image.png().toFile(out);
  return out;
}

async function makeVideo(file, frames, targetSeconds = 10) {
  const listPath = path.join(frameDir, `${file}.txt`);
  const lines = [];
  const frameDuration = Math.max(0.35, targetSeconds / Math.max(frames.length, 1));
  for (const frame of frames) {
    lines.push(`file '${frame.replaceAll("\\", "/")}'`);
    lines.push(`duration ${frameDuration}`);
  }
  lines.push(`file '${frames.at(-1).replaceAll("\\", "/")}'`);
  await writeFile(listPath, lines.join("\n"), "utf8");

  await runFfmpeg([
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-vf",
    `scale=${videoSize}:force_original_aspect_ratio=decrease,pad=${videoSize}:(ow-iw)/2:(oh-ih)/2:color=white,fps=24,format=yuv420p`,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "31",
    "-movflags",
    "+faststart",
    path.join(manualDir, `${file}.mp4`),
  ]);
}

async function recordStep(context, file, routine, options = {}) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  const frames = await routine(page);
  await makeVideo(file, frames, options.targetSeconds ?? 10);
  await page.close();
  console.log(`Recorded ${file}.mp4`);
}

async function clickFirst(page, selector, fallback = { x: 800, y: 130 }) {
  const locator = page.locator(selector).first();
  if (await locator.count()) {
    await locator.click();
    return;
  }
  await page.mouse.click(fallback.x, fallback.y);
}

async function main() {
  if (!existsSync(chromePath)) {
    throw new Error(`Chrome was not found: ${chromePath}`);
  }

  await mkdir(manualDir, { recursive: true });
  await rm(frameDir, { recursive: true, force: true });
  await mkdir(frameDir, { recursive: true });

  const { token, itemId } = await setupDemoData();
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
  });
  await context.addCookies([
    {
      name: "postfolio_session",
      value: token,
      url: appUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  await recordStep(context, "register-step1", async (page) => {
    await page.goto(`${appUrl}/items`, { waitUntil: "networkidle" });
    const frames = [];
    frames.push(await capture(page, "register-step1", 1, { cursor: { x: 120, y: 82 } }));
    await clickFirst(page, "button.button-primary", { x: 800, y: 118 });
    await page.waitForTimeout(500);
    frames.push(await capture(page, "register-step1", 2, { cursor: { x: 760, y: 450 }, click: true }));
    return frames;
  });

  await recordStep(context, "register-step2", async (page) => {
    await page.goto(`${appUrl}/items`, { waitUntil: "networkidle" });
    await clickFirst(page, "button.button-primary", { x: 800, y: 118 });
    await page.locator('input[name="url"]').fill("https://substack.com/@kakesannote/note/c-275914848");
    const frames = [];
    frames.push(await capture(page, "register-step2", 1, { cursor: { x: 210, y: 215 } }));
    await page.locator('input[name="tags"]').fill("テスト");
    frames.push(await capture(page, "register-step2", 2, { cursor: { x: 760, y: 478 }, click: true }));
    return frames;
  });

  await recordStep(context, "register-step3", async (page) => {
    await page.goto(`${appUrl}/items/${itemId}`, { waitUntil: "networkidle" });
    const frames = [];
    frames.push(await capture(page, "register-step3", 1, { cursor: { x: 520, y: 300 } }));
    frames.push(await capture(page, "register-step3", 2, { cursor: { x: 660, y: 390 }, click: true }));
    return frames;
  });

  await recordStep(context, "organize-search-items", async (page) => {
    await page.goto(`${appUrl}/items`, { waitUntil: "networkidle" });
    const frames = [];
    frames.push(await capture(page, "organize-search-items", 1, { cursor: { x: 210, y: 230 } }));
    await page.locator('input[name="q"]').fill("文章");
    frames.push(await capture(page, "organize-search-items", 2, { cursor: { x: 760, y: 230 }, click: true }));
    return frames;
  });

  await recordStep(context, "organize-collections", async (page) => {
    await page.goto(`${appUrl}/collections`, { waitUntil: "networkidle" });
    const frames = [];
    frames.push(await capture(page, "organize-collections", 1, { cursor: { x: 220, y: 300 } }));
    frames.push(await capture(page, "organize-collections", 2, { cursor: { x: 500, y: 350 }, click: true }));
    return frames;
  });

  await recordStep(context, "organize-tags", async (page) => {
    await page.goto(`${appUrl}/items/${itemId}`, { waitUntil: "networkidle" });
    const frames = [];
    frames.push(await capture(page, "organize-tags", 1, { cursor: { x: 770, y: 380 } }));
    const tagInput = page.locator('input[name="tags"]').first();
    if (await tagInput.count()) {
      await tagInput.fill("文章, 構成, 参考");
    }
    frames.push(await capture(page, "organize-tags", 2, { cursor: { x: 760, y: 465 }, click: true }));
    return frames;
  });

  await recordStep(context, "organize-bulk-actions", async (page) => {
    await page.goto(`${appUrl}/items`, { waitUntil: "networkidle" });
    const frames = [];
    frames.push(await capture(page, "organize-bulk-actions", 1, { cursor: { x: 60, y: 410 } }));
    await page.locator('button[aria-label*="選択"], button[aria-label*="謚慕"]').first().click().catch(async () => {
      await page.mouse.click(62, 410);
    });
    await page.waitForTimeout(400);
    frames.push(await capture(page, "organize-bulk-actions", 2, { cursor: { x: 280, y: 500 }, click: true }));
    return frames;
  });

  await recordStep(context, "ai-run-ai", async (page) => {
    await page.goto(`${appUrl}/items/${itemId}`, { waitUntil: "networkidle" });
    const frames = [];
    frames.push(await capture(page, "ai-run-ai", 1, { cursor: { x: 790, y: 340 } }));
    const aiButton = page.locator('button.button-primary').filter({ hasText: /AI|蛻/ }).first();
    if (await aiButton.count()) {
      await aiButton.click();
      await page.waitForTimeout(400);
    }
    frames.push(await capture(page, "ai-run-ai", 2, { cursor: { x: 620, y: 420 }, click: true }));
    return frames;
  });

  await recordStep(context, "ai-read-ai", async (page) => {
    await page.goto(`${appUrl}/items/${itemId}`, { waitUntil: "networkidle" });
    const frames = [];
    frames.push(await capture(page, "ai-read-ai", 1, { cursor: { x: 520, y: 330 } }));
    await page.mouse.wheel(0, 280);
    await page.waitForTimeout(300);
    frames.push(await capture(page, "ai-read-ai", 2, { cursor: { x: 520, y: 340 } }));
    return frames;
  });

  await recordStep(context, "ai-bulk-ai", async (page) => {
    await page.goto(`${appUrl}/items`, { waitUntil: "networkidle" });
    const frames = [];
    await page.mouse.click(62, 410);
    await page.waitForTimeout(300);
    frames.push(await capture(page, "ai-bulk-ai", 1, { cursor: { x: 770, y: 500 } }));
    frames.push(await capture(page, "ai-bulk-ai", 2, { cursor: { x: 770, y: 500 }, click: true }));
    return frames;
  });

  await recordStep(context, "plan-check-plan", async (page) => {
    await page.goto(`${appUrl}/`, { waitUntil: "networkidle" });
    return [
      await capture(page, "plan-check-plan", 1, { cursor: { x: 575, y: 360 } }),
      await capture(page, "plan-check-plan", 2, { cursor: { x: 575, y: 430 } }),
    ];
  });

  await recordStep(context, "plan-change-plan", async (page) => {
    await page.goto(`${appUrl}/pricing`, { waitUntil: "networkidle" });
    return [
      await capture(page, "plan-change-plan", 1, { cursor: { x: 510, y: 380 } }),
      await capture(page, "plan-change-plan", 2, { cursor: { x: 510, y: 500 }, click: true }),
    ];
  });

  await recordStep(context, "plan-billing", async (page) => {
    await page.goto(`${appUrl}/settings`, { waitUntil: "networkidle" });
    return [
      await capture(page, "plan-billing", 1, { cursor: { x: 460, y: 315 } }),
      await capture(page, "plan-billing", 2, { cursor: { x: 650, y: 400 } }),
    ];
  });

  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
