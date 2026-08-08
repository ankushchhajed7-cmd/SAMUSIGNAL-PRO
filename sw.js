/* ==================================================================
   SamuSignal Pro — service worker
   --------------------------------------------------------------
   Strategy:
     • index.html  -> network first, cache as fallback.
       This is deliberate: if a bad build ever ships, the next
       online load always fetches fresh HTML and can recover.
     • static assets (icons, manifest) -> cache first.
     • API calls (TwelveData, Gemini, Telegram, ForexFactory)
       -> never cached, always straight to the network.
   ================================================================== */

const VERSION = '8.1.0';
const CACHE   = 'samusignal-pro-v' + VERSION.replace(/\./g, '-');

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './config.js',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './favicon.png',
  './404.html',
  './privacy.html',
  './guide-en.pdf',
  './guide-hi.pdf',
  './pay-qr.png'
];

/* Hosts we must never serve from cache — stale prices are worse than none. */
const NO_CACHE_HOSTS = [
  'api.twelvedata.com',
  'generativelanguage.googleapis.com',
  'api.telegram.org',
  'nfs.faireconomy.media',
  'cdn-nfs.faireconomy.media',
  's.tradingview.com',
  'www.tradingview.com',
  'api.allorigins.win',
  'corsproxy.io',
  'r.jina.ai'
];

/* ---------------- install ---------------- */
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    /* addAll fails the whole install if one file 404s, so add individually */
    await Promise.all(SHELL.map(u => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

/* ---------------- activate: drop every older cache ---------------- */
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k !== CACHE) await caches.delete(k);
    }
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (err) {}
    }
    await self.clients.claim();
  })());
});

/* ---------------- allow the page to force an update ---------------- */
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

/* ---------------- fetch ---------------- */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (!url.protocol.startsWith('http')) return;

  /* live data: straight through, never touch the cache */
  if (NO_CACHE_HOSTS.some(h => url.hostname.endsWith(h))) return;

  /* cross-origin (fonts, CDNs): let the browser handle it */
  if (url.origin !== self.location.origin) return;

  /* navigations + HTML: network first */
  const isDoc = req.mode === 'navigate' ||
                (req.headers.get('accept') || '').includes('text/html');

  if (isDoc) {
    e.respondWith((async () => {
      try {
        const pre = await e.preloadResponse;
        const net = pre || await fetch(req, { cache: 'no-store' });
        if (net && net.ok) {
          const c = await caches.open(CACHE);
          c.put('./index.html', net.clone());
        }
        return net;
      } catch (err) {
        const c = await caches.open(CACHE);
        return (await c.match(req)) ||
               (await c.match('./index.html')) ||
               (await c.match('./404.html')) ||
               new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  /* everything else same-origin: cache first, refresh in background */
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req);
    if (hit) {
      fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); }).catch(() => {});
      return hit;
    }
    try {
      const net = await fetch(req);
      if (net && net.ok && net.type === 'basic') c.put(req, net.clone());
      return net;
    } catch (err) {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
