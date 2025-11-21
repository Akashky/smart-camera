// Service Worker for Smart Camera
// Handles caching and WASM module delivery

const CACHE_NAME = 'smart-camera-v1';
const WASM_CACHE = 'smart-camera-wasm-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== WASM_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Handle WASM files with special caching
  if (request.url.includes('.wasm') || request.url.includes('wasm_bin.js')) {
    event.respondWith(
      caches.open(WASM_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          // Always fetch fresh WASM on hard refresh
          const fetchPromise = fetch(request)
            .then((response) => {
              // Cache successful responses
              if (response && response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch((err) => {
              console.error('[SW] Fetch error for WASM:', err);
              // Return cached version if fetch fails
              return cachedResponse || new Response('Failed to load WASM', { status: 503 });
            });

          // For hard refresh (Ctrl+Shift+R), skip cache
          if (request.cache === 'no-store' || request.cache === 'reload') {
            return fetchPromise;
          }

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Default strategy: network first, fall back to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return caches.match(request);
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request).catch(() => {
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
