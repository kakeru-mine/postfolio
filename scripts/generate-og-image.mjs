// Generates OGP / Twitter Card images (1200x630): a blue header with the logo
// (icon + gothic wordmark) and the main copy in white directly beneath it, above
// a row of research cards. Several variants are produced (og-1.png .. og-N.png), each with a
// random combination of cards, so shares vary which cards appear. One variant
// is picked at random per request.
// Run: node scripts/generate-og-image.mjs
import sharp from "sharp";

const W = 1200;
const H = 630;
const VARIANTS = 6;
const HEADER_H = 240;

const allPosts = [
  { img: "post-1.png", sns: "note", title: "夜の部屋のしゃべる鏡" },
  { img: "post-3.png", sns: "Instagram", title: "映えるカフェメニュー" },
  { img: "post-6.png", sns: "TikTok", title: "1本目で離脱させないフック" },
  { img: "post-2.png", sns: "X", title: "伸びた投稿の書き出し" },
  { img: "post-4.png", sns: "YouTube", title: "旅Vlogのサムネ構成" },
  { img: "post-5.png", sns: "Substack", title: "ブランドの世界観をつくる" },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
const cardTop = HEADER_H + 48;
const cardH = 288;
const imgPad = 12;
const imgW = cardW - imgPad * 2;
const imgH = 178;

// Logo lockup: white plate with the book icon (unchanged size) + the supplied
// wordmark image at its natural width, centered as a unit above the copy.
const plate = 124;
const iconSize = 92;
const lockupGap = 28;
const plateY = 38;
const icon = await sharp("public/postfolio-icon.png").resize({ width: iconSize }).toBuffer();

// Wordmark from the supplied logo image: drop the white background and recolour
// the navy lettering to white so it reads on the blue header.
const wordmarkH = 92;
const wmAlpha = await sharp("public/postfolio-wordmark.png")
  .greyscale()
  .negate()
  .linear(1.8, 0)
  .raw()
  .toBuffer({ resolveWithObject: true });
const wordmarkWhite = await sharp({
  create: {
    width: wmAlpha.info.width,
    height: wmAlpha.info.height,
    channels: 3,
    background: { r: 255, g: 255, b: 255 },
  },
})
  .joinChannel(wmAlpha.data, {
    raw: { width: wmAlpha.info.width, height: wmAlpha.info.height, channels: 1 },
  })
  .png()
  .toBuffer();
const wordmark = await sharp(wordmarkWhite)
  .trim()
  .resize({ height: wordmarkH })
  .png()
  .toBuffer();

// Centre the whole lockup (icon + wordmark) horizontally.
const wordmarkImgW = (await sharp(wordmark).metadata()).width;
const lockupW = plate + lockupGap + wordmarkImgW;
const plateX = Math.round((W - lockupW) / 2);
const wordmarkImgX = plateX + plate + lockupGap;
const wordmarkImgY = plateY + Math.round((plate - wordmarkH) / 2);

// Main copy: a single line of white text below the wordmark (no plate), aligned
// to the same left edge as the logo.
const copy = "SNSで見つけた良い投稿を、次の企画につなげるリサーチ資産へ。";
const copyFont = 34;
const copyFontFamily = "'Yu Gothic UI', 'Yu Gothic', 'BIZ UDPGothic', Meiryo, sans-serif";
const copyX = W / 2;
const copyTop = plateY + plate + 18;

for (let v = 1; v <= VARIANTS; v++) {
  const picks = shuffle(allPosts).slice(0, cols);
  let cards = "";
  const composites = [
    { input: icon, left: plateX + Math.round((plate - iconSize) / 2), top: plateY + Math.round((plate - iconSize) / 2) },
    { input: wordmark, left: wordmarkImgX, top: wordmarkImgY },
  ];

  for (let i = 0; i < picks.length; i++) {
    const x = margin + i * (cardW + gap);
    const y = cardTop;
    const badge = picks[i].sns;
    const badgeW = badge.length * 10 + 24;

    cards += `
      <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="18" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
      <rect x="${x + 16}" y="${y + imgPad + imgH + 16}" width="${badgeW}" height="26" rx="13" fill="#eef2ff"/>
      <text x="${x + 16 + badgeW / 2}" y="${y + imgPad + imgH + 34}" font-size="15" font-weight="700" fill="#2563eb" text-anchor="middle" font-family="Meiryo, sans-serif">${esc(badge)}</text>
      <text x="${x + 16}" y="${y + imgPad + imgH + 70}" font-size="21" font-weight="700" fill="#1f2937" font-family="Meiryo, sans-serif">${esc(picks[i].title)}</text>`;

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
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#172554"/>
          <stop offset="1" stop-color="#1e40af"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="#eef2f7"/>
      <rect width="${W}" height="${HEADER_H}" fill="url(#hg)"/>
      <rect x="${plateX}" y="${plateY}" width="${plate}" height="${plate}" rx="28" fill="#ffffff"/>
      <text x="${copyX}" y="${copyTop + copyFont}" font-size="${copyFont}" font-weight="700" fill="#ffffff" text-anchor="middle" font-family="${copyFontFamily}">${esc(copy)}</text>
      ${cards}
    </svg>`,
  );
  await sharp(bg).composite(composites).png().toFile(`public/og-${v}.png`);
  console.log(`Wrote public/og-${v}.png`);
}
