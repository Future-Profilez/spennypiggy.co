/**
 * The stale-chunk recovery has to drop the cache that served the stale chunk.
 *
 * 🚨 It deleted only `pages-v1` — the DOCUMENT cache. JS is cached CacheFirst in
 * `static-assets-v1` for a year, so the reload took the same broken chunk straight
 * back out of the asset cache and the visitor stayed on a blank page that reloading
 * could never fix (JAVASCRIPT-REACT-AC, /creators).
 */

import { reloadOnce } from "../../resources/js/utils/lazyRetry";

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
        expect(reloadOnce()).toBe(true);
        await flush();

        expect(deleted).toContain("static-assets-v1");
        expect(deleted).toContain("pages-v1");
    });

    it("leaves content-addressed caches alone", async () => {
        reloadOnce();
        await flush();

        expect(deleted).not.toContain("images-v1");
        expect(deleted).not.toContain("fonts-v1");
        expect(deleted).not.toContain("google-fonts-v1");
    });

    it("still matches after a cache version bump", async () => {
        global.caches.keys = () =>
            Promise.resolve(["pages-v2", "static-assets-v2"]);

        reloadOnce();
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

    it("is rate limited so two recoveries cannot loop", () => {
        expect(reloadOnce()).toBe(true);
        expect(reloadOnce()).toBe(false);
    });
});
