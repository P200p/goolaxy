// service-worker.js
const CACHE_NAME = 'goolaxy-cache-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  const msg = event.data;
  if (!msg || !msg.type) return;
  if (msg.type === 'CACHE_URLS' && Array.isArray(msg.urls)) {
    caches.open(CACHE_NAME).then(async cache => {
      const unique = Array.from(new Set(msg.urls)).filter(Boolean);
      for (const url of unique) {
        try {
          const match = await cache.match(url);
          if (!match) await cache.add(url);
        } catch (err) {
          console.warn('SW: failed to cache', url, err);
        }
      }
      const MAX_IMAGES = 200;
      const keys = await cache.keys();
      if (keys.length > MAX_IMAGES) {
        const removeCount = keys.length - MAX_IMAGES;
        for (let i = 0; i < removeCount; i++) {
          await cache.delete(keys[i].url);
        }
      }
    });
  }
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.destination === 'image' || /\.(png|jpg|jpeg|webp|gif|svg|glb|gltf)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const resp = await fetch(req);
          if (resp && resp.ok) cache.put(req, resp.clone());
          return resp;
        } catch (err) {
          const fallback = await cache.match('/offline.png');
          if (fallback) return fallback;
          return new Response(null, { status: 504, statusText: 'Offline' });
        }
      })
    );
    return;
  }

  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
