<?php

namespace App\Services;

use App\Helpers;
use App\Models\AbandonedCheckout;
use App\Models\FinancialTransaction;
use App\Models\User;
use App\Models\WishItem;
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

    /** How far back the abandoned-checkout panel looks. */
    private const ABANDONED_WINDOW_DAYS = 30;

    /** Rows listed individually under the abandoned-checkout headline figures. */
    private const ABANDONED_LIST_LIMIT = 8;

    public function __construct(private VipScoreService $vip) {}

    /** Everything the Opportunity Centre renders, in one call. */
    public function for(User $creator, string $currency = 'GBP'): array
    {
        $supporters = $this->supporters($creator, $currency);
        $retention = $this->retention($creator);
        $alerts = $this->alerts($creator, $supporters, $retention);

        return [
            'currency' => $currency,
            'supporters' => $supporters->take(self::VIP_ENRICH_LIMIT)->values()->all(),
            'tiers' => $this->tierDistribution($supporters->pluck('supporter_id')->all()),
            'retention' => $retention,
            'alerts' => $alerts,
            'abandoned' => $this->abandonedCheckouts($creator, $currency),
            'actions' => $this->suggestedActions($creator, $supporters, $retention),
            'totals' => [
                'supporters' => $supporters->count(),
                'lifetime_value' => round((float) $supporters->sum('lifetime_spent'), 2),
                'monthly_value' => round((float) $supporters->sum('monthly_spent'), 2),
                'average_supporter_value' => $supporters->isEmpty()
                    ? 0.0
                    : round((float) $supporters->sum('lifetime_spent') / $supporters->count(), 2),
            ],
        ];
    }

    /**
     * Checkouts opened against this creator's listings and never completed.
     *
     * The only demand-side signal the creator gets: someone wanted this, reached the
     * payment screen, and stopped. A listing that collects abandonments is usually
     * priced wrong or described badly — that is actionable in a way "you earned £X"
     * is not.
     *
     * ⚠️ **No supporter identity leaves this method.** Not the email, not a name, not
     * a user id — the platform never hands a creator a supporter's contact details,
     * and an abandoned checkout is a weaker relationship than a completed purchase,
     * not a stronger one. Counts, amounts and the listing only.
     */
    public function abandonedCheckouts(User $creator, string $currency = 'GBP'): array
    {
        $since = now()->subDays(self::ABANDONED_WINDOW_DAYS);

        $rows = AbandonedCheckout::query()
            ->where('creator_id', $creator->id)
            ->where('created_at', '>=', $since)
            ->whereNull('recovered_at')
            // Anything still open is either in flight or waiting on its reminder;
            // 'expired' and 'unrecoverable' are genuinely lost. Both count as
            // "did not buy". A row closed 'paid' is excluded by recovered_at.
            ->orderByDesc('created_at')
            ->get(['id', 'product_type', 'item_id', 'amount_minor', 'currency', 'created_at', 'reminder_count']);

        $recovered = AbandonedCheckout::where('creator_id', $creator->id)
            ->where('created_at', '>=', $since)
            ->whereNotNull('recovered_at')
            ->count();

        $value = 0.0;
        $items = [];

        foreach ($rows as $row) {
            $from = strtoupper($row->currency ?: 'GBP');
            $amount = (float) $row->amount_minor / 100;
            $converted = $from === $currency ? $amount : (float) Helpers::priceFormat($from, $amount, $currency);

            $value += $converted;

            if (count($items) < self::ABANDONED_LIST_LIMIT) {
                $items[] = [
                    'id' => $row->id,
                    'type' => $row->product_type,
                    'label' => AbandonedCheckoutService::moduleLabel($row->product_type),
                    'title' => $this->abandonedItemTitle($row),
                    'amount' => round($converted, 2),
                    'reminded' => (int) $row->reminder_count > 0,
                    'when' => optional($row->created_at)->toDateTimeString(),
                ];
            }
        }

        $total = $rows->count() + $recovered;

        return [
            'window_days' => self::ABANDONED_WINDOW_DAYS,
            'count' => $rows->count(),
            'value' => round($value, 2),
            'recovered' => $recovered,
            // Share of started checkouts that went on to complete. Null rather than 0
            // when nothing was started — "no data" and "nobody bought" are different.
            'recovery_rate' => $total > 0 ? round(($recovered / $total) * 100, 1) : null,
        ] + ['items' => $items];
    }

    /** Listing name behind an abandoned checkout, or null when it was a basket. */
    private function abandonedItemTitle(AbandonedCheckout $row): ?string
    {
        try {
            $item = app(AbandonedCheckoutService::class)->itemFor($row);

            if (! $item) {
                return null;
            }

            foreach (['wishname', 'name', 'title'] as $column) {
                $value = trim((string) ($item->{$column} ?? ''));

                if ($value !== '') {
                    return $value;
                }
            }

            return null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * How the creator's supporters spread across the platform engagement Levels, over
     * ALL of them (not just the displayed slice) — one batched lookup, so the
     * "tier mix" is honest rather than a sample of the top few.
     */
    private function tierDistribution(array $supporterIds): array
    {
        // Mirror VipScoreService::TIERS — the engagement Level, not a spend tier.
        // Renamed from gem names to Level 1-5 (24 July 2026) so the supporter badge
        // stops colliding with the admin spend tier. Keep in step with that service.
        $meta = [
            'Level 1' => ['color' => '#9CA3AF', 'icon' => '①'],
            'Level 2' => ['color' => '#60A5FA', 'icon' => '②'],
            'Level 3' => ['color' => '#34D399', 'icon' => '③'],
            'Level 4' => ['color' => '#FBBF24', 'icon' => '④'],
            'Level 5' => ['color' => '#FF007F', 'icon' => '⑤'],
        ];

        $counts = array_fill_keys(array_keys($meta), 0);

        if (! empty($supporterIds)) {
            foreach ($this->vip->badgesFor($supporterIds) as $badge) {
                $level = $badge['level'] ?? null;
                if (isset($counts[$level])) {
                    $counts[$level]++;
                }
            }
        }

        return collect($meta)
            ->map(fn ($m, $level) => [
                'level' => $level,
                'count' => $counts[$level],
                'color' => $m['color'],
                'icon' => $m['icon'],
            ])
            ->values()
            ->all();
    }

    /**
     * Per-supporter lifetime picture: total spent, purchase count, first and
     * last purchase, average order value — and an engagement Level for the top few.
     */
    public function supporters(User $creator, string $currency = 'GBP')
    {
        // Boundary for "spend this calendar month", used alongside the lifetime total.
        $monthStart = now()->startOfMonth()->toDateTimeString();

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
            ->selectRaw(
                'SUM(CASE WHEN transaction_date >= ? THEN net_amount + COALESCE(vat_amount, 0) ELSE 0 END) as month_total',
                [$monthStart]
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

            $monthAmount = (float) $row->month_total;
            $monthConverted = $from === $currency
                ? $monthAmount
                : (float) Helpers::priceFormat($from, $monthAmount, $currency);

            if (! isset($bySupporter[$id])) {
                $bySupporter[$id] = [
                    'supporter_id' => $id,
                    'lifetime_spent' => 0.0,
                    'monthly_spent' => 0.0,
                    'purchases' => 0,
                    'first_purchase' => $row->first_purchase,
                    'last_purchase' => $row->last_purchase,
                ];
            }

            $bySupporter[$id]['lifetime_spent'] += $converted;
            $bySupporter[$id]['monthly_spent'] += $monthConverted;
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

        // One pass for the whole displayed slice. Calling for() inside the map
        // ran the six source queries per supporter — ten supporters meant
        // ninety queries on a single page load.
        $badges = $this->vip->badgesFor($topIds);

        return $collection->map(function ($row, $index) use ($users, $currency, $badges) {
            $user = $users->get($row['supporter_id']);
            $last = $row['last_purchase'] ? Carbon::parse($row['last_purchase']) : null;

            $row['name'] = $user->name ?? null;
            $row['username'] = $user->username ?? null;
            $row['avatar'] = $user->avatar ?? null;
            $row['currency'] = $currency;
            $row['lifetime_spent'] = round($row['lifetime_spent'], 2);
            $row['monthly_spent'] = round($row['monthly_spent'], 2);
            $row['average_order_value'] = $row['purchases'] > 0
                ? round($row['lifetime_spent'] / $row['purchases'], 2)
                : 0.0;
            $row['days_since_last_purchase'] = $last ? (int) $last->diffInDays(now()) : null;
            $row['at_risk'] = $row['days_since_last_purchase'] !== null
                && $row['days_since_last_purchase'] >= self::AT_RISK_DAYS
                && $row['purchases'] > 1;

            // The engagement Level is the supporter's platform-wide standing (same source as
            // the public leaderboard) — enriching every supporter would be a
            // query each, so only the displayed slice gets it.
            $row['vip'] = ($index < self::VIP_ENRICH_LIMIT && $user)
                ? ($badges[$row['supporter_id']] ?? null)
                : null;

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
        $reactivatedIds = [];

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
                $reactivatedIds[] = (int) $row->supporter_id;
            }
        }

        return [
            'new' => $new,
            'returning' => $returning,
            'reactivated' => $reactivated,
            // Who they are, so alerts can single out the valuable ones. The
            // page already lists these supporters, so no new exposure.
            'reactivated_ids' => $reactivatedIds,
            'lost' => $lost,
            'window_days' => 30,
        ];
    }

    /** A single purchase this big is an event in itself, GBP-equivalent. */
    private const BIG_PURCHASE_GBP = 100.0;

    /** Notable changes worth surfacing at the top of the page. */
    public function alerts(User $creator, $supporters, array $retention): array
    {
        $alerts = [];
        $windowStart = now()->subDays($retention['window_days'] ?? 30);

        // Level 4+ (engagement score ≥ 70) — filter on score, not the label, so a
        // future rename of the levels can't silently break these alerts.
        $topTier = $supporters->filter(
            fn ($s) => (float) ($s['vip']['score'] ?? 0) >= 70
        );

        if ($topTier->isNotEmpty()) {
            $alerts[] = [
                'key' => 'top_tier_supporters',
                'severity' => 'good',
                'title' => 'You have top-tier supporters',
                'detail' => $topTier->count().' of your supporters are Level 4 or 5 on the platform.',
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

        // New whale: someone whose FIRST purchase was inside the window and who
        // has already passed the high-value line. They arrived spending big —
        // the moment to make them feel seen.
        $newWhales = $supporters->filter(
            fn ($s) => ($s['lifetime_spent'] ?? 0) >= self::HIGH_VALUE_GBP
                && ! empty($s['first_purchase'])
                && Carbon::parse($s['first_purchase'])->gte($windowStart)
        );

        if ($newWhales->isNotEmpty()) {
            $alerts[] = [
                'key' => 'new_whale',
                'severity' => 'good',
                'title' => 'A big supporter arrived this month',
                'detail' => $newWhales->count().' new supporter(s) have already passed '
                    .number_format(self::HIGH_VALUE_GBP).' in purchases within their first month.',
            ];
        }

        // Fresh arrival at the very top: a Level 5 supporter (score ≥ 90) whose
        // first purchase from this creator landed in the window. Distinct from the
        // combined top-tier (Level 4+) count above.
        $newPlatinum = $supporters->filter(
            fn ($s) => (float) ($s['vip']['score'] ?? 0) >= 90
                && ! empty($s['first_purchase'])
                && Carbon::parse($s['first_purchase'])->gte($windowStart)
        );

        if ($newPlatinum->isNotEmpty()) {
            $alerts[] = [
                'key' => 'new_platinum',
                'severity' => 'good',
                'title' => 'A new top-level supporter',
                'detail' => $newPlatinum->count().' Level 5 supporter(s) started buying from you this month.',
            ];
        }

        // Returning whale: a high-value supporter who came back after 60+ days
        // of silence. Different from a steady regular — they nearly left.
        $reactivatedIds = $retention['reactivated_ids'] ?? [];

        $returningWhales = $supporters->filter(
            fn ($s) => in_array((int) $s['supporter_id'], $reactivatedIds, true)
                && ($s['lifetime_spent'] ?? 0) >= self::HIGH_VALUE_GBP
        );

        if ($returningWhales->isNotEmpty()) {
            $alerts[] = [
                'key' => 'returning_whale',
                'severity' => 'good',
                'title' => 'A big supporter came back',
                'detail' => $returningWhales->count().' high-value supporter(s) returned after two months or more away.',
            ];
        }

        // High-value purchase: one single order past the line, inside the
        // window. The sum can hide it; the event deserves its own flag.
        $big = $this->biggestRecentPurchaseGbp($creator, $windowStart);

        if ($big !== null && $big >= self::BIG_PURCHASE_GBP) {
            $alerts[] = [
                'key' => 'high_value_purchase',
                'severity' => 'good',
                'title' => 'A high-value purchase landed',
                'detail' => 'Your biggest single purchase in the last '.($retention['window_days'] ?? 30)
                    .' days was £'.number_format($big, 2).' (GBP equivalent).',
            ];
        }

        return $alerts;
    }

    /**
     * The largest single purchase in the window, converted to GBP.
     *
     * Max per currency first, then converted — a raw SQL MAX across currencies
     * would happily call 1,000 JPY bigger than 100 GBP.
     */
    private function biggestRecentPurchaseGbp(User $creator, $windowStart): ?float
    {
        $rows = FinancialTransaction::query()
            ->where('user_id', $creator->id)
            ->where('type', 'income')
            ->whereNotIn('status', self::EXCLUDED_STATUSES)
            ->whereNotNull('supporter_id')
            ->where('transaction_date', '>=', $windowStart)
            ->select('currency', DB::raw('MAX(net_amount + COALESCE(vat_amount, 0)) as biggest'))
            ->groupBy('currency')
            ->get();

        $best = null;

        foreach ($rows as $row) {
            $from = strtoupper($row->currency ?: 'GBP');
            $amount = (float) $row->biggest;
            $gbp = $from === 'GBP' ? $amount : (float) Helpers::priceFormat($from, $amount, 'GBP');

            if ($best === null || $gbp > $best) {
                $best = $gbp;
            }
        }

        return $best;
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

        // Contact the very top of the ladder (Level 4+). Called out separately
        // from a general follow-up because they are the few supporters most worth
        // a personal touch.
        $platinumSupporter = $supporters->first(
            fn ($s) => (float) ($s['vip']['score'] ?? 0) >= 70
        );

        if ($platinumSupporter) {
            $actions[] = [
                'key' => 'contact_platinum',
                'title' => 'Contact your top supporter',
                'detail' => ($platinumSupporter['name'] ?? 'A supporter').' is '
                    .($platinumSupporter['vip']['level'] ?? 'top-level').' on the platform and has spent '
                    .number_format($platinumSupporter['lifetime_spent'], 2).' with you.',
                'hint' => 'Consider reaching out through your own social channels, if appropriate.',
            ];
        }

        // Follow up with a Level 3 supporter who is still active — a nudge keeps
        // them climbing toward the top levels.
        $goldSupporter = $supporters->first(
            fn ($s) => ((float) ($s['vip']['score'] ?? 0) >= 50 && (float) ($s['vip']['score'] ?? 0) < 70) && ! $s['at_risk']
        );

        if ($goldSupporter) {
            $actions[] = [
                'key' => 'follow_up_vip',
                'title' => 'Follow up with a VIP',
                'detail' => ($goldSupporter['name'] ?? 'A supporter').' is a Level 3 supporter across '
                    .$goldSupporter['purchases'].' purchase(s).',
                'hint' => 'Consider reaching out through your own social channels, if appropriate.',
            ];
        }

        // Product mix: what to promote (already selling) vs what to start (never
        // sold). $sold drives both branches, so it is fetched once.
        $sold = $this->soldProductTypes($creator);

        // Encourage upgrades where a membership already exists — distinct from
        // "offer a membership" below, which is for creators with none.
        if (in_array('MembershipPayment', $sold, true)) {
            $actions[] = [
                'key' => 'upgrade_membership',
                'title' => 'Encourage a membership upgrade',
                'detail' => 'You already have members. A higher tier with more content is the simplest way to lift recurring income.',
                'hint' => 'Add a premium tier, then tell existing members what they unlock by upgrading.',
            ];
        }

        // Promote an existing wishlist — distinct from "add a wishlist item"
        // below, which is for creators who have never published one.
        if (WishItem::where('user_id', $creator->id)->exists()) {
            $actions[] = [
                'key' => 'promote_wishlist',
                'title' => 'Promote your wishlist',
                'detail' => 'You have wishlist items published. Sharing them turns interest into a sale.',
                'hint' => 'Point supporters at your wishlist through your own channels, if appropriate.',
            ];
        }

        // Nudge the creator toward products they haven't published, because an
        // empty product type is revenue that simply cannot happen.
        foreach ($this->missingProductTypes($sold) as $type) {
            $actions[] = [
                'key' => 'publish_'.$type['key'],
                'title' => $type['title'],
                'detail' => $type['detail'],
                'hint' => $type['hint'],
            ];
        }

        return $actions;
    }

    /** Distinct product types (class basenames) this creator has ever sold. */
    private function soldProductTypes(User $creator): array
    {
        return FinancialTransaction::query()
            ->where('user_id', $creator->id)
            ->where('type', 'income')
            ->whereNotIn('status', self::EXCLUDED_STATUSES)
            ->distinct()
            ->pluck('source_type')
            ->map(fn ($t) => class_basename($t))
            ->all();
    }

    /** Product types this creator has never sold — each is unrealised revenue. */
    private function missingProductTypes(array $sold): array
    {
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
