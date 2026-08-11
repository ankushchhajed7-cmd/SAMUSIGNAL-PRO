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

const VERSION = '8.6.3';
const CACHE   = 'samusignal-pro-v' + VERSION.replace(/\./g, '-');

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './favicon.png',
  './404.html',
  './privacy.html',
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

  /* config.js decides trial length and which licence server to use.
     It must always come from the network, never from a cache: a stale copy
     silently changes licensing behaviour and is very hard to diagnose. */
  if (/(^|\/)config\.js$/.test(url.pathname)) return;

  /* Pages that must never be touched by the worker. The admin console and
     the setup wizard have to reflect the live files, and must never fall
     back to the app shell — doing so made a missing admin page silently
     open the app instead, which was very confusing to debug. */
  if (/(^|\/)(admin[^\/]*|setup)\.html$/i.test(url.pathname)) return;

  /* navigations + HTML: network first */
  const isDoc = req.mode === 'navigate' ||
                (req.headers.get('accept') || '').includes('text/html');

  if (isDoc) {
    /* Only the app itself may fall back to the cached shell. */
    const isApp = /(^|\/)(index\.html)?$/.test(url.pathname);

    e.respondWith((async () => {
      try {
        const pre = await e.preloadResponse;
        const net = pre || await fetch(req, { cache: 'no-store' });
        if (net && net.ok && isApp) {
          const c = await caches.open(CACHE);
          c.put('./index.html', net.clone());
        }
        /* a 404 or 500 is real information — pass it straight through */
        return net;
      } catch (err) {
        const c = await caches.open(CACHE);
        const exact = await c.match(req);
        if (exact) return exact;
        if (isApp) {
          const shell = await c.match('./index.html');
          if (shell) return shell;
        }
        return new Response(
          '<!DOCTYPE html><meta charset="utf-8">' +
          '<body style="background:#03100e;color:#a8f0d4;font-family:monospace;' +
          'padding:40px 20px;text-align:center">' +
          '<h2 style="color:#3fc9ab;letter-spacing:2px">OFFLINE</h2>' +
          '<p>This page is not available without a connection.</p>' +
          '<p><a style="color:#3fc9ab" href="./index.html">Open the app</a></p>',
          { status: 503, headers: { 'Content-Type': 'text/html' } }
        );
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
