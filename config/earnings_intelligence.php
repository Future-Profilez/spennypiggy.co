<?php

/**
 * Enhanced Creator Earnings Dashboard + Revenue Opportunity Centre — which of the
 * brief's nine rows is LIVE and which ships greyed as "Coming soon".
 *
 * Client brief: "Spenny Piggy · Developer Master Plan", 19 Aug 2026, §C
 * (`../docs/client/19 Aug/`). Its own instruction for this module is explicit:
 *
 *   "All nine rows below are on the dashboard with real data. Any row not ready
 *    by the date is shown greyed with 'Coming soon' rather than missing."
 *
 * 🚨 A MISSING ROW IS THE FAILURE MODE THIS FILE PREVENTS. The brief would rather
 * a creator saw nine rows with two greyed than four rows and no explanation — a
 * greyed row says "this is coming", an absent one says "they didn't build it".
 * So the component renders from this list, never from whether data happened to
 * arrive: an empty row still draws, and only a false flag greys it.
 *
 * 🚨 THE FLAGS ARE IN PHP CONFIG, NOT IN A JS CONSTANT — the same rule and the
 * same reason as `config/discovery.php`. Section F of the plan requires that
 * flipping a "Coming soon" label is a config change with NO deploy; a JS constant
 * means an edit, a rebuild and a release. Copy lives in
 * `resources/js/constants/earningsIntelligence.js` (the house pattern); only the
 * on/off switches are here.
 *
 * ⚠️ An unknown key greys. That is the safe direction: a row nobody has recorded
 * a verdict for must not claim to be live.
 */
return [

    /*
    |--------------------------------------------------------------------------
    | The nine rows
    |--------------------------------------------------------------------------
    |
    | Keyed by the row's short name. `true` = live with real data; `false` =
    | rendered greyed with a "Coming soon" badge and no figures.
    |
    | All nine are live as of 21 Aug 2026. They are still listed individually
    | rather than collapsed to a single `enabled` flag, because the whole point
    | of the brief's instruction is that ONE row can regress to "Coming soon"
    | without taking the module off the dashboard with it.
    |
    */
    'rows' => [

        // Row 1 — top supporters: VIP badge, lifetime spend, monthly spend,
        // last purchase, purchase count. CreatorOpportunityService::supporters().
        'top_supporters' => env('EI_ROW_TOP_SUPPORTERS', true),

        // Row 2 — revenue split by feature. ::revenueByType().
        'revenue_by_feature' => env('EI_ROW_REVENUE_BY_FEATURE', true),

        // Row 3 — supporter lifetime value: first/last purchase, AOV, count.
        // Same query as row 1; flagged separately because it is a separate claim.
        'lifetime_value' => env('EI_ROW_LIFETIME_VALUE', true),

        // Row 4 — retention: new / returning / reactivated / lost. ::retention().
        'retention' => env('EI_ROW_RETENTION', true),

        // Row 5 — VIP alerts: new whale, new Platinum, returning whale,
        // high-value purchase, churn risk. ::alerts().
        'vip_alerts' => env('EI_ROW_VIP_ALERTS', true),

        // Row 6 — suggested actions. ::suggestedActions().
        'suggested_actions' => env('EI_ROW_SUGGESTED_ACTIONS', true),

        // Row 7 — an action can trigger a platform reminder email/push.
        // CreatorFinancialController::remindSupporter(), route
        // `financial.opportunities.remind`, throttle:10,1.
        //
        // ⚠️ FALSE MUST HIDE THE BUTTON, NOT JUST GREY IT. Every other row is a
        // read; this one sends mail to a supporter. A greyed-but-clickable
        // control on a sending path is a different class of mistake.
        'reminder_action' => env('EI_ROW_REMINDER_ACTION', true),

        // Row 8 — the social-channels prompt. Copy lives in
        // CreatorOpportunityService::SOCIAL_CHANNELS_PROMPT.
        //
        // ⚠️ This one is a PRIVACY CONTROL, not a feature. It is the answer to
        // "how do I contact them?" that stops the question becoming "show me
        // their email". Turning it off is not a supported state; it is listed
        // for completeness of the nine and should stay true.
        'social_prompt' => env('EI_ROW_SOCIAL_PROMPT', true),

        // Row 9 — the module sits alongside the Discovery panel on the creator's
        // own dashboard. False removes the dashboard module entirely; the
        // standalone /financial/opportunities page is unaffected.
        'on_dashboard' => env('EI_ROW_ON_DASHBOARD', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Dashboard module
    |--------------------------------------------------------------------------
    */

    /*
     | How long the compact dashboard payload is cached, in seconds.
     |
     | ⚠️ This rides on the creator's own profile page, which is also the PUBLIC
     | profile and one of the most-hit routes on the site. Uncached it would add
     | a supporter roll-up, a retention scan and a revenue group-by to a page
     | load. 300s matches `DiscoveryPayload::dashboardStatsFor`, which sits
     | directly above it in the same column — two panels beside each other that
     | refresh on different clocks read as one of them being broken.
     */
    'panel_cache_seconds' => env('EI_PANEL_CACHE_SECONDS', 300),

    /** Top supporters listed in the compact dashboard module (the full page shows ten). */
    'panel_supporter_rows' => 3,

    /** Suggested actions listed in the compact dashboard module. */
    'panel_action_rows' => 3,
];
