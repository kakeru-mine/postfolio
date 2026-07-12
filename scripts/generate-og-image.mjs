// Generates the OG / Twitter Card image (1200x630) using Postfolio's brand
// colours: the footer's navy -> indigo gradient, with the icon on a white
// rounded badge next to the white wordmark and a small tagline (mirrors the
// site footer lockup). One static image, no variants.
// Run: node scripts/generate-og-image.mjs
import sharp from "sharp";

const W = 1200;
const H = 630;
// Footer background: linear-gradient(110deg, --sidebar, mix(primary-end 32%, --sidebar))
const NAVY = "#172554"; // --sidebar
const INDIGO = "#302f85"; // 32% primary-end mixed into --sidebar

const badgeSize = 196;
const badgeRadius = 44;
const wordmarkH = 116;
const lockupGap = 44;
const taglineFont = 19;
const taglineGap = 18;
const taglineText = "SNS RESEARCH BOX";

// Icon badge: the icon (white background) clipped to a rounded square, matching
// the footer's white rounded logo tile so it reads on the dark background.
const badgeRaw = await sharp("public/postfolio-icon.png")
  .resize(badgeSize, badgeSize, { fit: "cover" })
  .toBuffer();
const badgeMask = Buffer.from(
  `<svg width="${badgeSize}" height="${badgeSize}"><rect width="${badgeSize}" height="${badgeSize}" rx="${badgeRadius}" ry="${badgeRadius}"/></svg>`,
);
const iconBadge = await sharp(badgeRaw)
  .composite([{ input: badgeMask, blend: "dest-in" }])
  .png()
  .toBuffer();

// Wordmark: navy lettering on white -> recolour the letters to white so they
// read on the dark gradient (white background keyed out via the alpha mask).
const wmAlpha = await sharp("public/postfolio-wordmark.png")
  .greyscale()
  .negate()
  .linear(1.7, 0)
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
const wordmarkW = (await sharp(wordmark).metadata()).width;

// Centre the whole lockup (badge + text) on the canvas.
const lockupW = badgeSize + lockupGap + wordmarkW;
const lockupX = Math.round((W - lockupW) / 2);
const badgeX = lockupX;
const badgeY = Math.round((H - badgeSize) / 2);
const textX = lockupX + badgeSize + lockupGap;
const blockH = wordmarkH + taglineGap + taglineFont;
const blockTop = Math.round((H - blockH) / 2);
const wordmarkY = blockTop;
const taglineBaseline = blockTop + wordmarkH + taglineGap + taglineFont;

const bg = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0.2" x2="1" y2="0.8">
        <stop offset="0" stop-color="${NAVY}"/>
        <stop offset="1" stop-color="${INDIGO}"/>
      </linearGradient>
      <filter id="sh" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="15"/>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
    <rect x="${badgeX}" y="${badgeY + 10}" width="${badgeSize}" height="${badgeSize}" rx="${badgeRadius}" fill="#000000" opacity="0.28" filter="url(#sh)"/>
    <text x="${textX + 3}" y="${taglineBaseline}" font-size="${taglineFont}" font-weight="700" letter-spacing="4" fill="#ffffff" fill-opacity="0.6" font-family="'Segoe UI', Arial, sans-serif">${taglineText}</text>
  </svg>`,
);

await sharp(bg)
  .composite([
    { input: iconBadge, left: badgeX, top: badgeY },
    { input: wordmark, left: textX, top: wordmarkY },
  ])
  .png()
  .toFile("public/og.png");
console.log("Wrote public/og.png");
