<?php

namespace App\Services;

use App\Models\BillPayment;
use App\Models\Currency;
use App\Models\MembershipPayment;
use App\Models\ShopPayment;
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
    private const TIERS = [
        ['level' => 'Bronze',   'min' => 0,  'icon' => '🥉', 'color' => '#92400e'],
        ['level' => 'Silver',   'min' => 30, 'icon' => '🥈', 'color' => '#6b7280'],
        ['level' => 'Gold',     'min' => 50, 'icon' => '🥇', 'color' => '#f59e0b'],
        ['level' => 'Platinum', 'min' => 70, 'icon' => '🏆', 'color' => '#a855f7'],
        ['level' => 'Diamond',  'min' => 90, 'icon' => '💎', 'color' => '#e879f9'],
    ];

    /**
     * Compute the VIP status payload for a single supporter.
     */
    public function for($user): array
    {
        $from = Carbon::now()->subMonths(3);
        $to = Carbon::now();
        $rates = Currency::whereNotNull('conversion_rate')
            ->pluck('conversion_rate', 'ISO')
            ->mapWithKeys(fn ($rate, $iso) => [strtoupper($iso) => (float) $rate])
            ->toArray();

        $totalAmount = 0.0;
        $gifts = 0;
        $creators = [];
        $types = [];
        $latest = null;

        $add = function ($amount, $currency, $type, $createdAt, $creatorId) use (
            &$totalAmount, &$gifts, &$creators, &$types, &$latest, $rates
        ) {
            $totalAmount += $this->toGbp((float) $amount, $currency, $rates);
            $gifts++;
            if ($creatorId && !in_array($creatorId, $creators, true)) {
                $creators[] = $creatorId;
            }
            if (!in_array($type, $types, true)) {
                $types[] = $type;
            }
            if ($createdAt && (!$latest || $createdAt > $latest)) {
                $latest = $createdAt;
            }
        };

        // Wishes (line items)
        $wishes = StripePaymentItems::whereHas('payment', function ($q) use ($from, $to, $user) {
            $q->where('user_id', $user->id)
                ->where('payment_status', 'paid')
                ->whereNotIn('id', function ($sub) {
                    $sub->select('source_id')->from('financial_transactions')
                        ->where('source_type', \App\Models\StripePaymentDetail::class)
                        ->whereIn('status', ['refunded', 'disputed']);
                })
                ->whereBetween('stripe_payment_details.created_at', [$from, $to]);
        })->with(['payment', 'wish.user'])->get();
        foreach ($wishes as $r) {
            $add($r->amount, $r->payment?->currency, 'wish', $r->created_at, $r->wish?->user_id);
        }

        // Wish subscriptions
        $this->scopedPaid(WishItemSubscription::with('wish_item'), $user, $from, $to, \App\Models\WishItemSubscription::class)
            ->each(fn ($r) => $add($r->amount, $r->currency, 'subscription', $r->created_at, $r->wish_item?->user_id));

        // Tips
        $this->scopedPaid(TipGoalsPayment::query(), $user, $from, $to, \App\Models\TipGoalsPayment::class)
            ->each(fn ($r) => $add($r->amount, $r->currency, 'tip', $r->created_at, $r->creator_id));

        // Memberships
        $this->scopedPaid(MembershipPayment::with('membership'), $user, $from, $to, \App\Models\MembershipPayment::class)
            ->each(fn ($r) => $add($r->amount, $r->currency, 'membership', $r->created_at, $r->membership?->user_id));

        // Bills
        $this->scopedPaid(BillPayment::with('bill'), $user, $from, $to, \App\Models\BillPayment::class)
            ->each(fn ($r) => $add($r->amount, $r->currency, 'bill', $r->created_at, $r->bill?->user_id));

        // Shop
        $shop = ShopPayment::with('shop')
            ->where('user_id', $user->id)
            ->where('payment_status', 'paid')
            ->whereNotIn('id', function ($q) {
                $q->select('source_id')->from('financial_transactions')
                    ->where('source_type', \App\Models\ShopPayment::class)
                    ->whereIn('status', ['refunded', 'disputed']);
            })
            ->whereBetween('created_at', [$from, $to])->get();
        foreach ($shop as $r) {
            $add($r->amount, $r->currency ?? 'GBP', 'shop', $r->created_at, $r->shop?->user_id);
        }

        // Score via the canonical formula (shared with the leaderboard).
        $creatorsCount = count($creators);
        $typesCount = count($types);
        $recency = 0.0;
        if ($latest) {
            $days = Carbon::parse($latest)->diffInDays($to);
            $recency = max(0, 10 - ($days / 3));
        }
        $score = self::scoreFromTotals($totalAmount, $gifts, $creatorsCount, $typesCount, $latest, $to);

        return $this->dress($score, [
            'spend'    => round(min(40, $totalAmount), 1),
            'gifts'    => min(30, $gifts * 2),
            'creators' => min(20, $creatorsCount * 4),
            'types'    => min(10, $typesCount * 2),
            'recency'  => round($recency, 1),
        ], [
            'amount_gbp' => round($totalAmount, 2),
            'gifts'      => $gifts,
            'creators'   => $creatorsCount,
            'types'      => $typesCount,
        ]);
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
            'score'       => $score,
            'level'       => $current['level'],
            'icon'        => $current['icon'],
            'color'       => $current['color'],
            'next_level'  => $next['level'] ?? null,
            'to_next'     => $toNext,
            'progress'    => round($progress, 3),
            'window_days' => self::WINDOW_DAYS,
            'breakdown'   => $breakdown,
            'totals'      => $totals,
        ];
    }

    /** Shared "this user, paid, in-window, not refunded/disputed" query. */
    private function scopedPaid($query, $user, $from, $to, string $sourceType)
    {
        return $query
            ->where('user_id', $user->id)
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
