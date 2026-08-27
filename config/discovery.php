<?php

/**
 * Discovery — the feature flags that publish it, and the mock numbers the
 * marketing surfaces show until the real ones exist.
 *
 * 🚨 THE FLAGS LIVE HERE, IN CONFIG, RATHER THAN IN A JS CONSTANT ON PURPOSE.
 * The Developer Master Plan (19 Aug 2026, Section F) requires that flipping a
 * "Coming soon" label is a config change, not a deploy — a JS constant would
 * mean an edit, a rebuild and a release for every flip, which is exactly what
 * that rule exists to prevent. Copy still lives in
 * `resources/js/constants/discovery.js` (the house pattern — see
 * `constants/stablecoinTips.js`); only the on/off switches are here.
 *
 * ⚠️ These are read on the homepage AND, from Discovery Phase 2, on the creator
 * dashboard. Both surfaces render the SAME `DiscoveryStatsPanel` component, so
 * the flag is what decides whether it shows real numbers or the mock ones below
 * — not a second component and not a copy of the markup.
 */
return [

    /*
    |--------------------------------------------------------------------------
    | Discovery analytics — mock vs live
    |--------------------------------------------------------------------------
    |
    | FALSE  → the three-number panel renders the mock figures below with a
    |          "Discovery analytics — coming soon" badge. This is what the
    |          landing page and the /creators/discovery ad page show today.
    | TRUE   → the panel renders real per-creator numbers from the Phase 1
    |          attribution query, badge removed.
    |
    | Flip to true only when Phase 2 has shipped and the query returns real
    | data — the plan's standing rule is that nothing may be labelled LIVE NOW
    | in marketing that is not live in the product.
    |
    */
    'analytics_live' => env('DISCOVERY_ANALYTICS_LIVE', false),

    /*
    |--------------------------------------------------------------------------
    | The mock figures
    |--------------------------------------------------------------------------
    |
    | Supplied by the client in the Master Plan and used verbatim on every
    | marketing surface. They are illustrative and are always accompanied by the
    | coming-soon badge — never render these without it.
    |
    */
    'mock_stats' => [
        'introduced' => 428,
        'new_supporters' => 62,
        'attributed_earnings' => 625,
    ],

    /*
    |--------------------------------------------------------------------------
    | Discovery Phase 4 — Birthday Discovery
    |--------------------------------------------------------------------------
    |
    | 🚨 EVERYTHING IS BUILT; SENDING SHIPS SWITCHED OFF. The Developer Master
    | Plan (19 Aug 2026, §C Phase 4) is explicit: the whole feature works on
    | staging with the flags on, and it is released with them off until Jack
    | turns it on. Both switches are env-driven so a flip is a config change with
    | NO DEPLOY — the same rule that put the label map above in config rather
    | than in a JS constant.
    |
    | 🚨 THE BIRTH YEAR IS NEVER DISPLAYED PUBLICLY ANYWHERE. Nothing in this
    | block, and nothing reading it, may change that — see
    | `App\Services\Discovery\BirthdayDiscoveryService`, which selects
    | `birthday_day` / `birthday_month` and never `date_of_birth`.
    |
    */
    'birthday' => [

        /*
         * The three supporter reminders — 7 days before, 1 day before, on the
         * day — sent to a creator's EXISTING supporters. `birthday:remind` is
         * scheduled daily and no-ops (with a log line) while this is false.
         * Named exactly as the brief names it.
         *
         * 🚨 DEFAULT TRUE SINCE 26 Aug 2026 (client decision). The feature is
         * ON in every environment that does not explicitly turn it off — there
         * is no env var to set, and none is wanted. `DISCOVERY_BIRTHDAY_REMINDERS`
         * still overrides, so `=false` is the kill switch if it ever has to stop.
         *
         * ⚠️ NOTHING SENDS WITHOUT `queue:work` — the fan-out is queued per
         * recipient. A flag that is on with no worker running looks exactly like
         * a flag that is off.
         */
        'birthday_reminders' => env('DISCOVERY_BIRTHDAY_REMINDERS', true),

        /*
         * The Monday "Birthdays This Week" campaign to supporters AND creators,
         * one copy per person. `birthday:weekly` is scheduled Mondays and
         * no-ops while this is false.
         *
         * 🚨 DEFAULT TRUE SINCE 26 Aug 2026 (client decision), same as the
         * reminders above. This is the platform's LARGEST fan-out — every account
         * with an address — so `DISCOVERY_BIRTHDAYS_THIS_WEEK=false` remains the
         * way to stop it without a deploy.
         *
         * ⚠️ It still refuses to send below `collection_min_creators`, so a week
         * with too few opted-in birthdays sends nothing however this flag reads.
         */
        'birthdays_this_week' => env('DISCOVERY_BIRTHDAYS_THIS_WEEK', true),

        /*
         * How many opted-in, eligible creators must have a birthday in the week
         * before the Discover collection page shows real cards. Below this the
         * page renders its greyed "Coming soon" state — the brief asks for the
         * tile to exist and be honest, not to 404.
         *
         * ⚠️ This is deliberately NOT a flag. A collection that renders two
         * lonely cards is a worse advert for the feature than one that says it
         * is warming up, and the state has to answer to the real data rather
         * than to somebody remembering to flip a switch.
         */
        'collection_min_creators' => (int) env('DISCOVERY_BIRTHDAY_MIN_CREATORS', 3),

        /*
         * Up to ten creators in the Monday email and on the collection page —
         * the brief's number. Chosen by seeded rotation, never by earnings.
         */
        'max_featured' => 10,

        /*
         * Safety bound on one creator's fan-out for the reminder emails, matching
         * `CreatorEventNotifier::MAX_RECIPIENTS`.
         */
        'max_reminder_recipients' => 5000,

        /*
         * Recipients the Monday campaign mails in ONE run.
         *
         * ⚠️ Not a weekly quota. `birthday:weekly` is scheduled daily and its
         * claim key is the ISO WEEK, so a run that hits this cap is continued by
         * the next day's run and nobody is mailed twice — see the command's
         * class note. Lowering it slows the send; it never truncates it.
         */
        'weekly_batch' => (int) env('DISCOVERY_BIRTHDAY_WEEKLY_BATCH', 5000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Label state for every advertised Discovery capability
    |--------------------------------------------------------------------------
    |
    | 🚨 ONE MAP, READ BY ALL THREE MARKETING SURFACES (landing-page section,
    | /creators/discovery, /creators/link-in-bio). Each key is either 'live' or
    | 'coming_soon' and drives the LIVE NOW / COMING SOON label wherever that
    | capability is listed. Three pages listing the same capability can
    | therefore never disagree with each other, and a flip is one line here.
    |
    | The plan schedules four flips — each is a config change, no deploy:
    |   analytics          → when Discovery Phase 2 ships
    |   more_creators      → Mon 31 Aug, when Phase 3 goes live
    |   birthday           → when Phase 4 sending is switched on
    |   tips               → when Bridge access lands
    |
    | ⚠️ Everything marked 'live' below was verified against the codebase on
    | 20 Aug 2026 — a LIVE NOW label is a claim we may have to evidence:
    |   public_discovery      public /discover route (routes/auth.php)
    |   creator_search        DiscoveryService::getSearchCreators
    |   public_wishes         DiscoveryService::getFeaturedWishes, discover_wish
    |   promo_placements      homepage trending / new-verified / top-earners
    |   supporter_emails      AbandonedCheckoutReminder, ReactivationReminder,
    |                         StockBackInStock, ShopOrderReminderMail
    |   supporter_reminders   as above
    |   creator_push          PushSubscriptionController, RemindStalePushSubscriptions
    |   bio_phone             BioPageController + Pages/Bio/Show.jsx, layout-free
    | Do not move a key to 'live' without an equivalent line of evidence.
    |
    */
    'labels' => [
        // Block 1 — Get Discovered
        'public_discovery' => 'live',
        'creator_search' => 'live',
        'public_wishes' => 'live',
        'promo_placements' => 'live',
        /*
         * ✅ LIVE 26 Aug 2026 — Phase 3 and the Discover rebuild between them put
         * all three of these on a surface a visitor actually sees. Verified by
         * following each claim to the code that renders it, not to a service
         * method that exists: a collection nothing draws is not a live capability,
         * which is the standard `hidden_gems` was flipped under.
         *
         *   similar_creators        CreatorRecommendationService::SLOT_SIMILAR →
         *                           pickSimilar(), drawn with the "Similar creator"
         *                           chip in Components/discovery/MoreCreators.jsx on
         *                           every public profile; plus the `similar_creators`
         *                           collection on payment success (ThankYouController).
         *   more_creators           AuthenticatedSessionController sends the
         *                           `more_creators` prop → Dashboard.jsx renders
         *                           <MoreCreators> at the foot of every public profile.
         *   new_creator_collections Discover's own "New and verified" rail, plus the
         *                           `new_creators` collection on Discover search and
         *                           on payment success.
         *
         * ⚠️ `more_creators` was scheduled for Mon 31 Aug and shipped on 20 Aug. The
         * schedule is not the gate — "is it live in the product" is — and the only
         * direction that costs us is claiming something that is not.
         */
        'similar_creators' => 'live',
        'more_creators' => 'live',
        'new_creator_collections' => 'live',
        /*
         * ✅ LIVE 21 AUG 2026 — Discovery Phase 5 built the collection and
         * Phase 6 put it on the homepage, inside `CreatorShowcase`. Flipped in
         * the SAME release as that code, for the same reason `bio_direct_sales`
         * was: the label deploys with the app, so flipping it on a branch that
         * ships first would claim a capability nobody has.
         */
        'hidden_gems' => 'live',
        /*
         * ✅ LIVE 26 Aug 2026 — Discover draws its own "Trending creators" rail
         * (Pages/discover/Discover.jsx), ranked by DiscoveryService::rankedCreatorIds
         * on real signals; the `trending` collection also renders on Discover search.
         */
        'trending' => 'live',
        'almost_funded' => 'live',   // As hidden_gems — same collection service, same surface.
        'new_wishes' => 'coming_soon',
        'personalised' => 'coming_soon',

        // Block 2 — We'll Promote You
        'sitewide_promotion' => 'live',
        /*
         * ✅ LIVE 26 Aug 2026. It was COMING SOON for one reason only — the two
         * sending flags defaulted false, so `birthday:remind` and `birthday:weekly`
         * ran daily and reported "WOULD be sent. Nothing sent." Both now default
         * TRUE (client decision, see the `birthday` block above), so that reason is
         * gone and holding the label would under-claim a shipped feature.
         *
         * 🚨 ONE KEY DRIVES ALL SEVEN OF THIS BLOCK'S LABELS, so every one was
         * checked before flipping — a key cannot be half true:
         *   "7 days before" / "1 day before" / "on your birthday"
         *        BirthdayDiscoveryService::STAGES = [7, 1, 0], scheduled 09:30
         *   "Weekly Birthdays This Week email"
         *        birthday:weekly, scheduled 09:45
         *   "Sent to both creators and supporters"
         *        SendBirthdaysThisWeek selects User::query() with NO role filter —
         *        every account with an address, creators included
         *   "Up to 10 creators featured each week"
         *        discovery.birthday.max_featured = 10, read by featuredCreators()
         *   "Full Birthdays This Week Discover collection"
         *        /discover/birthdays — never flag-gated, answers to the DATA
         *
         * ⚠️ Live does not mean loud. Nothing sends without `queue:work`; the weekly
         * still refuses below `collection_min_creators`; and a creator appears only
         * with `birthday_discovery_opt_in` set, which defaults FALSE. A thin week is
         * a data state, not a broken capability.
         */
        'birthday' => 'live',
        'campaigns' => 'coming_soon',

        // Block 3 — Bring Supporters Back
        'supporter_emails' => 'live',
        'supporter_reminders' => 'live',
        'creator_push' => 'live',
        'deeper_reminders' => 'coming_soon',
        /*
         * ✅ LIVE 26 Aug 2026 — `reactivation:notify` is scheduled daily at 10:15
         * (Console/Kernel.php, not flag-gated) and `ReactivationReminder` builds every
         * creator link through DiscoverySources::profileUrl(..., 'personalised'), so
         * the re-engagement mail is literally Discovery-linked. That tagging is what
         * the claim says, and it is what the ledger records.
         */
        'reengagement' => 'live',
        'content_recommendations' => 'coming_soon',
        /*
         * ✅ LIVE 26 Aug 2026 — `CreatorContentObserver` (registered in
         * AppServiceProvider) has `WishItem` in its MAP and calls
         * CreatorEventNotifier::notifyFollowers when a wish goes live, gated on the
         * moderation flags so a held item never notifies.
         */
        'new_wish_reminders' => 'live',
        'activity_notifications' => 'coming_soon',

        /*
         * Link in Bio (A3).
         *
         * ✅ `bio_direct_sales` FLIPPED TO LIVE ON 20 AUG 2026, in the same
         * release that carries the B stream. It had shipped COMING SOON against
         * the brief's own "LIVE NOW" label — flagged to Jack rather than decided
         * quietly — because `/{username}/bio` sold nothing: its rows linked out
         * to profile pages, and direct selling was the B stream, due Fri 28 Aug,
         * three days AFTER this ad page goes live on Tue 25.
         *
         * ⚠️ THE FLIP MUST TRAVEL IN THE SAME RELEASE AS THE CODE IT CLAIMS.
         * The label lives in this file, so it deploys with the app — flipping it
         * on a branch that ships before B would put a LIVE NOW claim on a
         * capability no creator has. Verified before flipping:
         *   - `bio/buy/{item}` routed (BioPageController@buy -> real checkout)
         *   - `creator_bio_items` migration RAN; BioSellableItems::checkoutUrl
         *   - editor item picker: bio.items.store / .reorder / .update / .destroy
         *   - BioDirectSalesTest — 19 passed
         *
         * 🚩 ONE CLAUSE OF SECTION 6 IS STILL AHEAD OF THE PRODUCT and is a copy
         * question for Jack, not a flag: "Choose which items appear, in what
         * order, and what it looks like." The first two are live and the editor
         * also carries hide/show and custom button text — but there is NO theme,
         * colour or appearance control anywhere in `Pages/Bio/Edit.jsx`. Either
         * that clause comes out of the copy or a control gets built; the rest of
         * the section is genuinely live, so holding the whole key back over three
         * words would under-claim a shipped feature.
         *
         * `bio_phone` is genuinely live: the page renders no layout, opens on a
         * phone in one scroll, and has been shipped for some time.
         */
        'bio_direct_sales' => 'live',
        'bio_phone' => 'live',
        'tips' => 'coming_soon',
    ],
];
