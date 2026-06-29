// Generates the OGP / Twitter Card images (1200x630):
//   public/og-image.png  – brand logo on a gradient
//   public/og-mock.png   – research-card grid mock (like the app's library)
// Run: node scripts/generate-og-image.mjs
import sharp from "sharp";

const W = 1200;
const H = 630;

// --- 1. Logo card -----------------------------------------------------------
const logoBg = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#172554"/>
        <stop offset="1" stop-color="#2563eb"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect x="200" y="150" width="800" height="330" rx="40" fill="#ffffff"/>
  </svg>`,
);
const logo = await sharp("public/postfolio-logo.png").resize({ width: 560 }).toBuffer();
await sharp(logoBg)
  .composite([{ input: logo, gravity: "center" }])
  .png()
  .toFile("public/og-image.png");
console.log("Wrote public/og-image.png");

// --- 2. Research-card grid mock --------------------------------------------
const posts = [
  { img: "post-1.png", sns: "note", title: "夜の部屋で出会う、しゃべる鏡の話" },
  { img: "post-3.png", sns: "Instagram", title: "映えるカフェメニューの撮り方メモ" },
  { img: "post-6.png", sns: "TikTok", title: "1本目で離脱させないフックの作り方" },
  { img: "post-2.png", sns: "X", title: "伸びた投稿に共通する書き出しパターン" },
  { img: "post-4.png", sns: "YouTube", title: "旅Vlogのサムネ構成リファレンス" },
  { img: "post-5.png", sns: "Substack", title: "ブランドの世界観をつくる配色設計" },
];

const margin = 36;
const gap = 20;
const cols = 3;
const rows = 2;
const cardW = Math.floor((W - margin * 2 - gap * (cols - 1)) / cols);
const cardH = Math.floor((H - margin * 2 - gap * (rows - 1)) / rows);
const imgPad = 10;
const imgW = cardW - imgPad * 2;
const imgH = 150;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const trunc = (s, n) => (s.length > n ? s.slice(0, n) + "…" : s);

let cards = "";
const composites = [];
for (let i = 0; i < posts.length; i++) {
  const col = i % cols;
  const row = Math.floor(i / cols);
  const x = margin + col * (cardW + gap);
  const y = margin + row * (cardH + gap);
  const badge = posts[i].sns;
  const badgeW = badge.length * 9 + 22;

  cards += `
    <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="16" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
    <rect x="${x + 14}" y="${y + imgPad + imgH + 14}" width="${badgeW}" height="24" rx="12" fill="#eef2ff"/>
    <text x="${x + 14 + badgeW / 2}" y="${y + imgPad + imgH + 31}" font-size="14" font-weight="700" fill="#2563eb" text-anchor="middle" font-family="sans-serif">${esc(badge)}</text>
    <text x="${x + 14}" y="${y + imgPad + imgH + 66}" font-size="18" font-weight="700" fill="#1f2937" font-family="sans-serif">${esc(trunc(posts[i].title, 15))}</text>`;

  const mask = Buffer.from(
    `<svg width="${imgW}" height="${imgH}"><rect width="${imgW}" height="${imgH}" rx="10" ry="10"/></svg>`,
  );
  const thumb = await sharp(`public/landing/mock/${posts[i].img}`)
    .resize(imgW, imgH, { fit: "cover" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  composites.push({ input: thumb, left: x + imgPad, top: y + imgPad });
}

const mockBg = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#eef2f7"/>
    ${cards}
  </svg>`,
);
await sharp(mockBg).composite(composites).png().toFile("public/og-mock.png");
console.log("Wrote public/og-mock.png");
