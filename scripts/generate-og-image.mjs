// Generates public/og-image.png (1200x630) used for OGP / Twitter Card previews.
// Run: node scripts/generate-og-image.mjs
import sharp from "sharp";

const W = 1200;
const H = 630;

const background = Buffer.from(
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

const logo = await sharp("public/postfolio-logo.png")
  .resize({ width: 560 })
  .toBuffer();

await sharp(background)
  .composite([{ input: logo, gravity: "center" }])
  .png()
  .toFile("public/og-image.png");

console.log("Wrote public/og-image.png");
