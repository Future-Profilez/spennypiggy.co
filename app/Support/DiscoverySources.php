<?php

namespace App\Support;

/**
 * The two traffic classes, and the reserved Discovery source keys.
 *
 * 🚨 THIS IS THE WHOLE POINT OF DISCOVERY PHASE 1: every profile visit and every
 * purchase is recorded as either something the CREATOR brought us or something
 * SPENNY PIGGY put in front of the supporter. Without that split we cannot say
 * "Spenny Piggy introduced 428 people to your profile" and mean it, and every
 * later phase — the dashboard banner, the recommendation row, the birthday
 * emails, the whole "we show you what Discovery is worth" argument — is built on
 * this one distinction. Reference: Developer Master Plan, 19 Aug 2026, §C.
 *
 * 🚨 THE KEY LIST IS FIXED AND RESERVED. The brief names these twelve, and they
 * are written to the database and grouped by the monthly report. An unrecognised
 * key is coerced to `null` rather than stored, for the same reason
 * `VisitTracker::SOURCES` is a closed set: an unbounded value in a query string
 * lets any visitor create rows the reports then enumerate, and a typo becomes a
 * silent, permanent hole in a creator's numbers.
 *
 * ⚠️ `bio-link` IS CREATOR-GENERATED, not SP-generated. A creator's own link-in-
 * bio page is their traffic — the brief is explicit ("Sales from your link are
 * yours and always recorded as your own traffic"), and counting it as ours would
 * inflate exactly the number this system exists to make credible.
 */
class DiscoverySources
{
    /** Traffic Spenny Piggy put in front of the supporter. */
    public const CLASS_SP = 'sp';

    /** Traffic the creator brought — own socials, direct link, bio page, promo. */
    public const CLASS_CREATOR = 'creator';

    /**
     * The reserved keys, each mapped to the class it belongs to.
     *
     * ⚠️ Hyphenated, exactly as the brief prints them — these strings are
     * written to `discovery_events.source` and to
     * `financial_transactions.discovery_source`, and renaming one orphans every
     * row already attributed to it. Add a key; never rename one.
     */
    public const KEYS = [
        // SP-generated — a surface we control put the creator in front of someone.
        'more-creators' => self::CLASS_SP,
        'birthday-reminder' => self::CLASS_SP,
        'birthdays-this-week' => self::CLASS_SP,
        'new-creators' => self::CLASS_SP,
        'hidden-gems' => self::CLASS_SP,
        'trending' => self::CLASS_SP,
        'almost-funded' => self::CLASS_SP,
        'new-wishes' => self::CLASS_SP,
        'payment-success' => self::CLASS_SP,
        'search-recs' => self::CLASS_SP,
        'personalised' => self::CLASS_SP,

        /*
         * Discovery Phase 5 collections (Developer Master Plan, 19 Aug 2026 —
         * "reusable components across Discover, homepage, profiles, emails,
         * landing pages"). All three are SP-generated: the platform chose to put
         * that creator in front of that visitor.
         *
         * ⚠️ ADDING A KEY MEANS ADDING IT TO `resources/js/lib/discoveryLink.js`
         * TOO — a test asserts the two lists match, because a key the helper
         * offers but the server refuses is dropped silently and looks exactly
         * like a tagged link that works.
         */
        'spotlight' => self::CLASS_SP,
        'popular' => self::CLASS_SP,
        'memberships' => self::CLASS_SP,

        // Creator-generated — the creator's own audience, arriving their own way.
        'bio-link' => self::CLASS_CREATOR,
    ];

    /**
     * What to call each source WHEN A CREATOR IS READING IT.
     *
     * 🚨 A CREATOR MUST NEVER BE SHOWN A RAW KEY. `hidden-gems` and
     * `birthdays-this-week` are internal names for placements; a creator asking
     * "where did these people come from?" needs the answer in the words they
     * would use, and a key on a dashboard reads as a leak rather than an answer.
     *
     * ⚠️ THE PHRASING SAYS WHO DID THE WORK. An SP source is written from the
     * platform's side ("We showed you in…"); `bio-link` is the creator's OWN
     * traffic and says so. That distinction is the entire promise of the
     * Discovery feature — "what we brought you, on top of what you brought
     * yourself" — and a list that blurred the two would make the number
     * meaningless.
     *
     * ⚠️ An unlisted key falls back to a tidied form of the key rather than
     * being hidden: a placement nobody labelled is still traffic a creator
     * earned, and dropping it would quietly understate their own numbers.
     */
    public const LABELS = [
        'more-creators' => 'More creators to support',
        'birthday-reminder' => 'Birthday reminder we sent',
        'birthdays-this-week' => 'Birthdays This Week email',
        'new-creators' => 'New to Spenny Piggy',
        'hidden-gems' => 'Hidden Gems',
        'trending' => 'Trending',
        'almost-funded' => 'Almost Funded',
        'new-wishes' => 'New Wishes',
        'payment-success' => 'After someone checked out',
        'search-recs' => 'Search and recommendations',
        'personalised' => 'Recommended for you',
        'spotlight' => 'Creator Spotlight',
        'popular' => 'Popular Right Now',
        'memberships' => 'Memberships to Discover',
        'bio-link' => 'Your own link in bio',
    ];

    /** The creator-facing name for a source key. */
    public static function label(?string $key): string
    {
        $key = self::normalise($key);

        if ($key === null) {
            return 'Somewhere else';
        }

        return self::LABELS[$key] ?? ucfirst(str_replace('-', ' ', $key));
    }

    /**
     * Surfaces that exist TODAY and are tagged as SP-generated.
     *
     * ⚠️ Kept separate from `KEYS` so it is obvious at a glance which of the
     * twelve are actually wired up and which are reserved for a phase that has
     * not shipped. A key here but not in `KEYS` would be stored and then never
     * reported on, so `DiscoveryAttributionTest` asserts this is a subset.
     */
    public const LIVE_KEYS = [
        // Discovery Phase 3 — the "More creators to support" row at the foot of
        // every public creator profile (`Components/discovery/MoreCreators.jsx`,
        // fed by `Services\Discovery\CreatorRecommendationService`). The slot
        // that produced the click — similar / emerging / popular / pick — rides
        // along as the CAMPAIGN (`sp_c`), so the row can be read back per slot
        // without needing four reserved source keys.
        'more-creators',

        // Homepage showcase (`Pages/home/CreatorShowcase.jsx`), Discover's
        // "Trending Creators" and "Top Earners This Week" carousels, the
        // Discover hero ticker, and every creator link on the public
        // leaderboard (podium, rail, category leaders, climbers, growth).
        'trending',

        // Homepage showcase + Discover's "New & Verified" carousel.
        'new-creators',

        // Discover's search suggestions, its result grid (creator, wish, bill
        // and shop cards), its featured Bills/Memberships/Tasks/Shops
        // carousels, and the intro-videos rail.
        'search-recs',

        // Discover's featured wish carousels and the hero's wish ticker rows.
        'new-wishes',

        // Automated supporter e-mail that names a creator picked for THIS
        // supporter: the reactivation reminder and the abandoned-checkout
        // "take another look" link.
        'personalised',

        // Phase 4 birthday surfaces: the 7-day / 1-day / on-the-day supporter
        // reminders, and the Monday "Birthdays This Week" campaign plus its
        // Discover collection. Wired and tagging; SENDING is flagged off
        // (`discovery.birthday.*`), so these produce no traffic until Jack
        // switches them on.
        'birthday-reminder',
        'birthdays-this-week',

        // The creator's OWN link-in-bio page (`/{username}/bio`) — recorded as
        // CREATOR-generated, never SP. It is listed here because the surface is
        // wired, not because it counts towards our number.
        'bio-link',
    ];

    /** The query parameter a tagged link carries, e.g. `?sp_d=trending`. */
    public const PARAM = 'sp_d';

    /**
     * A tagged absolute profile URL, for Blade and for mailables.
     *
     * 🚨 The JS side has `resources/js/lib/discoveryLink.js`; e-mail templates
     * are Blade, so they need the same thing server-side rather than a
     * hand-built query string in a view. Hand-building is how a typo gets
     * shipped, and an unrecognised key is dropped in silence — which looks
     * exactly like a tagged link that works.
     *
     * ⚠️ An unknown or null source returns the plain profile URL rather than a
     * URL carrying a key the server will refuse. Untagged traffic is classed as
     * CREATOR-generated, which is the safe direction to fail: it under-claims
     * our own contribution instead of inflating it.
     */
    public static function profileUrl(?string $username, ?string $source = null): string
    {
        $username = trim((string) $username);

        if ($username === '') {
            return url('/');
        }

        $source = self::normalise($source);

        return $source === null
            ? url('/'.$username)
            : url('/'.$username.'?'.self::PARAM.'='.$source);
    }

    /**
     * Days a Discovery source stays attributable to a later purchase.
     *
     * Matches `VisitTracker::ATTRIBUTION_DAYS` and the brief's "Attribution
     * window: 30 days unless Jack says otherwise".
     */
    public const WINDOW_DAYS = 30;

    /** The cookie holding the visitor's most recent Discovery source, per creator. */
    public const COOKIE = 'sp_disc';

    public static function isKnown(?string $key): bool
    {
        return $key !== null && array_key_exists($key, self::KEYS);
    }

    /** Null for anything not on the reserved list — never store a stranger's string. */
    public static function normalise(?string $key): ?string
    {
        if ($key === null) {
            return null;
        }

        $key = strtolower(trim($key));

        return self::isKnown($key) ? $key : null;
    }

    /**
     * Which class a key belongs to.
     *
     * ⚠️ An unknown key is CREATOR-generated, not SP. The number we publish is
     * "how many people SP brought you", so the safe direction to fail is the one
     * that under-claims — an unrecognised source must never inflate our own
     * contribution.
     */
    public static function classFor(?string $key): string
    {
        return self::KEYS[self::normalise($key)] ?? self::CLASS_CREATOR;
    }

    public static function isSpGenerated(?string $key): bool
    {
        return self::classFor($key) === self::CLASS_SP;
    }

    /**
     * Did the CREATOR bring this visitor, as a matter of record?
     *
     * ⚠️ Deliberately NOT `! isSpGenerated()`. `classFor()` answers
     * CLASS_CREATOR for an unknown or absent key, because the published figure
     * is "how many people SP brought you" and under-claiming is the safe
     * direction there. A caller deciding whether to SHOW something needs the
     * opposite guarantee: direct and organic traffic carries no source, and must
     * not be read as the creator's own audience.
     */
    public static function isCreatorGeneratedVisit(?string $key): bool
    {
        $key = self::normalise($key);

        return $key !== null && self::classFor($key) === self::CLASS_CREATOR;
    }
}
