Service Worker patch for Goolaxy
==================================

Files included:
- main.js                (updated; use in place of your existing main.js or merge changes)
- service-worker.js      (place at site root: /service-worker.js)
- offline.png            (tiny fallback image)
- README.md              (this file)

Instructions
------------
1. Put `service-worker.js` at the site root (same origin). If you host via GitHub Pages or Netlify,
   ensure the file is included in the publish directory (`/`).

2. Replace or merge your `main.js` with the provided `main.js`. It:
   - registers the service worker,
   - loads `scene.gltf` (tries several common paths),
   - collects image URLs from the GLTF and sends them to the service worker for precaching,
   - keeps your hover/click interaction behavior.

3. Make sure `offline.png` is at site root (used as fallback for images).

4. Service worker only works on HTTPS (or localhost). After deployment, visit your site,
   open DevTools > Application > Service Workers to confirm registration.

5. If you change assets and want clients to update, update `CACHE_NAME` in service-worker.js
   (e.g. 'goolaxy-cache-v2') or implement an update flow.

Notes
-----
- If your glTF's materials use relative paths for textures, ensure those textures are publicly accessible.
- If you prefer runtime caching strategies or Workbox, consider migrating later.

