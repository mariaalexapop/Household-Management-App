// Minimal service worker for PWA installability.
// No caching strategy -- app requires network connectivity.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // Network-only: no caching, no offline support.
  // This handler satisfies browser installability checks.
})
