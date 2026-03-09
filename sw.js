const CACHE_NAME = 'v1_cache_miapp';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './styles.css', // Añade aquí tus archivos .css si tienes
  './script.js',  // Añade aquí tus archivos .js si tienes
  './icono-192.png',
  './icono-512.png'
];

// Instalación: Guarda los archivos en el caché
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación: Limpia cachés antiguos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Estrategia: Intenta red, si falla usa el caché
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
