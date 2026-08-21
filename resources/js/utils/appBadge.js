import { isStandalone } from "./pwaInstall";

/**
 * App icon badge (unread notifications) for the installed PWA.
 *
 * Uses the Badging API (setAppBadge / clearAppBadge). Fully feature-detected,
 * standalone-gated and try/catch-wrapped so it can never affect page behaviour.
 * Reads unread state from the existing `get-notification` endpoint — no new
 * route, no backend change. A logged-out request just 401s and is swallowed.
 */

export function clearAppBadge() {
    try {
        if (navigator.clearAppBadge) navigator.clearAppBadge();
    } catch (_) {
        /* silent */
    }
}

export function setAppBadge(count) {
    try {
        if (!navigator.setAppBadge) return;
        if (count && count > 0) navigator.setAppBadge(count);
        else clearAppBadge();
    } catch (_) {
        /* silent */
    }
}

/**
 * Fetch unread notifications and reflect the count on the app icon.
 * No-op unless the Badging API exists and the app is installed.
 */
export async function syncAppBadge() {
    try {
        if (typeof navigator === "undefined" || !("setAppBadge" in navigator)) return;
        if (!isStandalone()) return;

        const http = window.axios;
        if (!http) return;

        const url = typeof window.route === "function" ? window.route("get-notification") : "/get-notification";
        const res = await http.get(url);
        const items = (res && res.data && res.data.notifications) || [];
        const unread = items.filter((n) => Number(n.is_read) === 0).length;
        setAppBadge(unread);
    } catch (_) {
        /* logged out / offline / unsupported — leave the badge as-is */
    }
}

/**
 * Wire badge syncing: once on load and again whenever the app is foregrounded
 * (native apps refresh their badge when reopened).
 */
export function initAppBadge() {
    try {
        if (typeof document === "undefined") return;
        if (!("setAppBadge" in navigator)) return;
        if (!isStandalone()) return;

        syncAppBadge();
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") syncAppBadge();
        });
    } catch (_) {
        /* silent */
    }
}

/**
 * 🚨 THE BADGE COULD NOT BE CLEARED BY ANY ACTION THE USER HAD, and that is the
 * whole bug behind "all have been cleared, the icon still says 3".
 *
 * Three separate stores were involved and only one of them was ever written:
 *
 *   1. OUR `notifications` table — written by `NotificationDispatcher` with
 *      `is_read = 0`. `syncAppBadge()` above counts its unread rows and that
 *      count IS the number on the app icon.
 *   2. MAGICBELL — the bell the user actually opens and presses "Mark all as
 *      read" on. Its read state lives at MagicBell and it never touches our
 *      column.
 *   3. THE OS — notifications already delivered and sitting in Notification
 *      Centre.
 *
 * So clearing the bell cleared (2) and left (1) untouched, the badge re-read
 * (1) on every foreground, and the number came straight back. `mark-as-read`
 * and `delete-all-notifications` existed as routes the whole time with **no
 * caller anywhere in `resources/js`** — dead endpoints for exactly the job
 * nothing was doing.
 */
export async function markServerNotificationsRead() {
    try {
        const http = window.axios;
        if (!http) return;

        const url =
            typeof window.route === "function"
                ? window.route("mark-as-read")
                : "/mark-as-read";

        await http.get(url);
    } catch (_) {
        /* logged out / offline — the next clear will retry */
    }
}

/**
 * Dismiss notifications already delivered to the OS.
 *
 * ⚠️ Needed on iOS in addition to `clearAppBadge()`: a web-push notification
 * left sitting in Notification Centre keeps the app icon marked on its own,
 * outside the Badging API, so clearing the count alone leaves the dot behind.
 */
export async function closeDeliveredNotifications() {
    try {
        if (!("serviceWorker" in navigator)) return;

        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration || !registration.getNotifications) return;

        const delivered = await registration.getNotifications();
        delivered.forEach((notification) => notification.close());
    } catch (_) {
        /* no worker, or the browser refuses the list — nothing to close */
    }
}

/**
 * Everything "I have read these" has to mean, in one call: our table, the OS
 * tray, and the icon. Call it from any surface that clears notifications.
 *
 * ⚠️ Order matters. The server write goes first so a foreground sync racing
 * this cannot re-read the old unread count and put the number straight back.
 */
export async function clearAllNotificationState() {
    await markServerNotificationsRead();
    await closeDeliveredNotifications();
    clearAppBadge();
}
