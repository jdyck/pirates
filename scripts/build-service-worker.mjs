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
const manifest = JSON.parse(await readFile("public/manifest.webmanifest", "utf8"));
const touchAndFaviconFiles = (await readdir("public/icons"))
  .filter((filename) => /^(apple-touch-icon-|favicon-).*\.png$/.test(filename));
const precacheUrls = [
  "/", "/manifest.webmanifest", "/favicon.ico", "/apple-touch-icon.png",
  ...manifest.icons.map((icon) => icon.src),
  ...touchAndFaviconFiles.map((filename) => `/icons/${filename}`),
  ...staticFiles.filter((file) => !file.endsWith(".map"))
    .map((file) => `/_next/static/${path.relative(".next/static", file).split(path.sep).join("/")}`),
];
const template = await readFile("pwa/service-worker.js", "utf8");
await writeFile("public/sw.js", template.replace("__PIRATES_BUILD__", JSON.stringify({
  cacheName: `pirates-${buildId}`, precacheUrls,
})));
console.log(`Generated service worker with ${precacheUrls.length} offline resources.`);
