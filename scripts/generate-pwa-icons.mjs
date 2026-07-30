import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const brandDirectory = path.join(projectDirectory, "public", "brand");
const iconDirectory = path.join(projectDirectory, "public", "icons");
const sourcePath = path.join(brandDirectory, "allvino-wordmark.png");
const inputPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : sourcePath;

const BRAND_COLOR = { r: 171, g: 22, b: 42, alpha: 1 };
const CANVAS_SIZE = 1024;

await mkdir(brandDirectory, { recursive: true });

if (inputPath !== sourcePath) {
  await sharp(inputPath).png().toFile(sourcePath);
}

async function createSquareIcon(wordmarkWidth) {
  const wordmark = await sharp(sourcePath)
    .resize({ width: wordmarkWidth })
    .png()
    .toBuffer();
  const metadata = await sharp(wordmark).metadata();

  return sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: BRAND_COLOR,
    },
  })
    .composite([
      {
        input: wordmark,
        left: Math.round((CANVAS_SIZE - metadata.width) / 2),
        top: Math.round((CANVAS_SIZE - metadata.height) / 2),
      },
    ])
    .png()
    .toBuffer();
}

const regularIcon = await createSquareIcon(900);
const maskableIcon = await createSquareIcon(740);

await Promise.all([
  sharp(regularIcon).toFile(path.join(iconDirectory, "app-icon-1024.png")),
  sharp(maskableIcon).toFile(
    path.join(iconDirectory, "app-icon-maskable-1024.png"),
  ),
  sharp(regularIcon).resize(192, 192).toFile(path.join(iconDirectory, "icon-192.png")),
  sharp(regularIcon).resize(512, 512).toFile(path.join(iconDirectory, "icon-512.png")),
  sharp(maskableIcon)
    .resize(192, 192)
    .toFile(path.join(iconDirectory, "icon-maskable-192.png")),
  sharp(maskableIcon)
    .resize(512, 512)
    .toFile(path.join(iconDirectory, "icon-maskable-512.png")),
  sharp(regularIcon).resize(512, 512).toFile(path.join(projectDirectory, "src", "app", "icon.png")),
  sharp(regularIcon)
    .resize(180, 180)
    .toFile(path.join(projectDirectory, "src", "app", "apple-icon.png")),
]);

console.log("Allvino PWA icons generated successfully.");
