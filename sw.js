/* MotorNote offline application shell and runtime dependency cache. */
const VERSION = 'motornote-pwa-v1';
const SHELL_CACHE = VERSION + '-shell';
const RUNTIME_CACHE = VERSION + '-runtime';
const BASE = self.registration.scope;
const SHELL = [
  new URL('./', BASE).href,
  new URL('./index.html', BASE).href,
  new URL('./manifest.webmanifest', BASE).href,
  new URL('./icons/motornote-icon.svg', BASE).href
];
const RUNTIME = [
  'https://unpkg.com/@tailwindcss/browser@4',
  'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap',
  'https://cdn.jsdelivr.net/npm/surrealdb@1.3.2/+esm',
  'https://cdn.jsdelivr.net/npm/@surrealdb/wasm@1.4.1/+esm',
  'https://esm.sh/surrealdb@1.3.2',
  'https://esm.sh/@surrealdb/wasm@1.4.1'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    await shell.addAll(SHELL);
    const runtime = await caches.open(RUNTIME_CACHE);
    await Promise.all(RUNTIME.map(async url => {
      try {
        let req = new Request(url, { mode: 'cors', cache: 'reload' });
        let response;
        try { response = await fetch(req); }
        catch (_) {
          req = new Request(url, { mode: 'no-cors', cache: 'reload' });
          response = await fetch(req);
        }
        if (response && (response.ok || response.type === 'opaque')) {
          await runtime.put(req, response.clone());
        }
      } catch (error) {
        // A CDN outage must not prevent the local app shell from installing.
        console.warn('[MotorNote SW] Runtime warm-up skipped:', url, error);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith('motornote-pwa-') && k !== SHELL_CACHE && k !== RUNTIME_CACHE)
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(req);
        const cache = await caches.open(SHELL_CACHE);
        cache.put(new URL('./index.html', BASE).href, response.clone()).catch(() => {});
        return response;
      } catch (_) {
        return (await caches.match(req)) ||
          (await caches.match(new URL('./index.html', BASE).href)) || Response.error();
      }
    })());
    return;
  }
  if (url.origin !== self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const response = await fetch(req);
        if (response && (response.ok || response.type === 'opaque')) {
          cache.put(req, response.clone()).catch(() => {});
        }
        return response;
      } catch (_) { return hit || Response.error(); }
    })());
    return;
  }
  const scopePath = new URL('./', BASE).pathname;
  if (url.pathname.startsWith(scopePath)) {
    event.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      try {
        const response = await fetch(req);
        if (response && response.ok) {
          (await caches.open(SHELL_CACHE)).put(req, response.clone()).catch(() => {});
        }
        return response;
      } catch (_) { return Response.error(); }
    })());
  }
});
