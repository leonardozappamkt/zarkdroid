/* Zarkdroid service worker: lets the app open and be studied without a connection.
 * - Hashed build files and images: cache first (they never change for a given URL).
 * - Pages: network first, falling back to the last copy seen. Always fresh when online.
 * - Anything cross-origin (Supabase, Storage) and /api are never touched. */
const VERSION = 'v1';
const STATIC_CACHE = `zd-static-${VERSION}`;
const PAGE_CACHE = `zd-pages-${VERSION}`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

const isStatic = (url) =>
  url.pathname.startsWith('/_next/static/') || /\.(?:png|svg|ico|wasm|woff2?|webmanifest)$/.test(url.pathname);

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.well-known/') || url.pathname.startsWith('/oauth/')) return;

  if (isStatic(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);
      try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') cache.put(request, response.clone());
        return response;
      } catch {
        const cached = (await cache.match(request)) || (request.mode === 'navigate' ? await cache.match('/') : undefined);
        if (cached) return cached;
        throw new Error('offline');
      }
    })(),
  );
});
