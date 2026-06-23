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
const frameDir = path.join(root, "tmp", "manual-register-smooth-frames");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const prisma = new PrismaClient();
const viewport = { width: 960, height: 540 };

function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function setupDemoData() {
  const email = "manual-register-smooth@postfolio.local";
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
      postText: "読者の悩みを先に提示し、具体例で理解しやすくする構成が参考になります。",
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
      ${click ? `<circle cx="${x}" cy="${y}" r="30" fill="#ff6b6b" opacity="0.28"/>` : ""}
      <path d="M ${x} ${y} L ${x} ${y + 34} L ${x + 9} ${y + 25} L ${x + 18} ${y + 45} L ${x + 28} ${y + 40} L ${x + 19} ${y + 21} L ${x + 33} ${y + 21} Z" fill="#0f172a" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
    </svg>
  `);
}

async function capture(page, file, index, cursor, click = false) {
  const screenshot = await page.screenshot({ type: "png", fullPage: false });
  const image = sharp(screenshot).resize(viewport.width, viewport.height, {
    fit: "cover",
  });

  if (cursor) {
    image.composite([{ input: cursorSvg(cursor.x, cursor.y, click), left: 0, top: 0 }]);
  }

  const out = path.join(frameDir, `${file}-${String(index).padStart(3, "0")}.png`);
  await image.png().toFile(out);
  return out;
}

function interpolate(from, to, progress) {
  return {
    x: Math.round(from.x + (to.x - from.x) * progress),
    y: Math.round(from.y + (to.y - from.y) * progress),
  };
}

async function push(frames, page, file, state, cursor, click = false) {
  state.index += 1;
  frames.push(await capture(page, file, state.index, cursor, click));
}

async function move(frames, page, file, state, from, to, steps = 12) {
  for (let i = 1; i <= steps; i += 1) {
    const cursor = interpolate(from, to, i / steps);
    await page.mouse.move(cursor.x, cursor.y);
    await page.waitForTimeout(20);
    await push(frames, page, file, state, cursor);
  }
}

async function typeText(frames, page, file, state, locator, text, cursor, every = 4) {
  await locator.fill("");
  for (let i = 0; i < text.length; i += 1) {
    await locator.pressSequentially(text[i], { delay: 10 });
    if (i % every === 0 || i === text.length - 1) {
      await push(frames, page, file, state, cursor);
    }
  }
}

async function makeVideo(file, frames, targetSeconds = 10) {
  const listPath = path.join(frameDir, `${file}.txt`);
  const lines = [];
  const frameDuration = Math.max(0.18, targetSeconds / Math.max(frames.length, 1));
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
    "scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2:color=white,fps=24,format=yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "29",
    "-movflags",
    "+faststart",
    path.join(manualDir, `${file}.mp4`),
  ]);
}

async function record(context, file, routine) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  const frames = await routine(page);
  await makeVideo(file, frames, 10);
  await page.close();
  console.log(`Recorded ${file}.mp4 (${frames.length} frames)`);
}

async function clickCreate(page) {
  const button = page.locator("button.button-primary").first();
  if (await button.count()) {
    await button.click();
  } else {
    await page.mouse.click(814, 124);
  }
}

async function main() {
  if (!existsSync(chromePath)) {
    throw new Error(`Chrome was not found: ${chromePath}`);
  }

  await mkdir(manualDir, { recursive: true });
  await rm(frameDir, { recursive: true, force: true });
  await mkdir(frameDir, { recursive: true });

  const { token, itemId } = await setupDemoData();
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addCookies([
    {
      name: "postfolio_session",
      value: token,
      url: appUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  await record(context, "register-step1", async (page) => {
    await page.goto(`${appUrl}/items`, { waitUntil: "networkidle" });
    const frames = [];
    const state = { index: 0 };
    const start = { x: 125, y: 82 };
    const target = { x: 814, y: 124 };
    await push(frames, page, "register-step1", state, start);
    await move(frames, page, "register-step1", state, start, target, 18);
    await push(frames, page, "register-step1", state, target, true);
    await clickCreate(page);
    await page.waitForTimeout(180);
    await push(frames, page, "register-step1", state, { x: 810, y: 145 });
    await move(frames, page, "register-step1", state, { x: 810, y: 145 }, { x: 160, y: 215 }, 12);
    await push(frames, page, "register-step1", state, { x: 160, y: 215 });
    return frames;
  });

  await record(context, "register-step2", async (page) => {
    await page.goto(`${appUrl}/items`, { waitUntil: "networkidle" });
    await clickCreate(page);
    await page.waitForTimeout(180);
    const frames = [];
    const state = { index: 0 };
    const urlInput = page.locator('input[name="url"]');
    const tagInput = page.locator('input[name="tags"]');
    const urlCursor = { x: 160, y: 216 };
    await push(frames, page, "register-step2", state, urlCursor);
    await urlInput.click();
    await push(frames, page, "register-step2", state, urlCursor, true);
    await typeText(
      frames,
      page,
      "register-step2",
      state,
      urlInput,
      "https://substack.com/@kakesannote/note/c-275914848",
      { x: 430, y: 216 },
      5,
    );
    const tagCursor = { x: 580, y: 392 };
    await move(frames, page, "register-step2", state, { x: 430, y: 216 }, tagCursor, 10);
    if (await tagInput.count()) {
      await tagInput.click();
      await push(frames, page, "register-step2", state, tagCursor, true);
      await typeText(frames, page, "register-step2", state, tagInput, "テスト", tagCursor, 1);
    }
    await move(frames, page, "register-step2", state, tagCursor, { x: 760, y: 478 }, 10);
    await push(frames, page, "register-step2", state, { x: 760, y: 478 }, true);
    return frames;
  });

  await record(context, "register-step3", async (page) => {
    await page.goto(`${appUrl}/items/${itemId}`, { waitUntil: "networkidle" });
    const frames = [];
    const state = { index: 0 };
    await push(frames, page, "register-step3", state, { x: 500, y: 235 });
    await move(frames, page, "register-step3", state, { x: 500, y: 235 }, { x: 610, y: 390 }, 12);
    await push(frames, page, "register-step3", state, { x: 610, y: 390 }, true);
    for (let i = 0; i < 7; i += 1) {
      await page.mouse.wheel(0, 45);
      await page.waitForTimeout(30);
      await push(frames, page, "register-step3", state, { x: 645 + i * 8, y: 380 - i * 4 });
    }
    await move(frames, page, "register-step3", state, { x: 700, y: 352 }, { x: 760, y: 390 }, 8);
    return frames;
  });

  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
