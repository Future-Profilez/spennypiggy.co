import axios from "axios";

/**
 * Tell the server whether this browser can actually receive a push.
 *
 * 🚨 The server cannot work this out on its own. Push is registered entirely client-side
 * (MagicBell's `WebPushClient.subscribe()`), and MagicBell accepts a notification for a user
 * with no device and answers 200 — so `notification_logs` records `sent`, nothing errors,
 * and a creator can stop receiving alerts for months with no signal anywhere. The browser is
 * the only party that knows, so the browser says.
 */

const CACHE_KEY = "spenny_push_heartbeat_v1";

/**
 * 🚨 A DISMISSAL EXPIRES. THIS IS THE WHOLE BUG THIS MODULE EXISTS AROUND.
 *
 * The enable-notifications banner used to write one permanent `isSubscribed: 'true'` flag —
 * and it wrote it on SUCCESS, on an unsupported browser, on a denial, AND on a MagicBell load
 * failure. So a single dismissal or one transient error retired the prompt forever on that
 * device, and the person could never re-enable push. There was no path back short of clearing
 * site data, and nothing anywhere reported it.
 *
 * "Not now" is not "never": a creator is asked again after DISMISS_DAYS. Nothing records a
 * local "subscribed" flag any more — the browser's own push registration is the only truth,
 * and `readPushState()` asks it directly.
 */
const DISMISS_KEY = "spenny_push_prompt_dismissed_at";
const DISMISS_DAYS = 30;

export function promptDismissedRecently() {
    if (typeof window === "undefined") return false;

    try {
        const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
        if (!at) return false;

        return Date.now() - at < DISMISS_DAYS * 24 * 3600 * 1000;
    } catch {
        // Storage unavailable (private mode, blocked). Showing the prompt is the
        // safe failure here — the cost is one extra banner, not a silent opt-out.
        return false;
    }
}

export function markPromptDismissed() {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
        /* storage unavailable — the prompt simply shows again next visit */
    }
}

/**
 * ⚠️ PERMISSION IS NOT A SUBSCRIPTION. A browser can report `granted` while never having
 * completed `subscribe()` — MagicBell then has no device registered and delivers nothing.
 * Treating `granted` alone as confirmation is the false positive that would leave exactly
 * the broken accounts unreported, so the registration is checked separately.
 */
export async function readPushState() {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
        return { subscribed: false, permission: null };
    }

    const supported =
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window;

    if (!supported) {
        return { subscribed: false, permission: "unsupported" };
    }

    const permission = Notification.permission; // granted | denied | default

    if (permission !== "granted") {
        return { subscribed: false, permission };
    }

    try {
        // ⚠️ `.ready` never resolves when no worker is registered, so it is raced against
        // `getRegistration()` — a hang here would leave the heartbeat pending forever on a
        // browser that granted permission and has no worker.
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return { subscribed: false, permission };

        const subscription = await registration.pushManager.getSubscription();
        return { subscribed: Boolean(subscription), permission };
    } catch {
        // Unknown is not "broken" — say granted-but-unconfirmed rather than inventing a
        // failure that would email someone whose push works.
        return { subscribed: false, permission };
    }
}

/**
 * Post the state, at most once per throttle window.
 *
 * ⚠️ This runs on page load in an SPA doing many navigations per visit, so without the
 * client-side floor it is an UPDATE per navigation per user for a value that changes
 * meaningfully once a fortnight. The server's rate limit is the backstop, not the plan.
 *
 * `force` skips the cache — used straight after a subscribe, where the whole point is that
 * the answer just changed.
 */
export async function sendPushHeartbeat({ force = false } = {}) {
    if (typeof window === "undefined") return;

    let cached = null;
    try {
        cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    } catch {
        /* storage unavailable or corrupt — treat as no cache */
    }

    const state = await readPushState();

    if (!force && cached) {
        const fresh = Date.now() - (cached.at || 0) < (cached.ttl || 0);
        const unchanged =
            cached.subscribed === state.subscribed &&
            cached.permission === state.permission;

        // ⚠️ A CHANGE always posts, however fresh the cache. Someone who has just revoked
        // permission, or signed back in, is the exact case this exists to catch — waiting
        // six hours to record it would keep them in the reminder cohort they just left.
        if (fresh && unchanged) return;
    }

    try {
        const { data } = await axios.post("/push/heartbeat", state);

        localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
                ...state,
                at: Date.now(),
                // The server owns the window; the client just caches against it.
                ttl: (data?.throttle_hours ?? 6) * 3600 * 1000,
            }),
        );
    } catch {
        // Telemetry about a notification channel. It must never surface to the person
        // using the app, and a failure simply means the next load tries again.
    }
}
