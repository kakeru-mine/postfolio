import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manualDir = path.join(root, "public", "manual");

const videoWidth = 1280;
const videoHeight = 720;

const steps = [
  {
    file: "register-step1",
    category: "①新規登録",
    step: "STEP 1",
    title: "登録画面を開く",
    body: [
      "ヘッダーの「保存アイテム」を開き、絞り込みの下にある「新規作成」を押します。",
      "URL入力用のポップアップが表示されます。",
    ],
    flow: ["保存アイテム", "新規作成", "URL入力"],
    screenshot: "register-step1.png",
  },
  {
    file: "register-step2",
    category: "①新規登録",
    step: "STEP 2",
    title: "URLを貼り付ける",
    body: [
      "元のSNS投稿ページからURLをコピーし、PostfolioのURL欄に貼り付けます。",
      "必要ならコレクションやタグも入力します。",
    ],
    flow: ["SNS投稿", "URLをコピー", "Postfolioへ貼り付け"],
    screenshot: "register-step2.png",
  },
  {
    file: "register-step3",
    category: "①新規登録",
    step: "STEP 3",
    title: "投稿情報を確認する",
    body: [
      "保存後は投稿詳細ページで画像、投稿者、投稿日などが取れているか確認します。",
      "不足があれば「SNS情報を再取得」を試します。",
    ],
    flow: ["保存完了", "投稿詳細", "SNS情報を再取得"],
    screenshot: "register-step3.png",
  },
  {
    file: "organize-search-items",
    category: "②投稿の管理",
    step: "STEP 1",
    title: "検索・絞り込み",
    body: [
      "検索バーでタイトル、メモ、URLが検索可能です。",
      "SNSボタン、コレクション、タグで表示する投稿を絞り込めます。",
    ],
    flow: ["検索バー", "SNSボタン", "コレクション・タグ"],
  },
  {
    file: "organize-collections",
    category: "②投稿の管理",
    step: "STEP 2",
    title: "コレクションで分類する",
    body: [
      "コレクションページで新しい分類を作成できます。",
      "投稿詳細のリサーチメモから所属先を変更すると、コレクション内で確認できます。",
    ],
    flow: ["コレクション作成", "所属先を変更", "分類ごとに確認"],
  },
  {
    file: "organize-tags",
    category: "②投稿の管理",
    step: "STEP 3",
    title: "タグを編集する",
    body: [
      "投稿詳細のリサーチメモでタグを編集できます。",
      "複数選択からまとめてタグ付けもできます。タグの先頭に#は不要です。",
    ],
    flow: ["投稿詳細", "タグ編集", "まとめてタグ付け"],
  },
  {
    file: "organize-bulk-actions",
    category: "②投稿の管理",
    step: "STEP 4",
    title: "まとめて操作する",
    body: [
      "投稿カード左上のチェックで複数選択モードに入ります。",
      "下部メニューから操作を選び、削除やAI分析は確認ポップアップで確定します。",
    ],
    flow: ["複数選択", "操作を選択", "確認して確定"],
  },
  {
    file: "ai-run-ai",
    category: "③AI分析",
    step: "STEP 1",
    title: "AI分析を実行する",
    body: [
      "投稿詳細ページのAI分析欄からAI分析を実行できます。",
      "確認ポップアップで実行を確定すると、投稿概要や評価が表示されます。",
    ],
    flow: ["投稿詳細", "AI分析", "結果を確認"],
  },
  {
    file: "ai-read-ai",
    category: "③AI分析",
    step: "STEP 2",
    title: "分析結果を見る",
    body: [
      "投稿概要、コンテンツの切り口、投稿の評価を確認できます。",
      "「再利用するなら？」では、具体的な再利用アイデアを確認できます。",
    ],
    flow: ["投稿概要", "切り口", "再利用アイデア"],
  },
  {
    file: "ai-bulk-ai",
    category: "③AI分析",
    step: "STEP 3",
    title: "まとめてAI分析する",
    body: [
      "保存アイテムやコレクションで複数の投稿を選択できます。",
      "まとめてAI分析を実行すると、選択した投稿ごとに分析結果が反映されます。",
    ],
    flow: ["複数選択", "まとめてAI分析", "投稿ごとに反映"],
  },
  {
    file: "plan-check-plan",
    category: "④プラン",
    step: "STEP 1",
    title: "利用状況を確認する",
    body: [
      "ホーム画面で現在のプラン、保存枠、今月のAI分析回数を確認できます。",
      "保存枠は現在保存している投稿数で消費されます。",
    ],
    flow: ["ホーム", "利用状況", "残り枠を確認"],
  },
  {
    file: "plan-change-plan",
    category: "④プラン",
    step: "STEP 2",
    title: "プランを変更する",
    body: [
      "プラン一覧ページからFree、Pro、Creatorの内容を確認できます。",
      "変更したいプランのボタンを押すと、支払い画面に進みます。",
    ],
    flow: ["プラン一覧", "プラン選択", "変更完了"],
  },
  {
    file: "plan-billing",
    category: "④プラン",
    step: "STEP 3",
    title: "契約状況を確認する",
    body: [
      "設定画面では、現在のプランや契約状況を確認できます。",
      "支払い方法や契約変更は、連携している決済画面から管理します。",
    ],
    flow: ["設定", "契約状況", "決済画面"],
  },
];

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapText(text, maxChars) {
  const lines = [];
  let current = "";
  for (const char of text) {
    current += char;
    if (current.length >= maxChars || /[。、]/.test(char)) {
      lines.push(current);
      current = "";
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

async function imageElement(step) {
  if (!step.screenshot) {
    return "";
  }

  const imagePath = path.join(manualDir, step.screenshot);
  if (!existsSync(imagePath)) {
    return "";
  }

  const image = await readFile(imagePath);
  const metadata = await sharp(image).metadata();
  const width = metadata.width ?? 1;
  const height = metadata.height ?? 1;
  const areaWidth = 500;
  const areaHeight = 310;
  const scale = Math.min(areaWidth / width, areaHeight / height);
  const displayWidth = Math.round(width * scale);
  const displayHeight = Math.round(height * scale);
  const x = 720 + Math.round((areaWidth - displayWidth) / 2);
  const y = 250 + Math.round((areaHeight - displayHeight) / 2);

  return `
    <rect x="700" y="230" width="540" height="350" rx="28" fill="#ffffff" stroke="#dbe5f5"/>
    <image href="data:image/png;base64,${image.toString("base64")}" x="${x}" y="${y}" width="${displayWidth}" height="${displayHeight}" preserveAspectRatio="xMidYMid meet"/>
  `;
}

function flowSvg(flow, hasScreenshot) {
  const startX = hasScreenshot ? 92 : 210;
  const boxWidth = hasScreenshot ? 170 : 230;
  const gap = hasScreenshot ? 22 : 42;
  const y = hasScreenshot ? 580 : 455;

  return flow
    .map((label, index) => {
      const x = startX + index * (boxWidth + gap);
      const arrow =
        index < flow.length - 1
          ? `<path d="M ${x + boxWidth + 6} ${y + 32} L ${x + boxWidth + gap - 8} ${y + 32}" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>
             <path d="M ${x + boxWidth + gap - 20} ${y + 22} L ${x + boxWidth + gap - 8} ${y + 32} L ${x + boxWidth + gap - 20} ${y + 42}" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
          : "";
      return `
        <rect x="${x}" y="${y}" width="${boxWidth}" height="64" rx="18" fill="#ffffff" stroke="#dbe5f5"/>
        <text x="${x + boxWidth / 2}" y="${y + 40}" text-anchor="middle" font-size="21" font-weight="800" fill="#0f172a">${escapeXml(label)}</text>
        ${arrow}
      `;
    })
    .join("");
}

async function renderPoster(step) {
  const hasScreenshot = Boolean(step.screenshot);
  const paragraphLines = step.body.flatMap((paragraph) =>
    wrapText(paragraph, hasScreenshot ? 28 : 42),
  );
  const screenshot = await imageElement(step);

  const bodySvg = paragraphLines
    .slice(0, hasScreenshot ? 6 : 8)
    .map(
      (line, index) =>
        `<text x="92" y="${250 + index * 42}" font-size="25" font-weight="600" fill="#334155">${escapeXml(line)}</text>`,
    )
    .join("");

  const svg = `
    <svg width="${videoWidth}" height="${videoHeight}" viewBox="0 0 ${videoWidth} ${videoHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="55%" stop-color="#f5f8ff"/>
          <stop offset="100%" stop-color="#fff7f2"/>
        </linearGradient>
        <linearGradient id="accent" x1="0" x2="1">
          <stop offset="0%" stop-color="#2563eb"/>
          <stop offset="100%" stop-color="#7c3aed"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      <circle cx="1120" cy="80" r="160" fill="#dbeafe" opacity="0.55"/>
      <circle cx="1180" cy="620" r="210" fill="#ffedd5" opacity="0.5"/>
      <rect x="54" y="48" width="1172" height="624" rx="34" fill="#ffffff" opacity="0.92" stroke="#dbe5f5"/>

      <text x="92" y="105" font-size="25" font-weight="900" fill="#2563eb" letter-spacing="4">${escapeXml(step.category)}</text>
      <text x="92" y="155" font-size="48" font-weight="900" fill="#0f172a">${escapeXml(step.step)}</text>
      <text x="255" y="155" font-size="40" font-weight="900" fill="#0f172a">${escapeXml(step.title)}</text>

      <rect x="92" y="205" width="${hasScreenshot ? 560 : 820}" height="${hasScreenshot ? 330 : 205}" rx="28" fill="#f8fafc"/>
      ${bodySvg}

      ${screenshot}
      ${flowSvg(step.flow, hasScreenshot)}
    </svg>
  `;

  await sharp(Buffer.from(svg)).png().toFile(path.join(manualDir, `${step.file}.png`));
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
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

async function renderVideo(step) {
  const inputPath = path.join(manualDir, `${step.file}.png`);
  const outputPath = path.join(manualDir, `${step.file}.mp4`);

  await runFfmpeg([
    "-y",
    "-loop",
    "1",
    "-framerate",
    "30",
    "-i",
    inputPath,
    "-t",
    "7",
    "-vf",
    [
      "scale=1280:720:force_original_aspect_ratio=decrease",
      "pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=white",
      "fade=t=in:st=0:d=0.35",
      "fade=t=out:st=6.65:d=0.35",
      "format=yuv420p",
    ].join(","),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    "-movflags",
    "+faststart",
    outputPath,
  ]);

  console.log(`Created ${path.relative(root, outputPath)}`);
}

await mkdir(manualDir, { recursive: true });

for (const step of steps) {
  await renderPoster(step);
  await renderVideo(step);
}
