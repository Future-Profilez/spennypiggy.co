/**
 * Save-for-later state, shared by every SaveButton on the page.
 *
 * 🚨 THIS EXISTS BECAUSE THE HEART NEVER LIT. `SaveButton` read
 * `initialSaved={item.is_saved}`, and `is_saved` was set NOWHERE in the backend —
 * zero occurrences in `app/`. So a supporter saved an item, the row was written,
 * and on the next render the heart was empty again. The feature looked broken, and
 * `saved_items` sat at 0 rows with the whole API, the controller, the button and
 * the "Saved" tab in `gifter/PurchasesHub` all shipped and working.
 *
 * The fix is the one `SavedItemController::mine()` was already written for — its
 * own docblock says "lets browse surfaces mark their save buttons as active in ONE
 * request". Nothing called it. This module is that one request.
 *
 * ⚠️ Deliberately NOT an Inertia shared prop. Shared props run on every navigation,
 * and the same reasoning is already written up on `CreatorJourneyService::stepStates`
 * — pay for it everywhere to use it on two screens. Module scope survives Inertia
 * navigations (the SPA root never remounts), so this is one request per page load,
 * not one per visit.
 *
 * ⚠️ Never throws. A save button is not a reason for a browse page to fail, so a
 * failed load resolves to "nothing saved" and the buttons simply render unsaved.
 */

/** `{ [productType]: Set<number> }`, or null until the first load resolves. */
let cache = null;

/** In-flight load, so ten buttons mounting together make one request. */
let loading = null;

const subscribers = new Set();

function notify() {
    subscribers.forEach((fn) => {
        try {
            fn();
        } catch {
            /* a bad subscriber must not stop the others */
        }
    });
}

/** Ids arrive as JSON numbers but call sites pass strings as often as not. */
function normalise(byType) {
    const out = {};
    Object.entries(byType || {}).forEach(([type, ids]) => {
        out[type] = new Set((ids || []).map(Number));
    });
    return out;
}

export function isLoaded() {
    return cache !== null;
}

export function subscribe(fn) {
    subscribers.add(fn);

    return () => subscribers.delete(fn);
}

/**
 * Load the saved map once. Safe to call from every button on every render.
 */
export function ensureLoaded() {
    if (cache !== null) {
        return Promise.resolve(cache);
    }

    if (loading) {
        return loading;
    }

    if (!window.axios) {
        cache = {};

        return Promise.resolve(cache);
    }

    loading = window.axios
        .get("/saved/mine")
        .then((r) => {
            cache = normalise(r.data?.saved);
            notify();

            return cache;
        })
        .catch(() => {
            // Signed out, offline, or a 500 — all mean "show nothing as saved".
            cache = {};

            return cache;
        })
        .finally(() => {
            loading = null;
        });

    return loading;
}

export function isSaved(productType, itemId) {
    return !!cache?.[productType]?.has(Number(itemId));
}

/**
 * Record a toggle locally so every other button for the same item agrees at once —
 * the same listing appears on discover, on a profile and in a grid.
 */
export function setSaved(productType, itemId, saved) {
    if (cache === null) {
        cache = {};
    }

    if (!cache[productType]) {
        cache[productType] = new Set();
    }

    if (saved) {
        cache[productType].add(Number(itemId));
    } else {
        cache[productType].delete(Number(itemId));
    }

    notify();
}

/** Test / logout hook — drops the cache so the next mount refetches. */
export function resetSavedItems() {
    cache = null;
    loading = null;
    notify();
}
