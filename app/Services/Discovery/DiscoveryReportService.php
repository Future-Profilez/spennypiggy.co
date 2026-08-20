<?php

namespace App\Services\Discovery;

use App\Models\DiscoveryEvent;
use App\Support\DiscoverySources;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * The monthly Discovery report — the query behind every published number.
 *
 * 🚨 THIS IS THE SINGLE SOURCE OF THE THREE FIGURES. The creator dashboard
 * banner (Phase 2), the marketing proof point and the Enhanced Earnings
 * Dashboard all read this and nothing else. The plan's own rule for the founder
 * bonus applies here for the same reason: **what a creator is shown must equal
 * the number the system actually computed**, so a second implementation for the
 * dashboard is how the marketing and the product come to disagree.
 *
 * The brief asks for: per creator, per calendar month → people introduced · new
 * supporters · attributed earnings (£) · transaction count · by source.
 *
 * ⚠️ EVERY FIGURE COUNTS SP-GENERATED TRAFFIC ONLY. `bio-link` is a creator's
 * own audience and is recorded, but it must never appear in "how many people
 * Spenny Piggy introduced to you" — that is the number's entire meaning.
 */
class DiscoveryReportService
{
    /**
     * @return array{
     *     introduced: int,
     *     new_supporters: int,
     *     attributed_earnings: float,
     *     transactions: int,
     *     by_source: array<string, array{introduced: int, new_supporters: int, attributed_earnings: float, transactions: int}>,
     *     from: string,
     *     to: string
     * }
     */
    public function forCreator(int $creatorId, ?CarbonInterface $month = null): array
    {
        $month ??= Carbon::now();
        $from = $month->copy()->startOfMonth();
        $to = $month->copy()->endOfMonth();

        $rows = $this->aggregate($creatorId, $from, $to);

        $totals = [
            'introduced' => 0,
            'new_supporters' => 0,
            'attributed_earnings' => 0.0,
            'transactions' => 0,
        ];

        $bySource = [];

        foreach ($rows as $row) {
            $bucket = [
                'introduced' => (int) $row->introduced,
                'new_supporters' => (int) $row->new_supporters,
                'attributed_earnings' => round((float) $row->attributed_earnings, 2),
                'transactions' => (int) $row->transactions,
            ];

            $bySource[$row->source] = $bucket;

            foreach ($totals as $key => $value) {
                $totals[$key] = $value + $bucket[$key];
            }
        }

        $totals['attributed_earnings'] = round($totals['attributed_earnings'], 2);

        return $totals + [
            'by_source' => $bySource,
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
        ];
    }

    /**
     * The shape the dashboard banner and the marketing panel render.
     *
     * ⚠️ Keys match `config('discovery.mock_stats')` so the same component can be
     * handed either, which is what lets one flag flip it from mock to live
     * without touching the component.
     */
    public function panelStatsFor(int $creatorId, ?CarbonInterface $month = null): array
    {
        $report = $this->forCreator($creatorId, $month);

        return [
            'introduced' => $report['introduced'],
            'new_supporters' => $report['new_supporters'],
            'attributed_earnings' => $report['attributed_earnings'],
        ];
    }

    /**
     * One grouped pass over the month.
     *
     * ⚠️ COUNT(DISTINCT …) OVER A COALESCE OF THE TWO IDENTITY COLUMNS. A
     * visitor is a signed-in user OR an anonymous cookie, never both on one row,
     * and counting rows instead of people would report a supporter who visited
     * from three collections as three introductions. The daily de-duplication in
     * `AttributionService` handles repeats within one source; this handles the
     * same person arriving through several.
     *
     * ⚠️ `new_supporters` counts PURCHASE events flagged new — not visits. The
     * brief's middle figure is "became new supporters", which is a purchase, and
     * reading it off visits would report interest as revenue.
     */
    private function aggregate(int $creatorId, CarbonInterface $from, CarbonInterface $to)
    {
        $identity = 'COALESCE(CAST(user_id AS CHAR), visitor_id)';
        $purchase = DiscoveryEvent::TYPE_PURCHASE;
        $visit = DiscoveryEvent::TYPE_VISIT;

        return DiscoveryEvent::query()
            ->select('source')
            ->selectRaw("COUNT(DISTINCT CASE WHEN event_type = ? THEN {$identity} END) AS introduced", [$visit])
            ->selectRaw(
                "COUNT(DISTINCT CASE WHEN event_type = ? AND is_new_to_creator = 1 THEN {$identity} END) AS new_supporters",
                [$purchase]
            )
            ->selectRaw('COALESCE(SUM(CASE WHEN event_type = ? THEN value_gbp END), 0) AS attributed_earnings', [$purchase])
            ->selectRaw('COUNT(CASE WHEN event_type = ? THEN 1 END) AS transactions', [$purchase])
            ->where('creator_id', $creatorId)
            ->where('traffic_class', DiscoverySources::CLASS_SP)
            ->whereBetween('occurred_at', [$from, $to])
            ->groupBy('source')
            ->get();
    }

    /**
     * Attributed earnings straight off the ledger, as a cross-check.
     *
     * ⚠️ The brief puts the source on the transaction record as well as the
     * event, so the same money can be read two ways. They should agree; when
     * they do not, the LEDGER is right — it is what the creator is paid from.
     * Used by the reconciliation test rather than by any screen.
     */
    public function ledgerEarnings(int $creatorId, ?CarbonInterface $month = null): float
    {
        $month ??= Carbon::now();

        return (float) DB::table('financial_transactions')
            ->where('user_id', $creatorId)
            ->where('discovery_class', DiscoverySources::CLASS_SP)
            ->where('type', 'income')
            ->whereNull('deleted_at')
            ->whereBetween('transaction_date', [
                $month->copy()->startOfMonth(),
                $month->copy()->endOfMonth(),
            ])
            ->sum('gbp_amount');
    }
}
