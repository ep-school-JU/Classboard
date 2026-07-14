/**
 * @fileoverview Service Worker pour le fonctionnement 100% hors-ligne de ClassBoard.
 */

const CACHE_NAME = 'classboard-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/layout.css',
  './css/variables.css',
  './js/app.js',
  './js/dashboard.js',
  './js/storage.js',
  './js/audio.js',
  './js/components/base-widget.js',
  './js/components/clock-widget.js',
  './js/components/sound-widget.js',
  './js/components/timer-widget.js',
  './js/components/schedule-widget.js',
  './js/components/homework-widget.js',
  './js/components/noise-widget.js',
  './js/components/random-widget.js',
  './js/components/team-builder-widget.js',
  './js/components/score-widget.js',
  './assets/sounds/silence.mp3',
  './assets/sounds/buzzer.mp3',
  './assets/sounds/rangement.mp3',
  './assets/sounds/retour.mp3'
];

// Phase d'installation : on met tous les fichiers essentiels en cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Mise en cache des ressources globales');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Phase d'activation : on nettoie les anciens caches s'il y a une mise à jour
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stratégie d'interception : Cache-First (vitesse maximale)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});