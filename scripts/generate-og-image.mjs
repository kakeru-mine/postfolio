// Generates the OG / Twitter Card image (1200x630): a solid light-blue
// background with a single centered lockup — the Postfolio icon on a white
// rounded badge next to the navy wordmark. One static image, no variants /
// randomness. Run: node scripts/generate-og-image.mjs
import sharp from "sharp";

const W = 1200;
const H = 630;
const BG = "#e8f0fe"; // solid flat background
const NAVY = { r: 0x17, g: 0x25, b: 0x54 }; // wordmark colour

const tile = 216; // white rounded badge behind the icon
const tileRadius = 48;
const iconSize = 150;
const wordmarkH = 132;
const lockupGap = 40;

// Icon keeps its own white background, which merges seamlessly into the white
// badge tile, leaving the rounded corners as a clean app-icon-style badge.
const icon = await sharp("public/postfolio-icon.png")
  .resize({ width: iconSize })
  .toBuffer();

// Wordmark is navy lettering on white; key the white out to transparent (so it
// floats on the tinted background) and recolour the letters to the brand navy.
const wmAlpha = await sharp("public/postfolio-wordmark.png")
  .greyscale()
  .negate()
  .linear(1.7, 0)
  .raw()
  .toBuffer({ resolveWithObject: true });
const wordmarkColored = await sharp({
  create: {
    width: wmAlpha.info.width,
    height: wmAlpha.info.height,
    channels: 3,
    background: NAVY,
  },
})
  .joinChannel(wmAlpha.data, {
    raw: { width: wmAlpha.info.width, height: wmAlpha.info.height, channels: 1 },
  })
  .png()
  .toBuffer();
const wordmark = await sharp(wordmarkColored)
  .trim()
  .resize({ height: wordmarkH })
  .png()
  .toBuffer();
const wordmarkW = (await sharp(wordmark).metadata()).width;

// Centre the whole lockup (badge + wordmark) on the canvas.
const lockupW = tile + lockupGap + wordmarkW;
const lockupX = Math.round((W - lockupW) / 2);
const tileX = lockupX;
const tileY = Math.round((H - tile) / 2);
const iconX = tileX + Math.round((tile - iconSize) / 2);
const iconY = tileY + Math.round((tile - iconSize) / 2);
const wordmarkX = lockupX + tile + lockupGap;
const wordmarkY = Math.round((H - wordmarkH) / 2);

const bg = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="sh" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="16"/>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" fill="${BG}"/>
    <rect x="${tileX}" y="${tileY + 10}" width="${tile}" height="${tile}" rx="${tileRadius}" fill="#0f172a" opacity="0.16" filter="url(#sh)"/>
    <rect x="${tileX}" y="${tileY}" width="${tile}" height="${tile}" rx="${tileRadius}" fill="#ffffff"/>
  </svg>`,
);

await sharp(bg)
  .composite([
    { input: icon, left: iconX, top: iconY },
    { input: wordmark, left: wordmarkX, top: wordmarkY },
  ])
  .png()
  .toFile("public/og.png");
console.log("Wrote public/og.png");
