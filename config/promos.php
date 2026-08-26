<?php

/*
 * The promo deck — every feature announcement the creator/fan slider can show.
 *
 * 🚨 THIS FILE IS THE ONLY PLACE A NEW PROMO IS ADDED. Before this existed, each
 * promo was its own always-on banner component stacked on the profile page, and
 * five of them shipped that way — Founder tracker, OfferAnnouncement,
 * ReferralBanner, FeatureSuggestionBanner and a right-rail membership promo, all
 * visible at once above "About me". Adding a sixth was a JSX edit, so there was
 * nothing to stop a seventh. A config entry with a `priority` and an `audience`
 * is a decision someone has to make on purpose.
 *
 * ⚠️ `priority` is a WEIGHT, not a sort order. The slider opens on a
 * weighted-random pick, so a priority-10 promo is the most LIKELY first card, not
 * the guaranteed one — otherwise the lower-priority half of the deck would only
 * ever be seen by someone who swipes.
 *
 * ⚠️ Eligibility is NOT here, deliberately — it needs the database, and a config
 * file that reads the DB cannot be cached. It lives in PromoBannerService, keyed
 * by the same array key. A promo whose key has no eligibility rule there is
 * always shown to its audience.
 *
 * `audience`: creator | gifter | both. A logged-out visitor sees the whole deck
 * (nothing is eligibility-filtered for them either) — they are the audience the
 * features are being advertised TO.
 *
 * `ground` + `accent`: every card carries TWO brand colours — the ground it is
 * printed on, and a second colour for its spine and art panel. One colour per card
 * made nine cards that were only distinguishable by hue; a PAIR gives each one a
 * combination. `ground` is pink | yellow | mint | violet | black | white-pink |
 * white-mint; `accent` is pink | yellow | mint | violet. Never set them to the same
 * hue — the spine would disappear into the card.
 *
 * ⚠️ Keep headlines to about 34 characters. The card is a FIXED height (so nine
 * cards in a slider cannot jump as you swipe) and clamps the headline at two lines.
 *
 * 🚨 `layout` names the COMPOSITION, and every promo has its own. There is no
 * shared card body — see `resources/js/Components/Promo/PromoLayouts.jsx`. Three
 * earlier passes drew all nine from one template and recoloured it, and however good
 * the palette got it still read as one card shown nine times, because the eye reads
 * layout before colour. A promo with no `layout` (and every announcement) falls to
 * `statement`, the only layout that renders its copy generically.
 *
 * `action`: used INSTEAD of `route` when the CTA is not a navigation —
 * `suggest_feature` opens the existing modal, `pwa_install` fires the browser's
 * own install prompt.
 */

return [

    /*
     * 6 seconds. Long enough to read a headline, a one-line body and a button
     * without racing; short enough that the deck cycles while a creator reads
     * their own page. Autoplay is suppressed entirely under prefers-reduced-motion.
     */
    'autoplay_ms' => 6000,

    /*
     * How long a viewer's resolved deck is cached. Eligibility ("has this creator
     * made a sale yet", "do they have any bio links") costs queries, and the deck
     * is shared on EVERY Inertia response — so it is resolved once and reused.
     * Five minutes is the cost of a promo lingering slightly past the moment it
     * stopped applying, which is harmless; an uncached deck is a handful of
     * queries on every page view, which is not.
     */
    'cache_ttl' => 300,

    'banners' => [

        'founder_bonus' => [
            'priority' => 10,
            'layout' => 'founder',
            'audience' => 'creator',
            'ground' => 'mint',
            'accent' => 'violet',
            'art' => 'meter',
            'eyebrow' => 'Founder bonus',
            'headline' => 'Earn £2,500, keep the bonus',
            'body' => 'Hit £2,500 in your first 30 days and we pay you a founder bonus on top.',
            'cta' => 'See your progress',
            'route' => 'founder.bonus',
        ],

        'fast_start' => [
            'priority' => 9,
            'layout' => 'faststart',
            'audience' => 'creator',
            'ground' => 'pink',
            'accent' => 'yellow',
            'art' => 'stopwatch',
            'eyebrow' => 'Fast Start',
            'headline' => 'A bonus for starting fast',
            'body' => 'Sell in your first weeks and we top up your earnings automatically.',
            'cta' => 'How it works',
            'route' => 'financial.fast-start-bonus',
        ],

        'free_until_first_sale' => [
            'priority' => 8,
            'layout' => 'receipt',
            'audience' => 'creator',
            'ground' => 'yellow',
            'accent' => 'violet',
            'art' => 'receipt',
            'eyebrow' => 'No charge yet',
            'headline' => 'Free until your first sale',
            'body' => 'Your subscription starts billing after you sell, not before.',
            'cta' => 'See the plan',
            'route' => 'activate-subscription',
        ],

        'verified_badge' => [
            'priority' => 7,
            'layout' => 'badge',
            'audience' => 'creator',
            'ground' => 'violet',
            'accent' => 'mint',
            'art' => 'badge',
            'eyebrow' => 'Verification',
            'headline' => 'Get your verified badge',
            'body' => 'Verified creators sell more. It takes one ID check.',
            'cta' => 'Verify me',
            'route' => 'stripe.identity.verification',
        ],

        'refer_and_earn' => [
            'priority' => 6,
            'layout' => 'split',
            'audience' => 'creator',
            'ground' => 'white-pink',
            'accent' => 'pink',
            'art' => 'chain',
            'eyebrow' => 'Referrals',
            'headline' => 'Bring a creator, earn with them',
            'body' => 'Share your link. You earn when the creators you refer start selling.',
            'cta' => 'Get my link',
            'route' => 'refer-and-earn',
        ],

        'supporter_wall' => [
            'priority' => 5,
            'layout' => 'ranking',
            'audience' => 'gifter',
            'ground' => 'pink',
            'accent' => 'mint',
            'art' => 'podium',
            'eyebrow' => 'Leaderboard',
            'headline' => 'Your name on their wall',
            'body' => 'Supporters are ranked on every creator page. See where you land.',
            'cta' => 'View leaderboard',
            'route' => 'leaderboard',
        ],

        /*
         * 🚨 THE FEATURE WAS UNREACHABLE WITHOUT THIS. Birthday Discovery is built
         * end to end, but the opt-in lives inside Creator Studio on the account
         * page and nothing pointed at it — so a creator had to wander into their
         * own settings to discover a feature exists. No opt-in means no place in
         * the collection and no place in the Monday e-mail, which means the whole
         * feature has nothing to show.
         *
         * ⚠️ Eligibility is "creator who has NOT opted in" — see
         * PromoBannerService::isEligible(). It disappears the moment they act.
         */
        'birthday_discovery' => [
            'priority' => 7,
            'layout' => 'birthday',
            'audience' => 'creator',
            'ground' => 'cream',
            'accent' => 'yellow',
            'eyebrow' => 'One field',
            'headline' => 'Add your birthday',
            'body' => 'Your supporters get reminded before the day.',
            'cta' => 'Add it now',
            'route' => 'account',
        ],

        'link_in_bio' => [
            'priority' => 5,
            'layout' => 'bio',
            'audience' => 'creator',
            'ground' => 'black',
            'accent' => 'mint',
            'art' => 'urlbar',
            'eyebrow' => 'Two minutes',
            'headline' => 'One link for everything',
            'body' => 'Put your whole shop behind the single link in your bio.',
            'cta' => 'See my page',
            'route' => 'bio.edit',
        ],

        'pwa_install' => [
            'priority' => 4,
            'layout' => 'install',
            'audience' => 'both',
            'ground' => 'violet',
            'accent' => 'yellow',
            'art' => 'phone',
            'eyebrow' => 'Free',
            'headline' => 'Put us on your home screen',
            'body' => 'Install the app and get sale alerts the moment they happen.',
            'cta' => 'Install the app',
            'action' => 'pwa_install',
        ],

        'suggest_feature' => [
            'priority' => 2,
            'layout' => 'suggest',
            'audience' => 'both',
            'ground' => 'white-mint',
            'accent' => 'mint',
            'art' => 'speech',
            'eyebrow' => 'Open to ideas',
            'headline' => 'Tell us what to build next',
            'body' => 'The features creators ask for are the ones that get built.',
            'cta' => 'Suggest a feature',
            'action' => 'suggest_feature',
        ],

    ],

    /*
     * Timed announcements — news, not features.
     *
     * These are what keep the deck worth reopening. A slider that holds the same
     * nine evergreen cards forever is read once and ignored; an announcement that
     * appears for a fortnight and then leaves is the reason someone swipes again.
     *
     * ⚠️ `starts_at` / `ends_at` are ISO strings or null. Null start = live now,
     * null end = never expires (avoid — an announcement with no end becomes an
     * evergreen banner that nobody remembers adding).
     *
     * Priority is deliberately above every feature card: an announcement is
     * time-boxed, so if it does not lead the deck while it is live, it never will.
     */
    'announcements' => [
        // 'seats_running_out' => [
        //     'priority'  => 99,
        //     'audience'  => 'creator',
        //     'ground'    => 'yellow',
        //     'art'       => 'meter',
        //     'eyebrow'   => 'Founder seats',
        //     'headline'  => 'Under 50 founder seats left',
        //     'body'      => 'The founder bonus closes when the seats are gone.',
        //     'cta'       => 'Check your progress',
        //     'route'     => 'founder.bonus',
        //     'starts_at' => '2026-09-01 00:00:00',
        //     'ends_at'   => '2026-09-15 00:00:00',
        // ],
    ],

];
