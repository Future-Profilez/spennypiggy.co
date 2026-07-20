<?php

namespace App\Services;

use App\Helpers;
use App\Models\FinancialTransaction;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Turns a creator's own sales history into things they can act on: who their
 * best supporters are, who is drifting away, and what to do about it.
 *
 * The dashboard already shows *what was earned*. This answers *what to do next*.
 *
 * Every supporter-facing suggestion is advisory only — the platform never
 * exposes a supporter's contact details to a creator, and the copy says so.
 */
class CreatorOpportunityService
{
    /** Matches the ledger definition used by the dashboard and payout engine. */
    private const EXCLUDED_STATUSES = ['disputed', 'refunded', 'review_hold', 'pending', 'failed'];

    /** Spend (GBP, lifetime) at which a supporter is worth a personal thank-you. */
    private const HIGH_VALUE_GBP = 250.0;

    /** Days of silence before an established supporter counts as at risk. */
    private const AT_RISK_DAYS = 30;

    /** VIP lookups are a query each, so only the top slice gets enriched. */
    private const VIP_ENRICH_LIMIT = 10;

    public function __construct(private VipScoreService $vip) {}

    /** Everything the Opportunity Centre renders, in one call. */
    public function for(User $creator, string $currency = 'GBP'): array
    {
        $supporters = $this->supporters($creator, $currency);
        $retention = $this->retention($creator);
        $alerts = $this->alerts($supporters, $retention);

        return [
            'currency' => $currency,
            'supporters' => $supporters->take(self::VIP_ENRICH_LIMIT)->values()->all(),
            'retention' => $retention,
            'alerts' => $alerts,
            'actions' => $this->suggestedActions($creator, $supporters, $retention),
            'totals' => [
                'supporters' => $supporters->count(),
                'lifetime_value' => round((float) $supporters->sum('lifetime_spent'), 2),
                'average_supporter_value' => $supporters->isEmpty()
                    ? 0.0
                    : round((float) $supporters->sum('lifetime_spent') / $supporters->count(), 2),
            ],
        ];
    }

    /**
     * Per-supporter lifetime picture: total spent, purchase count, first and
     * last purchase, average order value — and a VIP tier for the top few.
     */
    public function supporters(User $creator, string $currency = 'GBP')
    {
        $rows = FinancialTransaction::query()
            ->where('user_id', $creator->id)
            ->where('type', 'income')
            ->whereNotIn('status', self::EXCLUDED_STATUSES)
            ->whereNotNull('supporter_id')
            ->select(
                'supporter_id',
                'currency',
                DB::raw('SUM(net_amount + COALESCE(vat_amount, 0)) as gross_total'),
                DB::raw('COUNT(*) as purchases'),
                DB::raw('MIN(transaction_date) as first_purchase'),
                DB::raw('MAX(transaction_date) as last_purchase'),
            )
            ->groupBy('supporter_id', 'currency')
            ->get();

        $bySupporter = [];

        foreach ($rows as $row) {
            $id = (int) $row->supporter_id;
            $from = strtoupper($row->currency ?? 'GBP');
            $amount = (float) $row->gross_total;
            $converted = $from === $currency
                ? $amount
                : (float) Helpers::priceFormat($from, $amount, $currency);

            if (! isset($bySupporter[$id])) {
                $bySupporter[$id] = [
                    'supporter_id' => $id,
                    'lifetime_spent' => 0.0,
                    'purchases' => 0,
                    'first_purchase' => $row->first_purchase,
                    'last_purchase' => $row->last_purchase,
                ];
            }

            $bySupporter[$id]['lifetime_spent'] += $converted;
            $bySupporter[$id]['purchases'] += (int) $row->purchases;

            if ($row->first_purchase < $bySupporter[$id]['first_purchase']) {
                $bySupporter[$id]['first_purchase'] = $row->first_purchase;
            }

            if ($row->last_purchase > $bySupporter[$id]['last_purchase']) {
                $bySupporter[$id]['last_purchase'] = $row->last_purchase;
            }
        }

        $collection = collect($bySupporter)
            ->sortByDesc('lifetime_spent')
            ->values();

        // Names/avatars for the slice we'll actually display.
        $topIds = $collection->take(self::VIP_ENRICH_LIMIT)->pluck('supporter_id')->all();
        $users = User::whereIn('id', $topIds)->get(['id', 'name', 'username', 'avatar'])->keyBy('id');

        return $collection->map(function ($row, $index) use ($users, $currency) {
            $user = $users->get($row['supporter_id']);
            $last = $row['last_purchase'] ? Carbon::parse($row['last_purchase']) : null;

            $row['name'] = $user->name ?? null;
            $row['username'] = $user->username ?? null;
            $row['avatar'] = $user->avatar ?? null;
            $row['currency'] = $currency;
            $row['lifetime_spent'] = round($row['lifetime_spent'], 2);
            $row['average_order_value'] = $row['purchases'] > 0
                ? round($row['lifetime_spent'] / $row['purchases'], 2)
                : 0.0;
            $row['days_since_last_purchase'] = $last ? (int) $last->diffInDays(now()) : null;
            $row['at_risk'] = $row['days_since_last_purchase'] !== null
                && $row['days_since_last_purchase'] >= self::AT_RISK_DAYS
                && $row['purchases'] > 1;

            // VIP tier is the supporter's platform-wide standing (same source as
            // the public leaderboard) — enriching every supporter would be a
            // query each, so only the displayed slice gets it.
            $row['vip'] = null;

            if ($index < self::VIP_ENRICH_LIMIT && $user) {
                $vip = $this->vip->for($user);
                $row['vip'] = [
                    'level' => $vip['level'] ?? null,
                    'icon' => $vip['icon'] ?? null,
                    'color' => $vip['color'] ?? null,
                    'score' => $vip['score'] ?? null,
                ];
            }

            return $row;
        });
    }

    /**
     * Supporter movement over the last 30 days.
     *
     * - new: first ever purchase landed in the window
     * - returning: bought in the window and had bought before it
     * - reactivated: returning, but their previous purchase was >60 days before
     * - lost: bought before the window, silent for 60+ days
     */
    public function retention(User $creator): array
    {
        $windowStart = now()->subDays(30);
        $dormantCutoff = now()->subDays(60);

        $rows = FinancialTransaction::query()
            ->where('user_id', $creator->id)
            ->where('type', 'income')
            ->whereNotIn('status', self::EXCLUDED_STATUSES)
            ->whereNotNull('supporter_id')
            ->select(
                'supporter_id',
                DB::raw('MIN(transaction_date) as first_purchase'),
                DB::raw('MAX(transaction_date) as last_purchase'),
            )
            ->groupBy('supporter_id')
            ->get();

        $new = $returning = $reactivated = $lost = 0;

        foreach ($rows as $row) {
            $first = Carbon::parse($row->first_purchase);
            $last = Carbon::parse($row->last_purchase);

            if ($last->lt($windowStart)) {
                if ($last->lt($dormantCutoff)) {
                    $lost++;
                }

                continue;
            }

            if ($first->gte($windowStart)) {
                $new++;

                continue;
            }

            $returning++;

            // Bought again after a long silence — worth treating differently
            // from a steady regular.
            $previous = FinancialTransaction::query()
                ->where('user_id', $creator->id)
                ->where('supporter_id', $row->supporter_id)
                ->where('type', 'income')
                ->whereNotIn('status', self::EXCLUDED_STATUSES)
                ->where('transaction_date', '<', $windowStart)
                ->max('transaction_date');

            if ($previous && Carbon::parse($previous)->lt($dormantCutoff)) {
                $reactivated++;
            }
        }

        return [
            'new' => $new,
            'returning' => $returning,
            'reactivated' => $reactivated,
            'lost' => $lost,
            'window_days' => 30,
        ];
    }

    /** Notable changes worth surfacing at the top of the page. */
    public function alerts($supporters, array $retention): array
    {
        $alerts = [];

        $topTier = $supporters->filter(
            fn ($s) => in_array($s['vip']['level'] ?? null, ['Platinum', 'Diamond'], true)
        );

        if ($topTier->isNotEmpty()) {
            $alerts[] = [
                'key' => 'top_tier_supporters',
                'severity' => 'good',
                'title' => 'You have top-tier supporters',
                'detail' => $topTier->count().' of your supporters are Platinum or Diamond on the platform.',
            ];
        }

        $atRisk = $supporters->where('at_risk', true);

        if ($atRisk->isNotEmpty()) {
            $alerts[] = [
                'key' => 'supporters_at_risk',
                'severity' => 'warning',
                'title' => 'Regular supporters have gone quiet',
                'detail' => $atRisk->count().' supporter(s) who used to buy regularly have not bought in over 30 days.',
            ];
        }

        if ($retention['new'] > 0) {
            $alerts[] = [
                'key' => 'new_supporters',
                'severity' => 'good',
                'title' => 'New supporters this month',
                'detail' => $retention['new'].' supporter(s) bought from you for the first time.',
            ];
        }

        return $alerts;
    }

    /**
     * Concrete next steps, ordered by value.
     *
     * Deliberately advisory: the platform does not hand a creator a supporter's
     * contact details, so anything outbound is framed as "through your own
     * channels, if appropriate".
     */
    public function suggestedActions(User $creator, $supporters, array $retention): array
    {
        $actions = [];

        $highValue = $supporters->firstWhere(
            fn ($s) => $s['lifetime_spent'] >= self::HIGH_VALUE_GBP && ! $s['at_risk']
        );

        if ($highValue) {
            $actions[] = [
                'key' => 'thank_high_value',
                'title' => 'Thank your top supporter',
                'detail' => ($highValue['name'] ?? 'A supporter').' has spent '
                    .number_format($highValue['lifetime_spent'], 2)
                    .' with you across '.$highValue['purchases'].' purchase(s). A personal thank-you goes a long way.',
                'hint' => 'Consider reaching out through your own social channels, if appropriate.',
            ];
        }

        $atRisk = $supporters->where('at_risk', true)->first();

        if ($atRisk) {
            $actions[] = [
                'key' => 'win_back',
                'title' => 'Win back a lapsed supporter',
                'detail' => ($atRisk['name'] ?? 'A supporter').' last bought '
                    .$atRisk['days_since_last_purchase'].' days ago after '.$atRisk['purchases'].' purchase(s).',
                'hint' => 'Posting new content is the most reliable way to bring regulars back.',
            ];
        }

        if ($retention['new'] > 0) {
            $actions[] = [
                'key' => 'welcome_new',
                'title' => 'Welcome your new supporters',
                'detail' => $retention['new'].' supporter(s) bought from you for the first time this month.',
                'hint' => 'First-time buyers who hear from a creator are far more likely to buy again.',
            ];
        }

        // Nudge the creator toward products they haven't published, because an
        // empty product type is revenue that simply cannot happen.
        $missing = $this->missingProductTypes($creator);

        foreach ($missing as $type) {
            $actions[] = [
                'key' => 'publish_'.$type['key'],
                'title' => $type['title'],
                'detail' => $type['detail'],
                'hint' => $type['hint'],
            ];
        }

        return $actions;
    }

    /** Product types this creator has never sold — each is unrealised revenue. */
    private function missingProductTypes(User $creator): array
    {
        $sold = FinancialTransaction::query()
            ->where('user_id', $creator->id)
            ->where('type', 'income')
            ->whereNotIn('status', self::EXCLUDED_STATUSES)
            ->distinct()
            ->pluck('source_type')
            ->map(fn ($t) => class_basename($t))
            ->all();

        $suggestions = [];

        if (! in_array('MembershipPayment', $sold, true)) {
            $suggestions[] = [
                'key' => 'membership',
                'title' => 'Offer a membership',
                'detail' => 'You have not sold a membership yet. Recurring content turns one-off buyers into steady income.',
                'hint' => 'A membership needs at least one on-platform content benefit to publish.',
            ];
        }

        if (! in_array('StripePaymentItems', $sold, true)) {
            $suggestions[] = [
                'key' => 'wish',
                'title' => 'Add a wishlist item',
                'detail' => 'Wishlist items are the quickest one-off content sale to set up.',
                'hint' => 'Each item needs a content deliverable, not just a goal.',
            ];
        }

        return $suggestions;
    }
}
