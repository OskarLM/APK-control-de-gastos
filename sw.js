const CACHE_NAME = 'gastos-oj-v3.18';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Instalación y almacenamiento en caché
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Estrategia: Primero Red, si falla, Caché
self.addEventListener('fetch', (evt) => {
  evt.respondWith(
    fetch(evt.request).catch(() => {
      return caches.match(evt.request);
    })
  );
});
