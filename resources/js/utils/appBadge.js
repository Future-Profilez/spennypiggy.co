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
