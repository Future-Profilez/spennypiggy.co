import { lazy } from "react";

/*
 * A deploy replaces every hashed chunk, so a tab that has been open across one
 * asks the CDN for a file that no longer exists. Vite's `vite:preloadError`
 * handler in `app.jsx` covers the case where the FETCH fails outright — but a
 * service worker holding a stale entry can hand back a response that resolves to
 * an empty module instead, and React's `lazy` then reads `.default` off it:
 *
 *   TypeError: undefined is not an object (evaluating 'y._result.default')
 *   TypeError: Cannot read properties of undefined (reading 'default')
 *
 * Both were live in production (Sentry JAVASCRIPT-REACT-8R / -8S). There is no
 * error to catch — the promise RESOLVES — so the only place to notice is here,
 * between the import and React.
 *
 * ⚠️ The retry is ONE reload, rate-limited by a timestamp in sessionStorage, and
 * the key is shared with `app.jsx`'s preload handler on purpose: both recover the
 * same fault the same way, and two independent cooldowns can reload each other in
 * a loop. A second failure inside the window is allowed to throw so the error
 * boundary and Sentry both still see it — a silent wedged page is worse than a
 * crash.
 */
const RELOAD_KEY = "spenny_preload_reloaded_at";
const RELOAD_COOLDOWN_MS = 60_000;

/**
 * Reload once to pick up a fresh asset manifest, at most once per cooldown.
 *
 * 🚨 THIS IS THE ONE DEFINITION, AND THE COOLDOWN KEY IS SHARED BY EVERY
 * STALE-CHUNK RECOVERY ON PURPOSE — this module, `app.jsx`'s `vite:preloadError`
 * handler, and `app.jsx`'s Inertia page resolver. Three independent reload timers
 * can reload each other in a loop, and each one on its own looks perfectly safe.
 * `app.jsx` imports this rather than keeping its own copy for exactly that reason.
 *
 * ⚠️ Returns FALSE when storage is unavailable (private mode, storage disabled) so
 * the caller lets the error through instead of reloading with no rate limit.
 *
 * @returns {boolean} true when a reload has been started
 */
export function reloadOnce() {
    try {
        const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;

        if (Date.now() - last < RELOAD_COOLDOWN_MS) {
            return false;
        }

        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch (e) {
        // Private mode / storage disabled — no cooldown available, so do not
        // reload at all rather than risk a loop we cannot rate-limit.
        return false;
    }

    const reload = () => window.location.reload();

    // Drop the cached document first: a reload is a navigation and goes through
    // the service worker, which is what served the stale chunk in the first place.
    if (typeof caches !== "undefined" && caches.delete) {
        caches.delete("pages-v1").then(reload, reload);
    } else {
        reload();
    }

    return true;
}

/**
 * Drop-in replacement for `React.lazy` that survives a mid-session deploy.
 *
 * @param {() => Promise<any>} factory the dynamic `import()` thunk
 */
export default function lazyRetry(factory) {
    return lazy(() =>
        factory().then(
            (module) => {
                if (module && module.default) {
                    return module;
                }

                // Resolved, but to nothing usable. Same cause as a failed fetch.
                if (reloadOnce()) {
                    // Never settle — the page is going away. Settling would let
                    // React render the broken module during the reload.
                    return new Promise(() => {});
                }

                throw new Error(
                    "Chunk resolved without a default export (stale deploy?)"
                );
            },
            (error) => {
                if (reloadOnce()) {
                    return new Promise(() => {});
                }

                throw error;
            }
        )
    );
}
