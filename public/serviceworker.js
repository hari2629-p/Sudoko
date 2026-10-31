const CACHE_NAME = "sudoku-offline-v4";
const APP_FILES = ["./", "./index.html", "./script.js"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(cacheName =>
            cacheName.startsWith("sudoku-offline-") && cacheName !== CACHE_NAME
          )
          .map(cacheName => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isFontAwesome = requestUrl.origin === "https://cdnjs.cloudflare.com";

  if (request.method !== "GET" || (!isSameOrigin && !isFontAwesome)) {
    return;
  }

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && (response.type === "basic" || response.type === "cors")) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      if (request.mode === "navigate") {
        const appShell = new URL("./index.html", self.registration.scope);
        const fallback = await caches.match(appShell.href);
        if (fallback) {
          return fallback;
        }
      }

      throw error;
    }
  })());
});