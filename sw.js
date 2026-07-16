/**
 * @fileoverview Service Worker pour ClassBoard - Gestion du fonctionnement hors-ligne (PWA).
 */

const CACHE_NAME = 'classboard-v3'; // On passe de v2 à v3 pour forcer la mise à jour

// Liste complète et mise à jour de toutes les ressources de l'application
const ASSETS_TO_CACHE = [
  './',
  './index.html',
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
  './audio/silence.mp3',
  './audio/buzzer.mp3',
  './audio/rangement.mp3',
  './audio/retour.mp3',
  './audio/tirage.mp3' // Intégration de votre nouveau son de tirage
];

// Événement d'installation : on met tout en cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker : Mise en cache des ressources globales');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Événement d'activation : on nettoie les anciens caches obsolètes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker : Suppression de l\'ancien cache obsolète', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de Fetch : "Cache-First" (priorité au cache pour l'ultra-rapidité et le hors-ligne)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Optionnel : On peut mettre en cache à la volée les nouvelles requêtes réussies (ex: polices)
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Si le réseau et le cache échouent (ex: hors-ligne total sur une ressource non-mise en cache)
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});