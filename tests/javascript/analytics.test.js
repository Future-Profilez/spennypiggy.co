import { pageGroup, sendQueued, trackPageView } from "@/lib/analytics";

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

describe("trackPageView", () => {
    beforeEach(() => {
        window.gtag = jest.fn();
        window.history.replaceState({}, "", "/leaderboard");
    });

    /**
     * 🚨 Reading document.title on Inertia's `navigate` reports the title of the
     * page the visitor just LEFT — verified in a browser, and two
     * requestAnimationFrames were not enough. The send waits for the title.
     */
    it("waits for the title to catch up before sending", () => {
        jest.useFakeTimers();
        document.title = "Old page";

        trackPageView();

        expect(window.gtag).not.toHaveBeenCalled();

        // No <Head> update arrives; the timeout is what stops a page view being lost.
        jest.advanceTimersByTime(600);

        expect(window.gtag).toHaveBeenCalledWith(
            "event",
            "page_view",
            expect.objectContaining({ page_group: "leaderboard", page_title: "Old page" })
        );

        jest.useRealTimers();
    });

    it("sends the title the page actually settled on", async () => {
        document.title = "Old page";

        trackPageView();
        document.title = "Leaderboard";

        await new Promise((resolve) => setTimeout(resolve, 20));

        expect(window.gtag).toHaveBeenCalledWith(
            "event",
            "page_view",
            expect.objectContaining({ page_title: "Leaderboard" })
        );
    });

    it("does not throw when the tag never loaded", () => {
        jest.useFakeTimers();
        delete window.gtag;

        expect(() => {
            trackPageView();
            jest.advanceTimersByTime(600);
        }).not.toThrow();

        jest.useRealTimers();
    });
});
