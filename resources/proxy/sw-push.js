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
