/**
 * The help centre's device-local "you were reading" list.
 *
 * 🚨 THE PRIVACY RULE IS THE POINT OF THESE TESTS. A list of the help articles
 * somebody opened is a list of the problems they are having with their own
 * account, so it never leaves the browser and there is a control that clears it.
 * The shape guard matters for the same reason a version bump does: this value
 * survives deploys, so a change ships to browsers already holding the old one.
 */
import {
    MAX_RECENTS,
    clearHelpRecents,
    readHelpRecents,
    rememberHelpArticle,
} from "@/lib/helpRecents";

const KEY = "sp_help_recent_v1";

const article = (n) => ({
    slug: `slug-${n}`,
    title: `Title ${n}`,
    category_slug: "money-and-payouts",
    category_title: "Money and payouts",
});

describe("helpRecents", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("remembers an article, newest first", () => {
        rememberHelpArticle(article(1));
        rememberHelpArticle(article(2));

        expect(readHelpRecents().map((a) => a.slug)).toEqual(["slug-2", "slug-1"]);
    });

    it("re-reading an article moves it to the front rather than duplicating it", () => {
        rememberHelpArticle(article(1));
        rememberHelpArticle(article(2));
        rememberHelpArticle(article(1));

        expect(readHelpRecents().map((a) => a.slug)).toEqual(["slug-1", "slug-2"]);
    });

    it("is capped, so the list can never become an archive", () => {
        for (let i = 0; i < MAX_RECENTS + 4; i++) rememberHelpArticle(article(i));

        expect(readHelpRecents()).toHaveLength(MAX_RECENTS);
    });

    it("stores only the four fields the list renders", () => {
        rememberHelpArticle({ ...article(1), secret: "do not keep this", body: "…" });

        expect(Object.keys(readHelpRecents()[0]).sort()).toEqual([
            "category_slug",
            "category_title",
            "slug",
            "title",
        ]);
    });

    it("refuses an entry that could not be rendered as a link", () => {
        rememberHelpArticle({ title: "No slug", category_slug: "x" });
        rememberHelpArticle({ slug: "no-category", title: "No category" });

        expect(readHelpRecents()).toEqual([]);
    });

    /**
     * 🚨 The stored value outlives a deploy. A shape change must degrade to "no
     * recents", never to a row that renders `/help/undefined/undefined`.
     */
    it("drops a stored row that no longer matches the shape", () => {
        window.localStorage.setItem(
            KEY,
            JSON.stringify([{ slug: "ok", title: "Ok", category_slug: "c" }, { slug: "half" }, null, "nonsense"]),
        );

        expect(readHelpRecents().map((a) => a.slug)).toEqual(["ok"]);
    });

    it("survives a corrupt value without throwing", () => {
        window.localStorage.setItem(KEY, "{not json");

        expect(readHelpRecents()).toEqual([]);
    });

    it("clears on request — the control a shared device needs", () => {
        rememberHelpArticle(article(1));
        clearHelpRecents();

        expect(readHelpRecents()).toEqual([]);
    });

    /**
     * 🚨 Reading the `localStorage` PROPERTY throws a SecurityError when the
     * browser refuses site data, and this runs on the article page's mount path.
     * The house `safeStorage` helper is what keeps that from taking the page
     * down — this asserts the whole chain, not just the helper.
     */
    it("never throws when the browser refuses site data", () => {
        const real = Object.getOwnPropertyDescriptor(window, "localStorage");
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            get() {
                throw new DOMException("Access is denied for this document.", "SecurityError");
            },
        });

        expect(() => rememberHelpArticle(article(1))).not.toThrow();
        expect(readHelpRecents()).toEqual([]);

        if (real) Object.defineProperty(window, "localStorage", real);
    });
});
