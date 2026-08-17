// ================================================================
// PUSH NOTIFICATIONS
//
// This file is PREPENDED to the workbox output by `scripts/build-sw.js`, so it
// runs BEFORE the CDN `importScripts` at the top of `public/sw.js`.
//
// 🚨 That ordering is load-bearing. A failed `importScripts` aborts evaluation of
// the ENTIRE script, so every listener declared after it is silently never
// registered — push and caching would die together on a third-party CDN outage,
// with nothing logged anywhere. Push is the half that carries money (a sale, a
// moderation hold, a payout), and it depends on nothing, so it goes first.
//
// 🚨 The file this replaced (`resources/proxy/service-worker.js`, the MagicBell
// library bundle) had NO `push` listener, NO `notificationclick` and NO
// `showNotification` anywhere in it. Subscriptions were created, MagicBell
// accepted and delivered every push, and the browser had nothing to display it
// with — which is the "emails arrive, pushes silently do not" report.
// ================================================================

// ⚠️ Icons MUST be paths that actually resolve on the app domain. A file under
// `public/` is NOT served here (only `public/build/**` is), so the old
// `/images/icons/icon-192x192.png` was a 404 and the notification rendered with
// the browser's generic bell. These two are real routes (`192.image.file`,
// `32.image.file`) reading from `resources/proxy/`.
const SP_PUSH_ICON = '/android-chrome-192x192.png';
const SP_PUSH_BADGE = '/favicon-32x32.png';

// ⚠️ MagicBell delivers the notification as a JSON body, so the old
// `event.data.text()` rendered the raw JSON as the notification's message and
// hardcoded the title to "SpennyPiggy". Field names follow MagicBell's own
// notification object (`title` / `content` / `action_url`), with the generic web
// push shapes accepted as fallbacks so a payload from anywhere else still reads.
function spReadPushPayload(event) {
  if (!event.data) {
    return {};
  }

  try {
    return event.data.json() || {};
  } catch (err) {
    // Not JSON — treat the whole body as the message rather than dropping it.
    return { content: event.data.text() };
  }
}

self.addEventListener('push', (event) => {
  const raw = spReadPushPayload(event);
  const payload = raw.notification || raw;

  const title = payload.title || 'Spenny Piggy';
  const body = payload.content || payload.body || payload.message || '';
  const url = payload.action_url || payload.url || '/';

  // ⚠️ `tag` collapses repeats of the same notification instead of stacking a
  // column of identical cards, and `renotify` still buzzes for a genuine update.
  const options = {
    body,
    icon: payload.icon || SP_PUSH_ICON,
    badge: SP_PUSH_BADGE,
    vibrate: [100, 50, 100],
    tag: payload.id ? String(payload.id) : undefined,
    renotify: Boolean(payload.id),
    data: { url },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // 🚨 The old handler only acted on `event.action === 'explore'`, so tapping the
  // notification ITSELF — which is what everybody does, and the only thing
  // available on Android's collapsed card — did nothing at all. There are no
  // actions now: the whole card is the target.
  const target = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // ⚠️ Focus an already-open tab rather than opening a second one. An
        // installed PWA has exactly one window, and `openWindow` on top of it is
        // how a push ends up launching a duplicate app instance.
        for (const client of windowClients) {
          if ('focus' in client) {
            if ('navigate' in client) {
              return client.navigate(target).then((c) => (c ? c.focus() : null));
            }

            return client.focus();
          }
        }

        return self.clients.openWindow(target);
      })
      .catch(() => self.clients.openWindow(target))
  );
});

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
precacheAndRoute([{"revision":"df17ab0ab54a974e5fc2a78831d9665c","url":"/offline.html"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"/android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"/android-chrome-512x512.png"},{"revision":"3663afcf56bb3bc3161d99b4378fd43b","url":"/apple-touch-icon.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"/favicon-32x32.png"}]);

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
//
// 🚨 They live in `resources/proxy/sw-push.js`, which `scripts/build-sw.js`
// PREPENDS to this file's build output — deliberately ABOVE the CDN
// `importScripts` on line 2, because a failed import aborts evaluation of the
// whole script and would take push down with the caching. Do not move them back
// here.
// ================================================================

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
