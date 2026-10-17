const CACHE_NAME = "monocode-v1.0.0";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/icon.svg",
  "./css/main.css",
  "./js/app.js",
  "./js/storage.js",
  "./js/templates.js",
  "./js/file-tree.js",
  "./js/editor.js",
  "./js/runner.js",
  "./js/shortcuts.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // 僅處理 http/https 請求
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // 如果是 CDN 或應用內部資源，進行動態快取
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (event.request.url.includes("cdnjs.cloudflare.com") || event.request.url.startsWith(self.location.origin))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 斷網降級
        if (event.request.destination === "document") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
