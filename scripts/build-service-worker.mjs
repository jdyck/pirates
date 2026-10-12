import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(filename) : [filename];
  }));
  return files.flat();
}

const buildId = (await readFile(".next/BUILD_ID", "utf8")).trim();
const staticFiles = await listFiles(".next/static");
const precacheUrls = [
  "/", "/manifest.webmanifest", "/icons/apple-touch-icon.png",
  "/icons/icon-192.png", "/icons/icon-512.png",
  ...staticFiles.filter((file) => !file.endsWith(".map"))
    .map((file) => `/_next/static/${path.relative(".next/static", file).split(path.sep).join("/")}`),
];
const template = await readFile("pwa/service-worker.js", "utf8");
await writeFile("public/sw.js", template.replace("__PIRATES_BUILD__", JSON.stringify({
  cacheName: `pirates-${buildId}`, precacheUrls,
})));
console.log(`Generated service worker with ${precacheUrls.length} offline resources.`);
