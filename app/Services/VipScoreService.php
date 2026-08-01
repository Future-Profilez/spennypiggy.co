<?php

namespace App\Services;

use App\Models\BillPayment;
use App\Models\Currency;
use App\Models\MembershipPayment;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\TipGoalsPayment;
use App\Models\WishItemSubscription;
use Carbon\Carbon;

/**
 * Single source of truth for a supporter's VIP score + tier.
 *
 * Mirrors LeaderBoardController::vipSupporters() exactly (same 3-month window,
 * same six paid sources, same refund/dispute exclusion, same scoring formula and
 * tier thresholds) — but scoped to ONE arbitrary user so it can power the gifter's
 * own "My Purchases" hub, not just the global top-15 leaderboard.
 */
class VipScoreService
{
    public const WINDOW_DAYS = 90;

    /**
     * Canonical scoring formula — the ONE place the VIP score is defined.
     * Both this service (per-user) and LeaderBoardController (global top-15) call it,
     * so the gifter's own tier can never drift from the public leaderboard.
     */
    public static function scoreFromTotals(float $totalAmount, int $gifts, int $creators, int $types, $latestDate, $now): float
    {
        $score = min(40, $totalAmount)
            + min(30, $gifts * 2)
            + min(20, $creators * 4)
            + min(10, $types * 2);

        if ($latestDate) {
            $days = Carbon::parse($latestDate)->diffInDays($now);
            $score += max(0, 10 - ($days / 3));
        }

        return round($score, 1);
    }

    /** All engagement Levels, low → high — {level, min, icon, color}. Single
     *  source for anything that needs the level list (e.g. a tier-distribution bar). */
    public static function levels(): array
    {
        return self::TIERS;
    }

    /** Tier {level, icon, color} for a score — canonical thresholds. */
    public static function tier(float $score): array
    {
        $current = self::TIERS[0];
        foreach (self::TIERS as $t) {
            if ($score >= $t['min']) {
                $current = $t;
            }
        }

        return ['level' => $current['level'], 'icon' => $current['icon'], 'color' => $current['color']];
    }

    /** Tier thresholds, low → high. Colours/icons match the public leaderboard. */
    // Engagement Level, NOT a spend tier. Renamed from gem names (Bronze…Diamond)
    // to Level 1-5 on 24 July 2026 (client decision) so the supporter badge no
    // longer shares words with the admin app's spend tier — a £150 supporter who
    // buys often can be Level 5 here while sitting in the admin's Bronze band, and
    // the two no longer look like a contradiction. Score thresholds are unchanged;
    // only the labels/icons/colours moved. Level 5 is the top rung.
    private const TIERS = [
        ['level' => 'Level 1', 'min' => 0,  'icon' => '①', 'color' => '#9CA3AF'],
        ['level' => 'Level 2', 'min' => 30, 'icon' => '②', 'color' => '#60A5FA'],
        ['level' => 'Level 3', 'min' => 50, 'icon' => '③', 'color' => '#34D399'],
        ['level' => 'Level 4', 'min' => 70, 'icon' => '④', 'color' => '#FBBF24'],
        ['level' => 'Level 5', 'min' => 90, 'icon' => '⑤', 'color' => '#FF007F'],
    ];

    /**
     * Compute the VIP status payload for a single supporter.
     */
    public function for($user): array
    {
        return $this->forMany([$user->id])[$user->id] ?? $this->dress(0.0, [
            'spend' => 0.0, 'gifts' => 0, 'creators' => 0, 'types' => 0, 'recency' => 0.0,
        ], [
            'amount_gbp' => 0.0, 'gifts' => 0, 'creators' => 0, 'types' => 0,
        ]);
    }

    /**
     * Same payload as for(), but for a set of supporters in one pass.
     *
     * Six source tables are read once for the whole set instead of once per
     * supporter, which is what makes a tier badge affordable on a list — a
     * ten-supporter leaderboard is six queries, not sixty.
     *
     * @param  array<int, int>  $userIds
     * @return array<int, array> keyed by user id; ids with no purchases are omitted
     */
    public function forMany(array $userIds): array
    {
        $userIds = array_values(array_unique(array_filter(array_map('intval', $userIds))));

        if (empty($userIds)) {
            return [];
        }

        $from = Carbon::now()->subMonths(3);
        $to = Carbon::now();
        $rates = Currency::whereNotNull('conversion_rate')
            ->pluck('conversion_rate', 'ISO')
            ->mapWithKeys(fn ($rate, $iso) => [strtoupper($iso) => (float) $rate])
            ->toArray();

        // One accumulator per supporter, seeded so every requested id gets an
        // entry even when they turn out to have nothing in the window.
        $acc = [];
        foreach ($userIds as $id) {
            $acc[$id] = ['amount' => 0.0, 'gifts' => 0, 'creators' => [], 'types' => [], 'latest' => null];
        }

        $add = function ($buyerId, $amount, $currency, $type, $createdAt, $creatorId) use (&$acc, $rates) {
            $buyerId = (int) $buyerId;

            if (! isset($acc[$buyerId])) {
                return;
            }

            $acc[$buyerId]['amount'] += $this->toGbp((float) $amount, $currency, $rates);
            $acc[$buyerId]['gifts']++;

            if ($creatorId && ! in_array($creatorId, $acc[$buyerId]['creators'], true)) {
                $acc[$buyerId]['creators'][] = $creatorId;
            }

            if (! in_array($type, $acc[$buyerId]['types'], true)) {
                $acc[$buyerId]['types'][] = $type;
            }

            if ($createdAt && (! $acc[$buyerId]['latest'] || $createdAt > $acc[$buyerId]['latest'])) {
                $acc[$buyerId]['latest'] = $createdAt;
            }
        };

        // Wishes (line items) — the buyer lives on the parent payment row.
        $wishes = StripePaymentItems::whereHas('payment', function ($q) use ($from, $to, $userIds) {
            $q->whereIn('user_id', $userIds)
                ->where('payment_status', 'paid')
                ->whereNotIn('id', function ($sub) {
                    $sub->select('source_id')->from('financial_transactions')
                        ->where('source_type', StripePaymentDetail::class)
                        ->whereIn('status', ['refunded', 'disputed']);
                })
                ->whereBetween('stripe_payment_details.created_at', [$from, $to]);
        })->with(['payment', 'wish.user'])->get();
        foreach ($wishes as $r) {
            $add($r->payment?->user_id, $r->amount, $r->payment?->currency, 'wish', $r->created_at, $r->wish?->user_id);
        }

        // Wish subscriptions
        $this->scopedPaid(WishItemSubscription::with('wish_item'), $userIds, $from, $to, WishItemSubscription::class)
            ->each(fn ($r) => $add($r->user_id, $r->amount, $r->currency, 'subscription', $r->created_at, $r->wish_item?->user_id));

        // Tips
        $this->scopedPaid(TipGoalsPayment::query(), $userIds, $from, $to, TipGoalsPayment::class)
            ->each(fn ($r) => $add($r->user_id, $r->amount, $r->currency, 'tip', $r->created_at, $r->creator_id));

        // Memberships
        $this->scopedPaid(MembershipPayment::with('membership'), $userIds, $from, $to, MembershipPayment::class)
            ->each(fn ($r) => $add($r->user_id, $r->amount, $r->currency, 'membership', $r->created_at, $r->membership?->user_id));

        // Bills
        $this->scopedPaid(BillPayment::with('bill'), $userIds, $from, $to, BillPayment::class)
            ->each(fn ($r) => $add($r->user_id, $r->amount, $r->currency, 'bill', $r->created_at, $r->bill?->user_id));

        // Shop
        $shop = ShopPayment::with('shop')
            ->whereIn('user_id', $userIds)
            ->where('payment_status', 'paid')
            ->whereNotIn('id', function ($q) {
                $q->select('source_id')->from('financial_transactions')
                    ->where('source_type', ShopPayment::class)
                    ->whereIn('status', ['refunded', 'disputed']);
            })
            ->whereBetween('created_at', [$from, $to])->get();
        foreach ($shop as $r) {
            $add($r->user_id, $r->amount, $r->currency ?? 'GBP', 'shop', $r->created_at, $r->shop?->user_id);
        }

        $out = [];

        foreach ($acc as $id => $row) {
            $creatorsCount = count($row['creators']);
            $typesCount = count($row['types']);

            $recency = 0.0;
            if ($row['latest']) {
                $days = Carbon::parse($row['latest'])->diffInDays($to);
                $recency = max(0, 10 - ($days / 3));
            }

            // Score via the canonical formula (shared with the leaderboard).
            $score = self::scoreFromTotals($row['amount'], $row['gifts'], $creatorsCount, $typesCount, $row['latest'], $to);

            $out[$id] = $this->dress($score, [
                'spend' => round(min(40, $row['amount']), 1),
                'gifts' => min(30, $row['gifts'] * 2),
                'creators' => min(20, $creatorsCount * 4),
                'types' => min(10, $typesCount * 2),
                'recency' => round($recency, 1),
            ], [
                'amount_gbp' => round($row['amount'], 2),
                'gifts' => $row['gifts'],
                'creators' => $creatorsCount,
                'types' => $typesCount,
            ]);
        }

        return $out;
    }

    /**
     * Just the badge: {level, icon, color, score} per supporter.
     *
     * For list surfaces (a creator's supporter leaderboard) that want the tier
     * chip without the progress-bar payload.
     *
     * @param  array<int, int>  $userIds
     * @return array<int, array{level:string, icon:string, color:string, score:float}>
     */
    public function badgesFor(array $userIds): array
    {
        $badges = [];

        foreach ($this->forMany($userIds) as $id => $status) {
            $badges[$id] = [
                'level' => $status['level'],
                'icon' => $status['icon'],
                'color' => $status['color'],
                'score' => $status['score'],
            ];
        }

        return $badges;
    }

    /** Build the tier/progress wrapper around a raw score. */
    private function dress(float $score, array $breakdown, array $totals): array
    {
        $current = self::TIERS[0];
        $next = null;
        foreach (self::TIERS as $i => $tier) {
            if ($score >= $tier['min']) {
                $current = $tier;
                $next = self::TIERS[$i + 1] ?? null;
            }
        }

        $toNext = $next ? max(0, round($next['min'] - $score, 1)) : 0;
        $progress = 1.0;
        if ($next) {
            $span = $next['min'] - $current['min'];
            $progress = $span > 0 ? min(1, max(0, ($score - $current['min']) / $span)) : 0;
        }

        return [
            'score' => $score,
            'level' => $current['level'],
            'icon' => $current['icon'],
            'color' => $current['color'],
            'next_level' => $next['level'] ?? null,
            'to_next' => $toNext,
            'progress' => round($progress, 3),
            'window_days' => self::WINDOW_DAYS,
            'breakdown' => $breakdown,
            'totals' => $totals,
        ];
    }

    /** Shared "these users, paid, in-window, not refunded/disputed" query. */
    private function scopedPaid($query, array $userIds, $from, $to, string $sourceType)
    {
        return $query
            ->whereIn('user_id', $userIds)
            ->where('status', 'paid')
            ->whereNotIn('id', function ($q) use ($sourceType) {
                $q->select('source_id')->from('financial_transactions')
                    ->where('source_type', $sourceType)
                    ->whereIn('status', ['refunded', 'disputed']);
            })
            ->whereBetween('created_at', [$from, $to])
            ->get();
    }

    /** GBP normalisation identical to LeaderBoardController::normalizeToGbp. */
    private function toGbp(float $amount, ?string $currency, array $rates): float
    {
        $iso = strtoupper($currency ?: 'GBP');
        $rate = (float) ($rates[$iso] ?? 0);
        if ($rate <= 0) {
            return $amount;
        }

        return round($amount / $rate, 2, PHP_ROUND_HALF_UP);
    }
}
