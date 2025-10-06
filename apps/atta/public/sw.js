// Service Worker básico para Atta
const CACHE_NAME = 'atta-cache-v1';
const urlsToCache = [
  '',
  '/static/js/bundle.js',
  '/static/css/main.css',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // No interceptar peticiones a la API del backend
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('localhost:5000') ||
      event.request.url.includes('api.attadia.com')) {
    return; // Dejar que la petición pase sin interceptar
  }
  
  // Solo cachear recursos estáticos
  try {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) return response;
        return fetch(event.request);
      })
    );
  } catch (e) {
    // Evitar lanzar errores del SW en consola
  }
});
