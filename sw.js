// Big Daddyville Service Worker
// !! Bump this version number every time you upload a new index.html !!
const CACHE_VERSION = 'v5';
const CACHE_NAME = 'big-daddyville-' + CACHE_VERSION;

const FILES_TO_CACHE = [
  '/big-daddyville/',
  '/big-daddyville/index.html',
  '/big-daddyville/manifest.json',
  '/big-daddyville/icon-192.png',
  '/big-daddyville/icon-512.png'
];

// Install — cache everything fresh
self.addEventListener('install', event => {
  console.log('[SW] Installing version', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Force this new SW to activate immediately, don't wait
  self.skipWaiting();
});

// Activate — delete ALL old caches immediately
self.addEventListener('activate', event => {
  console.log('[SW] Activating version', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

// Fetch — network first, fall back to cache
// Network-first means you always get the latest version when online
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Got a fresh response — update the cache
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed — serve from cache (offline mode)
        return caches.match(event.request)
          .then(cached => cached || caches.match('/big-daddyville/index.html'));
      })
  );
});
