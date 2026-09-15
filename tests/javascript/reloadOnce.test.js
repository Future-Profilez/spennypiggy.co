/**
 * The stale-chunk recovery has to drop the cache that served the stale chunk, and
 * it has to survive a deploy breaking EVERY chunk on the page at once.
 *
 * 🚨 It deleted only `pages-v1` — the DOCUMENT cache. JS is cached CacheFirst in
 * `static-assets-v1` for a year, so the reload took the same broken chunk straight
 * back out of the asset cache and the visitor stayed on a blank page that reloading
 * could never fix (JAVASCRIPT-REACT-AC, /creators).
 *
 * 🚨 And the cooldown could not tell "we reloaded recently" from "a sibling chunk
 * on THIS page started the reload a millisecond ago", so every chunk after the
 * first threw — its own Sentry issue, and an error boundary tearing the page down
 * mid-reload. Measured 13 Sep 2026: one page load of /daisyjohnson, one trace id,
 * one second, `CoverIdentity` and `ShareProfile` both failing
 * (JAVASCRIPT-REACT-8X · -9R · -84, 22 events over a month).
 */

/**
 * 🚨 EVERY TEST GETS A FRESH MODULE, BECAUSE A FRESH MODULE IS A FRESH PAGE.
 *
 * `reloadInFlight` lives for the life of the document by design. Importing once at
 * the top of the file shares it across every test, so the first test to start a
 * reload silently short-circuits all the others — which is exactly what happened
 * when it was added. `sessionStorage` deliberately SURVIVES here: that is what a
 * real reload does, and it is what the cross-page loop guard is made of.
 */
function loadFresh() {
    let mod;
    jest.isolateModules(() => {
        mod = require("../../resources/js/utils/lazyRetry");
    });

    return mod;
}

describe("reloadOnce", () => {
    let deleted;

    beforeEach(() => {
        deleted = [];
        sessionStorage.clear();

        global.caches = {
            keys: () =>
                Promise.resolve([
                    "pages-v1",
                    "static-assets-v1",
                    "images-v1",
                    "fonts-v1",
                    "google-fonts-v1",
                ]),
            delete: (name) => {
                deleted.push(name);

                return Promise.resolve(true);
            },
        };
    });

    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    it("drops the asset cache, not just the document cache", async () => {
        expect(loadFresh().reloadOnce()).toBe(true);
        await flush();

        expect(deleted).toContain("static-assets-v1");
        expect(deleted).toContain("pages-v1");
    });

    it("leaves content-addressed caches alone", async () => {
        loadFresh().reloadOnce();
        await flush();

        expect(deleted).not.toContain("images-v1");
        expect(deleted).not.toContain("fonts-v1");
        expect(deleted).not.toContain("google-fonts-v1");
    });

    it("still matches after a cache version bump", async () => {
        global.caches.keys = () =>
            Promise.resolve(["pages-v2", "static-assets-v2"]);

        loadFresh().reloadOnce();
        await flush();

        // The old code hardcoded "pages-v1", so a rename silently cleared nothing.
        expect(deleted).toEqual(
            expect.arrayContaining(["pages-v2", "static-assets-v2"]),
        );
    });

    /*
     * There is deliberately no "it reloads the page" case. `window.location` and its
     * own `reload` are BOTH non-configurable in this jsdom - `delete`,
     * `Object.defineProperty` and `jest.spyOn` all throw - so the reload cannot be
     * observed without changing the production code to take an injectable navigator,
     * which would be a seam that exists only for the test. What this file pins is the
     * part that was actually broken: WHICH caches are dropped before that reload.
     */

    /**
     * 🚨 THE LOOP GUARD, STATED AS THE PROPERTY RATHER THAN THE MECHANISM.
     *
     * This used to assert `reloadOnce()` twice in ONE page, expecting false the
     * second time — which reads as a loop guard but is really the sibling case, and
     * siblings are not a second recovery. What must never happen is a NEW DOCUMENT
     * reloading again straight away, and that is what is asserted now.
     */
    it("is rate limited so two recoveries cannot loop", () => {
        expect(loadFresh().reloadOnce()).toBe(true);

        // A reload gives a new document: same sessionStorage, fresh module state.
        expect(loadFresh().reloadOnce()).toBe(false);
    });

    it("lets a new document recover again once the cooldown has passed", () => {
        sessionStorage.setItem(
            "spenny_preload_reloaded_at",
            String(Date.now() - 120_000),
        );

        expect(loadFresh().reloadOnce()).toBe(true);
    });

    /**
     * 🚨 THE FIX. Every other chunk failing in the same instant must be told a
     * reload is under way, so it hangs instead of throwing. Before this each one
     * threw, filed its own issue, and let the error boundary tear the page down
     * while the reload was still in flight.
     */
    it("tells a sibling chunk on the same page that a reload is under way", () => {
        const { reloadOnce } = loadFresh();

        expect(reloadOnce()).toBe(true);
        expect(reloadOnce()).toBe(true);
        expect(reloadOnce()).toBe(true);
    });

    /**
     * ⚠️ Storage blocked (private mode, blocked site data) still refuses to start a
     * reload it cannot rate-limit — a loop we cannot stop is worse than an error we
     * can see.
     */
    it("refuses to start a reload it cannot rate limit", () => {
        const getItem = jest
            .spyOn(Storage.prototype, "getItem")
            .mockImplementation(() => {
                throw new Error("SecurityError");
            });

        expect(loadFresh().reloadOnce()).toBe(false);

        getItem.mockRestore();
    });
});
