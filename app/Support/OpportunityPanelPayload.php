<?php

namespace App\Support;

use App\Models\User;
use App\Services\CreatorOpportunityService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * The ONE shape the Enhanced Creator Earnings module sends to a creator's own
 * dashboard, and the ONE place the brief's nine rows are enumerated.
 *
 * Client brief: "Spenny Piggy · Developer Master Plan", 19 Aug 2026, §C. Row 9
 * asks for this module to sit **alongside the Discovery panel** so the dashboard
 * tells one story — what Spenny Piggy brought you, what it is worth, what to do
 * next. It is deliberately the same arrangement as `DiscoveryPayload`: a small
 * cached payload assembled server-side, rendered by one component, never a page
 * assembling its own copy of the array. A screen that builds its own payload is a
 * screen that can be handed a different row list from the others.
 *
 * 🚨 THE ROW LIST IS FIXED AND COMES FROM CONFIG, NOT FROM THE DATA. The brief's
 * instruction is that a row not ready "is shown greyed with 'Coming soon' rather
 * than missing", so `rows()` always returns all nine in order and only their
 * `live` flag varies. A creator with no sales still sees nine rows of zeros —
 * zero is a state, not an absence, the same rule the Discovery panel follows.
 *
 * ⚠️ SUPPORTER PRIVACY IS UNCHANGED AND NARROWER HERE THAN ON THE FULL PAGE:
 * display name (or Anonymous), amount, country. No email, ever. `supporterCard()`
 * whitelists keys by name rather than spreading the service's row, so a field
 * added to that row for some other purpose cannot arrive on a dashboard by
 * accident — the same defence `CreatorRecommendationService::card()` uses.
 */
final class OpportunityPanelPayload
{
    /**
     * The nine rows, in the brief's own order, with the label each is shown under.
     *
     * ⚠️ The keys must match `config('earnings_intelligence.rows')`. A key with no
     * config entry greys, which is the safe direction — a row nobody recorded a
     * verdict for must not claim to be live.
     */
    private const ROWS = [
        ['key' => 'top_supporters', 'label' => 'Top supporters'],
        ['key' => 'revenue_by_feature', 'label' => 'Revenue by feature'],
        ['key' => 'lifetime_value', 'label' => 'Supporter lifetime value'],
        ['key' => 'retention', 'label' => 'Retention'],
        ['key' => 'vip_alerts', 'label' => 'VIP alerts'],
        ['key' => 'suggested_actions', 'label' => 'Suggested actions'],
        ['key' => 'reminder_action', 'label' => 'Platform reminders'],
        ['key' => 'social_prompt', 'label' => 'Outreach guidance'],
        ['key' => 'on_dashboard', 'label' => 'On your dashboard'],
    ];

    /** Is one row live? An unknown key greys. */
    public static function rowIsLive(string $key): bool
    {
        return (bool) config('earnings_intelligence.rows.'.$key, false);
    }

    /** All nine rows with their live/coming-soon state, always in brief order. */
    public static function rows(): array
    {
        return array_map(
            fn (array $row) => $row + ['live' => self::rowIsLive($row['key'])],
            self::ROWS
        );
    }

    /**
     * The compact payload for the creator's own dashboard.
     *
     * 🚨 CALL THIS ONLY FOR THE OWNER OF A ROLE-1 PROFILE. `/{username}` is the
     * PUBLIC profile as well as the creator's dashboard, and every figure below
     * — who supports them, how much each has spent, who is drifting — is private
     * to the creator. The gate lives at the call site for the same reason the
     * Discovery panel's does, and the value is `null` for everybody else: null is
     * "not your dashboard", never "no data yet".
     *
     * ⚠️ Returns null when row 9 is switched off, which removes the module from
     * the dashboard without touching the standalone page.
     */
    public static function forDashboard(User $creator, string $currency = 'GBP'): ?array
    {
        if (! self::rowIsLive('on_dashboard')) {
            return null;
        }

        $currency = strtoupper($currency ?: 'GBP');
        $ttl = (int) config('earnings_intelligence.panel_cache_seconds', 300);
        $key = 'opportunity_panel_v1_'.$creator->id.'_'.$currency;

        /*
         * ⚠️ WRAPPED, AND A FAILURE COSTS THE PANEL, NEVER THE PROFILE. This rides
         * on the public profile route. An analytics roll-up must not be able to
         * 500 a creator's page — and, worse, every visitor's view of it.
         */
        try {
            return Cache::remember($key, $ttl, fn () => self::build($creator, $currency));
        } catch (\Throwable $e) {
            Log::warning('Opportunity dashboard panel failed', [
                'creator_id' => $creator->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /** Drop the cached panel for one creator — call after anything that changes their sales. */
    public static function forget(int $creatorId, string $currency = 'GBP'): void
    {
        Cache::forget('opportunity_panel_v1_'.$creatorId.'_'.strtoupper($currency ?: 'GBP'));
    }

    private static function build(User $creator, string $currency): array
    {
        $service = app(CreatorOpportunityService::class);

        $supporters = $service->supporters($creator, $currency);
        $retention = $service->retention($creator);

        $supporterRows = (int) config('earnings_intelligence.panel_supporter_rows', 3);
        $actionRows = (int) config('earnings_intelligence.panel_action_rows', 3);

        $liveTop = self::rowIsLive('top_supporters');
        $liveAlerts = self::rowIsLive('vip_alerts');
        $liveActions = self::rowIsLive('suggested_actions');

        return [
            'currency' => $currency,
            'rows' => self::rows(),

            // Row 8. Always sent when live — the full page and this module must
            // never word the same standing prompt differently.
            'social_prompt' => self::rowIsLive('social_prompt')
                ? CreatorOpportunityService::SOCIAL_CHANNELS_PROMPT
                : null,

            // Row 7. A false flag HIDES the control rather than greying it: this
            // is the one row that sends mail to a supporter.
            'reminders_enabled' => self::rowIsLive('reminder_action'),

            'totals' => [
                'supporters' => $supporters->count(),
                // LedgerRules::buyerPaid — what supporters were charged.
                'lifetime_value' => round((float) $supporters->sum('lifetime_spent'), 2),
                'monthly_value' => round((float) $supporters->sum('monthly_spent'), 2),
                // LedgerRules::creatorGross — what the creator kept on those sales.
                'lifetime_earned' => round((float) $supporters->sum('lifetime_earned'), 2),
                'average_supporter_value' => $supporters->isEmpty()
                    ? 0.0
                    : round((float) $supporters->sum('lifetime_spent') / max($supporters->count(), 1), 2),
            ],

            // Rows 1 + 3 — the same query answers both, so the card carries the
            // lifetime-value fields alongside the ranking ones.
            'supporters' => $liveTop
                ? $supporters->take($supporterRows)->map(fn ($row) => self::supporterCard($row, $currency))->values()->all()
                : [],

            // Row 2. ⚠️ `revenueByType()` directly, NOT `for()['revenue_by_type']` —
            // `for()` also builds the abandoned-checkout panel and the listing
            // performance scan, neither of which this module renders, and it would
            // repeat the supporter roll-up already computed above.
            'revenue_by_feature' => self::rowIsLive('revenue_by_feature')
                ? $service->revenueByType($creator, $currency)
                : [],

            // Row 4. Every bucket is present at zero — "you lost nobody" is an
            // answer and reads very differently from a blank.
            'retention' => self::rowIsLive('retention')
                ? [
                    'new' => (int) ($retention['new'] ?? 0),
                    'returning' => (int) ($retention['returning'] ?? 0),
                    'reactivated' => (int) ($retention['reactivated'] ?? 0),
                    'lost' => (int) ($retention['lost'] ?? 0),
                    'window_days' => (int) ($retention['window_days'] ?? 30),
                ]
                : null,

            // Row 5.
            'alerts' => $liveAlerts
                ? array_map(
                    fn ($a) => [
                        'key' => $a['key'] ?? '',
                        'severity' => $a['severity'] ?? 'good',
                        'title' => $a['title'] ?? '',
                        'detail' => $a['detail'] ?? '',
                    ],
                    $service->alerts($creator, $supporters, $retention, $currency)
                )
                : [],

            // Row 6.
            'actions' => $liveActions
                ? array_slice(array_map(
                    fn ($a) => [
                        'key' => $a['key'] ?? '',
                        'title' => $a['title'] ?? '',
                        'detail' => $a['detail'] ?? '',
                        'hint' => $a['hint'] ?? null,
                    ],
                    $service->suggestedActions($creator, $supporters, $retention, $currency)
                ), 0, $actionRows)
                : [],
        ];
    }

    /**
     * One supporter, reduced to what a creator is allowed to see.
     *
     * 🚨 KEYS ARE WHITELISTED BY NAME. Spreading the service's row would publish
     * `supporter_id`, `username` and anything a later change adds to it. A
     * creator does not need the platform id of the person who bought from them to
     * read this card, and the brief's privacy rule is three fields.
     *
     * ⚠️ "Anonymous" is the fallback, not an empty string. A supporter whose
     * account is gone still bought something, and a nameless row reads as a
     * rendering fault rather than as a deliberate absence of a name.
     */
    private static function supporterCard(array $row, string $currency): array
    {
        return [
            'name' => trim((string) ($row['name'] ?? '')) !== '' ? $row['name'] : 'Anonymous',
            'country' => $row['country'] ?? null,
            'currency' => $currency,
            // Row 1 — what they have spent with this creator.
            'lifetime_spent' => (float) ($row['lifetime_spent'] ?? 0),
            'monthly_spent' => (float) ($row['monthly_spent'] ?? 0),
            'purchases' => (int) ($row['purchases'] ?? 0),
            'last_purchase' => $row['last_purchase'] ?? null,
            // Row 3 — the lifetime-value fields.
            'first_purchase' => $row['first_purchase'] ?? null,
            'average_order_value' => (float) ($row['average_order_value'] ?? 0),
            'days_since_last_purchase' => $row['days_since_last_purchase'] ?? null,
            'at_risk' => (bool) ($row['at_risk'] ?? false),
            // The VIP badge, from VipScoreService via the service — level/icon/colour
            // only, never the underlying score breakdown.
            'vip' => isset($row['vip']) && is_array($row['vip'])
                ? [
                    'level' => $row['vip']['level'] ?? null,
                    'icon' => $row['vip']['icon'] ?? null,
                    'color' => $row['vip']['color'] ?? null,
                ]
                : null,
        ];
    }
}
