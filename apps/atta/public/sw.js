// Service Worker para Vite - Atta
const CACHE_VERSION = 'v2';
const CACHE_PREFIX = 'atta-cache-';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

// Precache mínimo: shell
const PRECACHE_URLS = [
  '/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Estrategia: cache-first para assets, network-first para navegación
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorar API
  if (request.url.includes('/api/') || request.url.includes('api.attadia.com')) {
    return;
  }

  // Assets de Vite (hash) => cache first
  if (request.destination === 'script' || request.destination === 'style' || request.url.includes('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Navegación => network first con fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
  }
});
