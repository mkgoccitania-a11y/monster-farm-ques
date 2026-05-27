/**
 * Service Worker — Monster Farm Quest
 * - Network-first pour les pages HTML (fraîcheur du contenu en dev)
 * - Cache-first pour les assets statiques (sprites, icônes, polices)
 * - Fallback offline minimal sur la home
 */

const VERSION = "mfq-v1";
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

// Routes / assets précachés au moment de l'install
const PRECACHE_URLS = [
  "/",
  "/farm",
  "/battle",
  "/train",
  "/pokedex",
  "/manifest.json",
  "/icon-192.webp",
  "/icon-512.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        // addAll est strict : si UNE seule URL échoue, tout est annulé.
        // On essaie chaque URL individuellement pour la robustesse en dev.
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch(() => {
              // Silencieusement ignorer les erreurs (ex: page non encore compilée en dev)
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

const isStaticAsset = (url) => {
  const path = new URL(url).pathname;
  return (
    path.startsWith("/_next/static/") ||
    path.startsWith("/sprites/") ||
    path.startsWith("/icon-") ||
    path === "/manifest.json" ||
    /\.(?:woff2?|webp|jpg|jpeg|png|svg|css|js)$/.test(path)
  );
};

const isNavigationRequest = (request) =>
  request.mode === "navigate" || (request.method === "GET" && request.headers.get("accept")?.includes("text/html"));

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Stratégie pour navigation HTML : network-first + fallback cache
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Cache-first pour les assets statiques
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
