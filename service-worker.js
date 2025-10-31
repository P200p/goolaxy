// service-worker.js
const CACHE_NAME = 'goolaxy-cache-v1';
const PRECACHE_URLS = [
  '/',             // ปรับเป็น path ที่ต้องการ precache
  '/index.html',
  '/offline.png'   // สำรองกรณีรูปไม่โหลด (ใส่ไฟล์นี้ไว้ใน public)
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

// Message API: รับคำสั่งจากหน้าเว็บเพื่อ precache URLs แบบไดนามิก
self.addEventListener('message', event => {
  const msg = event.data;
  if (!msg || !msg.type) return;
  if (msg.type === 'CACHE_URLS' && Array.isArray(msg.urls)) {
    caches.open(CACHE_NAME).then(async cache => {
      const unique = Array.from(new Set(msg.urls)).filter(Boolean);
      for (const url of unique) {
        try {
          // ใช้ fetch เพื่อเก็บลง cache (skip ถ้ามีแล้ว)
          const match = await cache.match(url);
          if (!match) await cache.add(url);
        } catch (err) {
          // ถ้า fetch ล้มเหลว ข้ามไป
          console.warn('SW: failed to cache', url, err);
        }
      }
      // (ตัวเลือก) ตัด cache ให้ไม่เกิน N ไฟล์ (ลบเก่า)
      const MAX_IMAGES = 200;
      const keys = await cache.keys();
      if (keys.length > MAX_IMAGES) {
        // ลบรายการแรก ๆ จนเหลือขนาดที่ต้องการ
        const removeCount = keys.length - MAX_IMAGES;
        for (let i = 0; i < removeCount; i++) {
          await cache.delete(keys[i].url);
        }
      }
    });
  }
});

// Fetch handler: cache-first สำหรับรูป, สำหรับอื่นใช้ network-first (ปรับได้)
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // เฉพาะภาพ (jpg/png/webp/svg/gltf/glb) ให้ cache-first
  if (req.destination === 'image' || /\.(png|jpg|jpeg|webp|gif|svg|glb|gltf)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const resp = await fetch(req);
          // เก็บเฉพาะ response.ok
          if (resp && resp.ok) cache.put(req, resp.clone());
          return resp;
        } catch (err) {
          // fallback to offline image
          const fallback = await cache.match('/offline.png');
          if (fallback) return fallback;
          return new Response(null, { status: 504, statusText: 'Offline' });
        }
      })
    );
    return;
  }

  // สำหรับ request อื่น: network-first, ถ้าล้ม fallback to cache
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
