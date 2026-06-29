// Generates OGP / Twitter Card images (1200x630): a brand header (logo +
// tagline) combined with a row of research cards. Several variants are produced
// (og-1.png .. og-N.png), each with a random combination of cards, so shares
// vary which cards appear. One variant is picked at random per request.
// Run: node scripts/generate-og-image.mjs
import sharp from "sharp";

const W = 1200;
const H = 630;
const VARIANTS = 6;
const TAGLINE = "SNSで見つけた良い投稿を、次の企画につなげるリサーチ資産へ。";

const allPosts = [
  { img: "post-1.png", sns: "note", title: "夜の部屋で出会う、しゃべる鏡の話" },
  { img: "post-3.png", sns: "Instagram", title: "映えるカフェメニューの撮り方メモ" },
  { img: "post-6.png", sns: "TikTok", title: "1本目で離脱させないフックの作り方" },
  { img: "post-2.png", sns: "X", title: "伸びた投稿に共通する書き出しパターン" },
  { img: "post-4.png", sns: "YouTube", title: "旅Vlogのサムネ構成リファレンス" },
  { img: "post-5.png", sns: "Substack", title: "ブランドの世界観をつくる配色設計" },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const trunc = (s, n) => (s.length > n ? s.slice(0, n) + "…" : s);
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const margin = 60;
const gap = 30;
const cols = 3;
const cardW = Math.floor((W - margin * 2 - gap * (cols - 1)) / cols);
const cardTop = 250;
const cardH = 330;
const imgPad = 12;
const imgW = cardW - imgPad * 2;
const imgH = 190;

const logo = await sharp("public/postfolio-logo.png").resize({ width: 300 }).toBuffer();

for (let v = 1; v <= VARIANTS; v++) {
  const picks = shuffle(allPosts).slice(0, cols);
  let cards = "";
  const composites = [{ input: logo, left: margin, top: 56 }];

  for (let i = 0; i < picks.length; i++) {
    const x = margin + i * (cardW + gap);
    const y = cardTop;
    const badge = picks[i].sns;
    const badgeW = badge.length * 10 + 24;

    cards += `
      <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="18" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
      <rect x="${x + 16}" y="${y + imgPad + imgH + 16}" width="${badgeW}" height="26" rx="13" fill="#eef2ff"/>
      <text x="${x + 16 + badgeW / 2}" y="${y + imgPad + imgH + 34}" font-size="15" font-weight="700" fill="#2563eb" text-anchor="middle" font-family="sans-serif">${esc(badge)}</text>
      <text x="${x + 16}" y="${y + imgPad + imgH + 78}" font-size="21" font-weight="700" fill="#1f2937" font-family="sans-serif">${esc(trunc(picks[i].title, 13))}</text>`;

    const mask = Buffer.from(
      `<svg width="${imgW}" height="${imgH}"><rect width="${imgW}" height="${imgH}" rx="12" ry="12"/></svg>`,
    );
    const thumb = await sharp(`public/landing/mock/${picks[i].img}`)
      .resize(imgW, imgH, { fit: "cover" })
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();
    composites.push({ input: thumb, left: x + imgPad, top: y + imgPad });
  }

  const bg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="#eef2f7"/>
      <text x="${margin}" y="205" font-size="27" font-weight="600" fill="#334155" font-family="sans-serif">${esc(TAGLINE)}</text>
      ${cards}
    </svg>`,
  );
  await sharp(bg).composite(composites).png().toFile(`public/og-${v}.png`);
  console.log(`Wrote public/og-${v}.png`);
}
