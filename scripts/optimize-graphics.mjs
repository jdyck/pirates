import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceDirectory = path.join(root, "src/images");
const outputDirectory = path.join(root, "src/optimized");

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(filename) : [filename];
  }))).flat();
}

// Only ship artwork used by the app. Keep its source PNGs for regeneration.
const artwork = new Set();
for (const filename of await listFiles(path.join(root, "app"))) {
  if (!/\.(jsx?|css)$/.test(filename)) continue;
  const source = await readFile(filename, "utf8");
  for (const match of source.matchAll(/src\/(?:optimized|images)\/([^"'()]+)\.(?:png|webp)/g)) {
    artwork.add(`${match[1]}.png`);
  }
}

const report = [];
for (const source of [...artwork].sort()) {
  const original = path.join(sourceDirectory, source);
  const destination = source.replace(/\.png$/, ".webp");
  const output = path.join(outputDirectory, destination);
  const metadata = await sharp(original).metadata();
  // Board cells are usually <= 50 CSS pixels; allow ample Retina headroom.
  const isMarker = source.startsWith("markers/");
  const isDialogButton = /^buttons\/(mode-cpu|mode-person|victory-close|defeat-close)\.png$/.test(source);
  const width = source.startsWith("ships/") ? 256
    : isMarker ? 192
      : isDialogButton ? 1280
        : metadata.width;
  const lossless = (source.startsWith("buttons/") && !isDialogButton)
    || source.startsWith("ships/") || isMarker;
  const image = await sharp(original)
    .resize({ width, withoutEnlargement: true })
    .webp({ lossless, quality: 92, alphaQuality: 100, effort: 6 })
    .toBuffer({ resolveWithObject: true });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, image.data);
  report.push({ source, output: destination, originalBytes: (await stat(original)).size,
    optimizedBytes: image.data.length, width: image.info.width, height: image.info.height,
    lossless, originalPixels: metadata.width * metadata.height,
    optimizedPixels: image.info.width * image.info.height });
}

// Home Screen / manifest icons stay PNG for platform compatibility.
for (const filename of await listFiles(path.join(root, "public/icons"))) {
  if (!filename.endsWith(".png")) continue;
  const original = await readFile(filename);
  const optimized = await sharp(original).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  if (optimized.length < original.length) await writeFile(filename, optimized);
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
const before = report.reduce((sum, image) => sum + image.originalBytes, 0);
const after = report.reduce((sum, image) => sum + image.optimizedBytes, 0);
console.log(`Optimized ${report.length} graphics: ${(before / 1e6).toFixed(2)} MB → ${(after / 1e6).toFixed(2)} MB (${(100 * (1 - after / before)).toFixed(1)}% smaller).`);
