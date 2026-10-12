// The build script injects a version and the complete production asset list.
const { cacheName, precacheUrls } = __PIRATES_BUILD__;
const assets = new Set(precacheUrls);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(precacheUrls.map((url) => new Request(url, { cache: "reload" })));
    // Let existing games finish before a new worker replaces their assets.
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("pirates-") && key !== cacheName)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate" && url.pathname === "/") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) return response;
      } catch {
        // Reopen the fully cached game when the server cannot be reached.
      }
      const cache = await caches.open(cacheName);
      return cache.match("/");
    })());
    return;
  }

  // Never treat Next.js RSC responses or unrelated routes as the HTML shell.
  if (url.pathname !== "/" && !url.search && assets.has(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      return (await cache.match(request)) || fetch(request);
    })());
  }
});
