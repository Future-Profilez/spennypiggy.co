<?php

namespace App\Services;

use App\Models\FinancialTransaction;
use Illuminate\Support\Collection;

/**
 * "Has this supporter stopped spending, and for how long?"
 *
 * Single source of truth for lapse/churn windows, matching the admin app's
 * SupporterIntelligence dashboard exactly (same table, same excluded statuses,
 * same date column) so the engine that emails people can never disagree with
 * the dashboard someone is looking at.
 */
class SupporterLapseService
{
    /**
     * Statuses that do NOT count as a real purchase. A refunded or disputed
     * transaction must leave the supporter looking lapsed, not active.
     */
    public const EXCLUDED_STATUSES = ['disputed', 'refunded', 'review_hold', 'pending', 'failed'];

    /**
     * Supporters whose last purchase was exactly `$days` days ago.
     *
     * Exact-day matching (not ">= days") keeps each stage a single event: a
     * supporter crosses day 7 once, so the 7-day reminder is a one-off even
     * before dedup. Callers still dedup, for re-runs on the same day.
     *
     * @return Collection<int, object{supporter_id:int, last_purchase:string}>
     */
    public function lapsedExactlyDaysAgo(int $days): Collection
    {
        $target = now()->subDays($days)->toDateString();

        return FinancialTransaction::query()
            ->selectRaw('supporter_id, MAX(transaction_date) as last_purchase')
            ->where('type', 'income')
            ->whereNotNull('supporter_id')
            ->whereNotIn('status', self::EXCLUDED_STATUSES)
            ->groupBy('supporter_id')
            ->havingRaw('DATE(MAX(transaction_date)) = ?', [$target])
            ->get();
    }

    /** Most recent qualifying purchase date for one supporter, or null. */
    public function lastPurchaseDate(int $supporterId): ?string
    {
        $value = FinancialTransaction::query()
            ->where('supporter_id', $supporterId)
            ->where('type', 'income')
            ->whereNotIn('status', self::EXCLUDED_STATUSES)
            ->max('transaction_date');

        return $value ? (string) $value : null;
    }
}
