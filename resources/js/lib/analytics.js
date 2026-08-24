/**
 * GA4 event forwarding.
 *
 * Two jobs, both of which exist because this is an SPA behind a `/{username}`
 * catch-all, and GA4 out of the box can see neither:
 *
 *  1. **Server-emitted funnel events.** Signup, verification, Stripe
 *     connection, publishing and purchase all end in a redirect, so no page
 *     component can honestly report them. `App\Support\AnalyticsEvent` flashes
 *     them, `HandleInertiaRequests` shares them as `props.analytics`, and
 *     `sendQueued` forwards them once.
 *
 *  2. **Page grouping.** Every creator profile is its own URL, so GA4 reports
 *     thousands of one-view pages and "how many people looked at a profile"
 *     is not a question its reports can answer. `pageGroup` collapses them to
 *     a handful of buckets, sent as a `page_group` parameter — register it as
 *     a custom dimension in GA4 Admin → Custom definitions to report on it.
 *
 * Everything here is best-effort: gtag is blocked by a good number of
 * browsers, is absent in dev, and must never be the reason a page throws.
 */

/** Event ids already forwarded, so a re-render or a back-navigation cannot double-count. */
const sent = new Set();

/**
 * Which kind of page this path is.
 *
 * ⚠️ Ordered, and the catch-all is LAST on purpose: `/{username}/{page?}` in
 * `web.php` means almost any single-segment path could be a profile, so every
 * real route has to be recognised before we fall through to `creator_profile`.
 * Getting that order wrong buckets `/login` as a creator.
 */
const PAGE_GROUPS = [
    [/^\/$/, "home"],
    [/^\/creators(\/|$)/, "ad_landing"],
    [/^\/(login|register|forgot-password|reset-password|verify-email)(\/|$)/, "auth"],
    [/^\/(dashboard|settings|profile-settings|notifications|my-)/, "app"],
    [/^\/(stripe|payouts?|earnings|finance|transactions)(\/|$)/, "money"],
    [/^\/(checkout|cart|payment|success|thank)/, "checkout"],
    [/^\/(wishlist|bills|membership|memberships|shop|tasks|piggy-pot|piggy-pots|tip-jar)(\/|$)/, "listing"],
    [/^\/(terms|privacy|legal|help|faq|about|contact|blog)(\/|$)/, "content"],
    [/^\/leaderboard(\/|$)/, "leaderboard"],
    [/^\/[^/]+(\/[^/]+)?$/, "creator_profile"],
];

export function pageGroup(pathname) {
    for (const [pattern, group] of PAGE_GROUPS) {
        if (pattern.test(pathname)) return group;
    }
    return "other";
}

function gtag(...args) {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return false;
    window.gtag(...args);
    return true;
}

/** Whether the entry page view has gone out — see `trackPageView`. */
let firstViewSent = false;

/** The title at the moment the previous page_view went out. */
let lastTitle = typeof document !== "undefined" ? document.title : "";

/**
 * Run `cb` once the document title has caught up with the page being shown.
 *
 * 🚨 This exists because reading `document.title` on Inertia's `navigate` event
 * reports the title of the page the visitor just LEFT. Verified in a browser:
 * clicking through to a creator profile sent
 * `page_title: "Leaderboard — …"`, and two `requestAnimationFrame`s were not
 * enough either — Inertia's `<Head>` writes the title from an effect that lands
 * after paint. That is what fills GA4's "Views by Page title" card with the
 * wrong page, and nothing about it looks broken from the outside.
 *
 * So: watch `<head>` and fire on the first change that actually moves the
 * title, with a hard timeout so a navigation between two identically-titled
 * pages still reports.
 */
function whenTitleSettles(cb) {
    if (typeof MutationObserver !== "function" || !document.head) {
        cb();

        return;
    }

    let done = false;

    const finish = () => {
        if (done) return;
        done = true;
        observer.disconnect();
        clearTimeout(timer);
        cb();
    };

    const observer = new MutationObserver(() => {
        if (document.title !== lastTitle) finish();
    });

    observer.observe(document.head, { childList: true, subtree: true, characterData: true });

    // Two pages can legitimately share a title, and a page can render without
    // a <Head> at all. Neither may cost us the page view.
    const timer = setTimeout(finish, 600);
}

/**
 * A GA4 page_view for an Inertia navigation, with the page group attached.
 *
 * 🚨 This is the ONLY sender. The GA4 config in `app.blade.php` carries
 * `send_page_view: false` for exactly this reason — Inertia fires `navigate`
 * for the first page too, so leaving the config to send its own counted every
 * full page load TWICE (verified in a browser), and its copy carried neither
 * the settled title nor `page_group`. Do not re-enable it.
 */
export function trackPageView() {
    const send = () => {
        try {
            lastTitle = document.title;

            gtag("event", "page_view", {
                page_location: window.location.href,
                page_path: window.location.pathname + window.location.search,
                page_title: document.title,
                page_group: pageGroup(window.location.pathname),
            });
        } catch {
            /* analytics must never break a navigation */
        }
    };

    // 🚨 The FIRST view is sent immediately, and must be.
    //
    // Its title came from the server in the document's own <title>, so there is
    // nothing to wait for — and waiting is not free: `whenTitleSettles` only
    // resolves early when the title CHANGES, which on the entry page it never
    // does, so every first view would sit out the full 600ms timeout. A visitor
    // who bounces inside that window would not be counted at all, and the entry
    // page is exactly where bounces happen — and where ad landing pages live.
    if (! firstViewSent) {
        firstViewSent = true;
        send();

        return;
    }

    whenTitleSettles(send);
}

/**
 * Forward whatever the server queued on this render.
 *
 * @param {{ analytics?: Array<{id: string, name: string, params?: object}> }} props
 */
export function sendQueued(props) {
    try {
        const events = props?.analytics;
        if (!Array.isArray(events) || events.length === 0) return;

        for (const event of events) {
            if (!event?.name || sent.has(event.id)) continue;
            sent.add(event.id);
            gtag("event", event.name, {
                ...(event.params || {}),
                page_group: pageGroup(window.location.pathname),
            });

            reportAdsConversion(event.name, event.params);
            reportXConversion(event.name, event.params);
        }

        // The set is per page load and bounded by how many events one session
        // can produce, but a very long-lived tab should not grow it forever.
        if (sent.size > 200) sent.clear();
    } catch {
        /* analytics must never break a render */
    }
}

/**
 * Tell Google Ads that a conversion happened.
 *
 * 🚨 The Ads tag (`AW-…`) has been loading on every page while nothing ever
 * sent it a conversion, so the campaigns behind the six /creators landing pages
 * have been bidding with no idea which click produced anything. Confirmed in
 * the account: every conversion action reads 0.00, and the website-sourced
 * `Sign-up` action sat **Inactive** for want of a single conversion.
 *
 * ⚠️ Driven by a MAP keyed on the GA4 event name, published by `app.blade.php`
 * from `config('analytics.ads.labels')`. An event with no label is not
 * reported — a wrong label files the conversion against the wrong action, which
 * is worse than filing none and is invisible once it starts happening.
 *
 * ⚠️ Separate from the GA4 event, not a replacement: GA4 and Ads are different
 * products with different attribution windows, and importing GA4 conversions
 * into Ads is a slower, lossier path than tagging directly. (The two
 * GA4-imported actions already in the account are exactly that path, and they
 * carry no label at all — which is why they cannot be used here.)
 */
function reportAdsConversion(eventName, params = {}) {
    try {
        const sendTo = window.__spAdsConversions?.[eventName];
        if (!sendTo) return;

        const payload = { send_to: sendTo };

        // Only a revenue event carries money. Sending `value: 0` on a signup
        // would teach smart bidding that a signup is worth nothing.
        if (params.value !== undefined) {
            payload.value = params.value;
            payload.currency = params.currency || "GBP";
        }

        gtag("event", "conversion", payload);
    } catch {
        /* analytics must never break a confirmation screen */
    }
}

/**
 * A GA4 event fired straight from a component.
 *
 * For the handful of things that never reach the server at all — the
 * registration wizard advancing in React state is the whole of it today. Adds
 * `page_group` so these events can be split by the same dimension as every
 * other one, and swallows everything: analytics must never break a form.
 */
export function trackClientEvent(name, params = {}) {
    try {
        gtag("event", name, {
            ...params,
            page_group: pageGroup(window.location.pathname),
        });
    } catch {
        /* analytics must never break the page that fired it */
    }
}

/**
 * Tell X (Twitter) Ads that a conversion happened.
 *
 * ⚠️ Driven by a map keyed on the event name, exactly like the Google Ads one,
 * and published by `app.blade.php` from `config('analytics.x.events')`. Only
 * the events the PIXEL owns are in it: `begin_checkout` and
 * `stripe_connect_started` redirect away to Stripe and are reported from the
 * server, and X deduplicates a pixel event against an API one only when both
 * carry the same `conversion_id`. Keeping the two routes disjoint is the
 * version that cannot be got wrong later.
 */
function reportXConversion(eventName, params = {}) {
    try {
        const eventId = window.__spXConversions?.[eventName];
        if (!eventId || typeof window.twq !== "function") return;

        const payload = {};

        // Only a revenue event carries money — `value: 0` on a signup teaches
        // the bidding that a signup is worth nothing.
        if (params.value !== undefined) {
            payload.value = params.value;
            payload.currency = params.currency || "GBP";
        }

        window.twq("event", eventId, payload);
    } catch {
        /* analytics must never break a confirmation screen */
    }
}
