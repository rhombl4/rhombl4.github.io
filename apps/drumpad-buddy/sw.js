const CACHE_NAME = 'drumpad-v12';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'css/styles.css',
  'css/styles.css?v=10',
  'js/app.js',
  'js/audio.js',
  'js/exercises.js',
  'js/timer.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      // 1. If cache hit, return cached version immediately (works 100% offline!)
      if (cachedResponse) {
        // Fetch fresh copy in the background to update cache (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {
          // Silent offline catch
        });
        return cachedResponse;
      }

      // 2. Otherwise fetch from network and cache for next time
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // 3. Fallback when completely offline
        if (event.request.mode === 'navigate') {
          return caches.match('./').then((res) => res || caches.match('index.html'));
        }
      });
    })
  );
});
