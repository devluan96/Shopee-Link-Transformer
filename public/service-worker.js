const CACHE_NAME = "hotsnew-click-v4";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/logo-app-192.png",
  "/logo-app-512.png",
];

const DOWNLOAD_PATH_PATTERN =
  /^\/downloads\/.+\.(exe|zip|msi|dmg|pkg|AppImage|deb|rpm|yml|blockmap)$/i;
const DIRECT_NETWORK_PATH_PATTERN =
  /^\/(?:api\/|sitemap\.xml$|robots\.txt$|manifest\.webmanifest$|favicon\.ico$|assets\/)/i;
const DIRECT_NETWORK_FILE_PATTERN =
  /\.(?:xml|txt|json|ico|png|jpg|jpeg|svg|webp|gif|map)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (
    DIRECT_NETWORK_PATH_PATTERN.test(url.pathname) ||
    DIRECT_NETWORK_FILE_PATTERN.test(url.pathname)
  ) {
    event.respondWith(fetch(request));
    return;
  }

  if (DOWNLOAD_PATH_PATTERN.test(url.pathname)) {
    event.respondWith(fetch(request));
    return;
  }

  const acceptHeader = request.headers.get("accept") || "";
  const isHtmlNavigation =
    request.mode === "navigate" && acceptHeader.includes("text/html");

  if (isHtmlNavigation) {
    event.respondWith(
      fetch(request).catch(() => caches.match("/")),
    );
    return;
  }

  if (
    url.pathname.startsWith("/assets/") ||
    request.destination === "script" ||
    request.destination === "style"
  ) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const contentType = networkResponse.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return networkResponse;
      });
    }),
  );
});
