/**
 * localStorage that cannot take the page down with it.
 *
 * 🚨 `typeof window !== "undefined"` IS NOT A GUARD. Reading the `localStorage`
 * property itself THROWS a SecurityError when the browser refuses site data —
 * cookies blocked for the site, a sandboxed iframe, some in-app webviews, Safari
 * private mode under pressure. Seen live on /creators:
 * "Failed to read the 'localStorage' property from 'Window': Access is denied for
 * this document."
 *
 * That matters most where the call sits at a module's top level, as the UTM capture
 * in app.jsx does: the throw happens while the bundle is evaluating, so the whole
 * SPA never boots and the visitor gets a blank page. Nothing in the UI is worth
 * that — every value stored through here is a convenience (a remembered version, a
 * dismissed prompt, a UTM tag), not something the page needs to render.
 *
 * Every function fails quietly: reads answer null, writes do nothing, and the caller
 * carries on as if the browser simply had nothing stored.
 */

export function safeGet(key) {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function safeSet(key, value) {
    try {
        window.localStorage.setItem(key, value);

        return true;
    } catch {
        // A quota error lands here too, which is the same non-event: the page is
        // correct without the value.
        return false;
    }
}

export function safeRemove(key) {
    try {
        window.localStorage.removeItem(key);

        return true;
    } catch {
        return false;
    }
}

/** Is site storage usable at all? Useful for deciding whether to offer a "remember me" affordance. */
export function storageAvailable() {
    try {
        const probe = "__sp_probe__";
        window.localStorage.setItem(probe, "1");
        window.localStorage.removeItem(probe);

        return true;
    } catch {
        return false;
    }
}
