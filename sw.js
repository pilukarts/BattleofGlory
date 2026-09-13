/**
 * Service Worker para Battle of Glory.
 * Usa rutas relativas para funcionar dentro de GitHub Pages.
 */

const CACHE_NAME = 'battle-of-glory-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './favicon.svg',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      });

      return cached || network;
    }).catch(() => {
      if (event.request.mode === 'navigate') return caches.match('./index.html');
      return undefined;
    })
  );
});
