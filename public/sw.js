/**
 * BestCyniX Dev - Service Worker (PWA & Offline Cache Engine)
 */

const CACHE_NAME = 'bestcynix-cache-v20260826_06';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/shared-ui.js',
  '/js/main.js',
  '/js/protection.js',
  '/assets/photo/bcxlogo2.png',
  '/assets/photo/bestcynixprodev.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. Only intercept same-origin GET requests (Do NOT intercept external APIs like skylinebot.xyz, lanyard, japi, googleapis)
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // 2. Pass Firebase and dynamic API endpoints directly
  if (
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('identitytoolkit.googleapis.com')
  ) {
    return;
  }

  // 3. Network First with Cache Fallback for same-origin assets
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.headers.get('accept')?.includes('text/html')) {
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
        }
        return new Response('', { status: 408, statusText: 'Network Error' });
      })
  );
});

// Push & Notification Click Handlers
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (targetUrl && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'BestCyniX Dev Alert', message: event.data.text() };
    }
  }

  const title = data.title || '⚡ BestCyniX Dev Notification';
  const options = {
    body: data.message || 'มีการอัปเดตใหม่ในระบบ',
    icon: '/assets/photo/bcxlogo2.png',
    badge: '/assets/photo/bcxlogo2.png',
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

