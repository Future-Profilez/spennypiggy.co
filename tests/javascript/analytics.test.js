import {
    pageGroup,
    sendQueued,
    trackClientEvent,
    trackPageView,
} from "@/lib/analytics";

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
        jest.resetModules();
    });

    /**
     * 🚨 The entry view must not wait. Its title came from the server, so there
     * is nothing to wait for — and `whenTitleSettles` only resolves early when
     * the title CHANGES, which on the entry page it never does. Waiting would
     * sit out the full timeout and lose the view of anyone who bounced first,
     * which is exactly what entry pages and ad landing pages are for.
     */
    it("sends the first view immediately, with no wait", () => {
        jest.useFakeTimers();
        document.title = "Leaderboard";

        trackPageView();

        expect(window.gtag).toHaveBeenCalledWith(
            "event",
            "page_view",
            expect.objectContaining({ page_group: "leaderboard", page_title: "Leaderboard" })
        );

        jest.useRealTimers();
    });

    /**
     * 🚨 …but a LATER view must wait: reading document.title on Inertia's
     * `navigate` reports the title of the page the visitor just LEFT, and two
     * requestAnimationFrames were not enough either (verified in a browser).
     */
    it("waits for the title to catch up on a subsequent view", () => {
        jest.useFakeTimers();
        document.title = "Leaderboard";
        trackPageView();
        window.gtag.mockClear();

        document.title = "Old page";
        trackPageView();

        expect(window.gtag).not.toHaveBeenCalled();

        // No <Head> update arrives; the timeout is what stops a view being lost.
        jest.advanceTimersByTime(600);

        expect(window.gtag).toHaveBeenCalledWith(
            "event",
            "page_view",
            expect.objectContaining({ page_title: "Old page" })
        );

        jest.useRealTimers();
    });

    it("sends the title the page actually settled on", async () => {
        document.title = "Leaderboard";
        trackPageView();
        window.gtag.mockClear();

        document.title = "Old page";
        trackPageView();
        document.title = "Creator profile";

        await new Promise((resolve) => setTimeout(resolve, 20));

        expect(window.gtag).toHaveBeenCalledWith(
            "event",
            "page_view",
            expect.objectContaining({ page_title: "Creator profile" })
        );
    });

    it("does not throw when the tag never loaded", () => {
        jest.useFakeTimers();
        delete window.gtag;

        expect(() => {
            trackPageView();
            trackPageView();
            jest.advanceTimersByTime(600);
        }).not.toThrow();

        jest.useRealTimers();
    });
});

describe("trackClientEvent", () => {
    beforeEach(() => {
        window.gtag = jest.fn();
        window.history.replaceState({}, "", "/register");
    });

    /**
     * ⚠️ The registration wizard advances in React state, so the server never
     * sees it. The event still has to carry `page_group`, or the reports that
     * split by it quietly leave these events out.
     */
    it("attaches the page group to a component-fired event", () => {
        trackClientEvent("sign_up_step", { step: "identity", direction: "forward" });

        expect(window.gtag).toHaveBeenCalledWith("event", "sign_up_step", {
            step: "identity",
            direction: "forward",
            page_group: "auth",
        });
    });

    it("does not throw when the tag never loaded", () => {
        delete window.gtag;

        expect(() => trackClientEvent("sign_up_step", { step: "role" })).not.toThrow();
    });
});

describe("Google Ads conversion", () => {
    beforeEach(() => {
        window.gtag = jest.fn();
        window.history.replaceState({}, "", "/checkout");
        delete window.__spAdsConversions;
    });

    /**
     * 🚨 The Ads tag has been loading on every page with nothing ever sending it
     * a conversion, so the campaigns were bidding blind — the account's own
     * `Sign-up` action had gone Inactive for want of one.
     */
    it("reports a purchase to Ads with its value", () => {
        window.__spAdsConversions = { purchase: "AW-11395921981/AbC-D_efG" };

        sendQueued({
            analytics: [
                { id: "p1", name: "purchase", params: { value: 25, currency: "GBP" } },
            ],
        });

        expect(window.gtag).toHaveBeenCalledWith("event", "conversion", {
            send_to: "AW-11395921981/AbC-D_efG",
            value: 25,
            currency: "GBP",
        });
    });

    /** ⚠️ `value: 0` on a signup teaches smart bidding that a signup is worthless. */
    it("reports a signup with no value attached", () => {
        window.__spAdsConversions = { sign_up: "AW-11395921981/SignUpLabel" };

        sendQueued({
            analytics: [
                { id: "s1", name: "sign_up", params: { method: "email", role: "creator" } },
            ],
        });

        expect(window.gtag).toHaveBeenCalledWith("event", "conversion", {
            send_to: "AW-11395921981/SignUpLabel",
        });
    });

    /** ⚠️ A wrong label files the conversion against the wrong action — worse than none. */
    it("sends nothing to Ads for an event with no label", () => {
        window.__spAdsConversions = { purchase: "AW-11395921981/AbC-D_efG" };

        sendQueued({ analytics: [{ id: "e1", name: "email_verified", params: {} }] });

        const adsCalls = window.gtag.mock.calls.filter((c) => c[1] === "conversion");

        expect(adsCalls).toHaveLength(0);
        // The GA4 event still goes out — the two are independent.
        expect(window.gtag).toHaveBeenCalledWith(
            "event",
            "email_verified",
            expect.any(Object)
        );
    });

    it("sends nothing to Ads when no map was published at all", () => {
        sendQueued({
            analytics: [
                { id: "p2", name: "purchase", params: { value: 25, currency: "GBP" } },
            ],
        });

        expect(window.gtag).not.toHaveBeenCalledWith(
            "event",
            "conversion",
            expect.any(Object)
        );
    });
});

describe("X (Twitter) Ads conversion", () => {
    beforeEach(() => {
        window.gtag = jest.fn();
        window.twq = jest.fn();
        window.history.replaceState({}, "", "/checkout");
        delete window.__spXConversions;
        delete window.__spAdsConversions;
    });

    it("reports a purchase to X with its value", () => {
        window.__spXConversions = { purchase: "tw-ozu4h-purchase" };

        sendQueued({
            analytics: [
                { id: "x1", name: "purchase", params: { value: 25, currency: "GBP" } },
            ],
        });

        expect(window.twq).toHaveBeenCalledWith("event", "tw-ozu4h-purchase", {
            value: 25,
            currency: "GBP",
        });
    });

    /** ⚠️ `value: 0` on a signup teaches the bidding that a signup is worthless. */
    it("reports a signup with no value attached", () => {
        window.__spXConversions = { sign_up: "tw-ozu4h-signup" };

        sendQueued({
            analytics: [{ id: "x2", name: "sign_up", params: { method: "email" } }],
        });

        expect(window.twq).toHaveBeenCalledWith("event", "tw-ozu4h-signup", {});
    });

    /**
     * 🚨 ONE EVENT, ONE ROUTE. `begin_checkout` is reported from the server;
     * publishing it to the pixel as well would count every checkout twice,
     * because X deduplicates only on a matching conversion_id and the two
     * routes do not share one.
     */
    it("does not report an event the server owns", () => {
        window.__spXConversions = { purchase: "tw-ozu4h-purchase" };

        sendQueued({
            analytics: [
                { id: "x3", name: "begin_checkout", params: { value: 25, currency: "GBP" } },
            ],
        });

        expect(window.twq).not.toHaveBeenCalled();
    });

    it("does not throw when the pixel never loaded", () => {
        window.__spXConversions = { purchase: "tw-ozu4h-purchase" };
        delete window.twq;

        expect(() =>
            sendQueued({
                analytics: [{ id: "x4", name: "purchase", params: { value: 5 } }],
            })
        ).not.toThrow();
    });

    it("sends nothing when no map was published", () => {
        sendQueued({
            analytics: [{ id: "x5", name: "purchase", params: { value: 5 } }],
        });

        expect(window.twq).not.toHaveBeenCalled();
    });
});
