/**
 * SaltDistribute - Progressive Web App (PWA) & Geolocation Service Worker
 * Manages background location synchronization, offline Leaflet asset caching,
 * and background messaging across web clients.
 */

const CACHE_NAME = 'saltdistribute-pwa-v1';
const OFFLINE_URL = '/';

const PRECACHE_RESOURCES = [
  '/',
  '/manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css',
];

// In-memory background location store in Service Worker context
let cachedLocationData = null;
let pendingSyncQueue = [];

// 1. Install Event - Pre-cache core shell & Leaflet CDN
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_RESOURCES).catch((err) => {
        console.warn('[SW] Pre-cache non-fatal error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event - Clean up stale caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event - Stale-while-revalidate for Leaflet & static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Allow Firebase and Nominatim geocoding API to bypass service worker cache
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('nominatim.openstreetmap.org')
  ) {
    return;
  }

  // Cache strategy for Leaflet & font assets
  if (
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);
      })
    );
    return;
  }

  // Network-first with offline fallback for navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  }
});

// 4. Background Sync API for queued location broadcasts
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-buyer-location') {
    event.waitUntil(
      (async () => {
        console.log('[SW] Processing Background Sync for location telemetry...');
        if (pendingSyncQueue.length > 0) {
          const payload = pendingSyncQueue.shift();
          // Broadcast to all active client windows
          const allClients = await self.clients.matchAll({ includeUncontrolled: true });
          for (const client of allClients) {
            client.postMessage({
              type: 'BACKGROUND_LOCATION_SYNC_SUCCESS',
              data: payload,
            });
          }
        }
      })()
    );
  }
});

// 5. Client Message Channel for real-time telemetry caching
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case 'STORE_LOCATION':
      cachedLocationData = {
        ...data,
        timestamp: Date.now(),
      };
      // Acknowledge receipt
      if (event.source && event.source.postMessage) {
        event.source.postMessage({
          type: 'LOCATION_STORED_ACK',
          cachedAt: cachedLocationData.timestamp,
        });
      }
      break;

    case 'QUEUE_LOCATION_SYNC':
      pendingSyncQueue.push(data);
      if (self.registration.sync) {
        self.registration.sync.register('sync-buyer-location').catch((err) => {
          console.warn('[SW] Background Sync registration error:', err);
        });
      }
      break;

    case 'GET_LAST_LOCATION':
      if (event.source && event.source.postMessage) {
        event.source.postMessage({
          type: 'LAST_LOCATION_RESULT',
          data: cachedLocationData,
        });
      }
      break;

    default:
      break;
  }
});

// 6. Generic Web Push Event Handler
self.addEventListener('push', (event) => {
  let payload = { title: 'SaltDistribute Notification', body: 'Ada pembaruan status pesanan garam Anda.' };
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      payload.body = event.data.text();
    }
  }

  const title = payload.title || payload.notification?.title || 'SaltDistribute';
  const options = {
    body: payload.body || payload.notification?.body || 'Pembaruan pesanan terbaru.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 7. Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
