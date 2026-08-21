import { pageGroup, sendQueued } from "@/lib/analytics";

describe("pageGroup", () => {
    /**
     * 🚨 The bucket list is ORDERED and `creator_profile` is last, because
     * `/{username}/{page?}` in web.php means almost any single-segment path
     * could be a profile. Getting the order wrong files /login as a creator,
     * which is exactly the number this whole change exists to produce.
     */
    it.each([
        ["/", "home"],
        ["/creators", "ad_landing"],
        ["/creators/keep-100", "ad_landing"],
        ["/login", "auth"],
        ["/register", "auth"],
        ["/verify-email", "auth"],
        ["/dashboard", "app"],
        ["/stripe", "money"],
        ["/earnings", "money"],
        ["/checkout", "checkout"],
        ["/wishlist", "listing"],
        ["/piggy-pot/abc", "listing"],
        ["/terms", "content"],
        ["/leaderboard", "leaderboard"],
        ["/naveen", "creator_profile"],
        ["/naveen/wishlist", "creator_profile"],
        ["/a/b/c/d", "other"],
    ])("buckets %s as %s", (path, expected) => {
        expect(pageGroup(path)).toBe(expected);
    });
});

describe("sendQueued", () => {
    beforeEach(() => {
        window.gtag = jest.fn();
        window.history.replaceState({}, "", "/dashboard");
    });

    it("forwards each queued event once, with the page group attached", () => {
        sendQueued({
            analytics: [{ id: "a1", name: "sign_up", params: { method: "email" } }],
        });

        expect(window.gtag).toHaveBeenCalledWith("event", "sign_up", {
            method: "email",
            page_group: "app",
        });
    });

    /** A back-navigation re-renders the same props. One signup stays one signup. */
    it("never forwards the same event id twice", () => {
        const props = { analytics: [{ id: "dedupe-me", name: "purchase", params: {} }] };

        sendQueued(props);
        sendQueued(props);

        expect(window.gtag).toHaveBeenCalledTimes(1);
    });

    it("does nothing when there is no event queued", () => {
        sendQueued({});
        sendQueued({ analytics: [] });
        sendQueued(undefined);

        expect(window.gtag).not.toHaveBeenCalled();
    });

    /** gtag is blocked by a good number of browsers and absent in dev. */
    it("does not throw when the tag never loaded", () => {
        delete window.gtag;

        expect(() =>
            sendQueued({ analytics: [{ id: "no-tag", name: "sign_up" }] })
        ).not.toThrow();
    });
});
