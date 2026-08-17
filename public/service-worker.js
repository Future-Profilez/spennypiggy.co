// Import workbox from CDN for better compatibility
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

if (workbox) {
  console.log('🎉 Workbox is loaded');
} else {
  console.log('❌ Workbox failed to load');
}

const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
const { registerRoute } = workbox.routing;
const { StaleWhileRevalidate, CacheFirst, NetworkFirst, NetworkOnly } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { BackgroundSyncPlugin } = workbox.backgroundSync;

// Precache and route - Workbox will inject the manifest
precacheAndRoute([{"revision":"df17ab0ab54a974e5fc2a78831d9665c","url":"offline.html"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"02b4bea156577a802c499068e6a8853c","url":"favicon-96x96.png"},{"revision":"7019d0bfc63142b7af964be6e3852f12","url":"favicon-48x48.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"572fa2209a70334c1c065837fe522dc2","url":"favicon-192x192.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"}]);

// Clean up old caches
cleanupOutdatedCaches();

// ================================================================
// CACHING STRATEGIES
// ================================================================

// 1. STATIC ASSETS - Cache First with long expiration
//
// ⚠️ `statuses` MUST NOT include 0 here. A status-0 entry is an OPAQUE
// cross-origin response, and an opaque response can never be executed as a
// script or applied as a stylesheet. Cached under CacheFirst it is replayed on
// every later request, so ONE opaque fetch of a chunk (a captive-portal
// interception, a CDN blip) permanently blanks the app for that user until they
// clear site data. Opaque bodies are also billed to quota at ~7MB each, which
// pushes the origin over its budget and gets the whole cache evicted.
//
// ⚠️ `maxEntries` must comfortably exceed the chunk count (399 JS files at the
// time of writing). At 60 the LRU evicted almost every chunk on every page
// load, so the cache did nothing but thrash — and each eviction is a re-fetch
// on resume, which is exactly the memory spike this file is trying to avoid.
registerRoute(
  ({ request }) => request.destination === 'style' ||
                   request.destination === 'script' ||
                   request.destination === 'worker',
  new CacheFirst({
    cacheName: 'static-assets-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        maxEntries: 500,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// 2. IMAGES - Cache First with image optimization
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        maxEntries: 100,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// 3. FONTS - Cache First with long expiration
registerRoute(
  ({ url }) => url.origin === self.location.origin && 
               (url.pathname.endsWith('.woff') || 
                url.pathname.endsWith('.woff2') || 
                url.pathname.endsWith('.ttf') || 
                url.pathname.endsWith('.otf')),
  new CacheFirst({
    cacheName: 'fonts-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        maxEntries: 30,
      }),
    ],
  })
);

// 4. API RESPONSES - Network First with background sync
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') || 
               url.pathname.startsWith('/graphql'),
  new NetworkFirst({
    cacheName: 'api-cache-v1',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 5 * 60, // 5 minutes
        maxEntries: 50,
      }),
    ],
  })
);

// 5. HTML PAGES - Network First, cache only as the offline fallback
//
// 🚨 THIS MUST NOT BE StaleWhileRevalidate. An HTML document names the hashed
// build chunks that boot the app, so a cached document is only valid for as
// long as those exact chunk filenames exist. SWR answered every navigation from
// cache first for a FULL DAY, so after any deploy an installed PWA booted an old
// document, asked for chunks that were gone, and rendered nothing. `app.jsx`
// listens for `vite:preloadError` and reloads — but the reload was served the
// SAME dead document out of `pages-v1`, and its 60s cooldown then suppressed
// every further attempt. The user was left on a blank screen no reload could
// fix. That is the crash reported on 14 Aug 2026 (screenshot → background →
// resume): iOS relaunches the webview, and the relaunch replayed the wedge.
//
// NetworkFirst with a short timeout keeps offline working (the cached copy is
// still served when the network fails) while guaranteeing that a reachable
// network always wins. `statuses` excludes 0 for the reason given above — an
// opaque document is an unbootable one.
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-v1',
    networkTimeoutSeconds: 4,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
        maxEntries: 50,
      }),
    ],
  })
);

// 6. GOOGLE FONTS - Stale While Revalidate
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' ||
               url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        maxEntries: 30,
      }),
    ],
  })
);

// 7. CDN ASSETS - Cache First
registerRoute(
  ({ url }) => url.origin === 'https://cdn.jsdelivr.net' ||
               url.origin === 'https://cdnjs.cloudflare.com' ||
               url.origin === 'https://unpkg.com',
  new CacheFirst({
    cacheName: 'cdn-assets-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        maxEntries: 50,
      }),
    ],
  })
);

// ================================================================
// BACKGROUND SYNC
// ================================================================

// Background sync for failed API requests
const bgSyncPlugin = new BackgroundSyncPlugin('api-sync', {
  maxRetentionTime: 24 * 60, // 24 hours
});

// Register background sync for POST/PUT/PATCH requests
registerRoute(
  ({ url, request }) => {
    return url.pathname.startsWith('/api/') && 
           (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH');
  },
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

registerRoute(
  ({ url, request }) => {
    return url.pathname.startsWith('/api/') && 
           (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH');
  },
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'PUT'
);

registerRoute(
  ({ url, request }) => {
    return url.pathname.startsWith('/api/') && 
           (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH');
  },
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'PATCH'
);

// ================================================================
// OFFLINE SUPPORT
// ================================================================

// Catch-all for navigation requests when offline.
//
// ⚠️ This MUST be `setCatchHandler`, not a second `registerRoute` for
// `request.mode === 'navigate'`. Workbox matches routes in registration order
// and the FIRST match wins, so the HTML route above already answered every
// navigation and this block was unreachable — `offline.html` had never been
// served to anyone. The catch handler runs when a route's handler throws, which
// is the case it was written for.
workbox.routing.setCatchHandler(async ({ request }) => {
  if (request.destination !== 'document') {
    return Response.error();
  }

  const { matchPrecache } = workbox.precaching;

  return (await matchPrecache('/offline.html')) ||
         (await caches.match('/offline.html')) ||
         Response.error();
});

// ================================================================
// PUSH NOTIFICATIONS
// ================================================================

self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'No payload',
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/images/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/icons/xmark.png'
      },
    ]
  };
  event.waitUntil(
    self.registration.showNotification('SpennyPiggy', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'));
  }
});

// ================================================================
// CACHE MANAGEMENT
// ================================================================

// Skip waiting and claim clients immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Claim all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Runtime cache cleanup.
//
// 🚨 An allow-list of runtime cache names DELETES THE WORKBOX PRECACHE. Workbox
// stores it under `workbox-precache-v2-<origin>`, which was not in the list, so
// every activation wiped the app shell that `precacheAndRoute` had just spent a
// download storm filling — and then refilled it on the next activation. That is
// the loop, not a cleanup. `cleanupOutdatedCaches()` at the top of this file
// already removes precaches from older Workbox versions, correctly.
//
// Only names this file has actually retired belong here. Adding a cache above
// means adding it to `RUNTIME_CACHES` — never re-deriving this as "anything I do
// not recognise".
const RETIRED_CACHES = [];

self.addEventListener('activate', event => {
  if (!RETIRED_CACHES.length) {
    return;
  }

  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames
        .filter(cacheName => RETIRED_CACHES.includes(cacheName))
        .map(cacheName => caches.delete(cacheName))
    ))
  );
});
