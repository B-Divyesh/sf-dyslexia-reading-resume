// scripts/build.mjs replaces this token with a hash of each deployed site file.
// That makes a changed release use a fresh cache while activation removes stale
// versions from prior releases.
const CACHE = 'reading-resume-__BUILD_VERSION__';
const SHELL = ['/', '/demo/', '/privacy/', '/terms/', '/404.html', '/images/reading-coordinate-800.webp', '/fonts/atkinson-hyperlegible-regular.ttf'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys()
  .then((keys) => Promise.all(keys.filter((key) => key.startsWith('reading-resume-') && key !== CACHE).map((key) => caches.delete(key))))
  .then(() => self.clients.claim())));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/'))));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  })));
});
