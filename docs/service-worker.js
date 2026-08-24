// AKSI v1.2.0 · PWA — cache rangka statik sahaja, bukan data murid/API.
const CACHE_VERSION = 'aksi-shell-v1.2.0-20260824-6';
const OFFLINE_URL = './offline.html';
const APP_SHELL = [
  './',
  './index.html',
  './dashboard.html',
  './keahlian.html',
  './kehadiran.html',
  './laporan.html',
  './pencapaian.html',
  './penilaian.html',
  './senarai.html',
  './admin.html',
  './setup.html',
  OFFLINE_URL,
  './manifest.webmanifest',
  './manifest.webmanifest?v=1.2.0',
  './css/style.css?v=20260824-6',
  './js/config.js?v=20260824-6',
  './js/api.js?v=20260824-6',
  './js/app.js?v=20260824-6',
  './js/pwa.js?v=20260824-6',
  './icons/aksi-192.png',
  './icons/aksi-512.png',
  './icons/aksi-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/apple-touch-icon.png?v=1.2.0',
  './icons/favicon-32.png',
  './icons/favicon-32.png?v=1.2.0',
  './icons/favicon-48.png',
  './icons/favicon-48.png?v=1.2.0'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (cache) { return cache.addAll(APP_SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          if (key !== CACHE_VERSION && key.indexOf('aksi-shell-') === 0) {
            return caches.delete(key);
          }
          return null;
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url = new URL(request.url);

  // API Apps Script, token dan data sekolah tidak pernah melalui cache PWA.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(function () {
        return caches.match(request, { ignoreSearch: true }).then(function (cached) {
          return cached || caches.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request);
    })
  );
});
