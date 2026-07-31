<?php

namespace App\Services;

use App\Models\AbandonedCheckout;
use App\Models\ItemViewStat;
use App\Models\ShopPayment;
use App\Models\StockWaitlist;
use App\Models\TaskPurchase;
use Illuminate\Support\Facades\DB;

/**
 * Per-listing funnel: seen → started checkout → sold.
 *
 * A creator could previously see only "sold" or "not sold". Those two outcomes hide two
 * completely different problems:
 *
 *  - **Seen a lot, sold nothing** — the listing is found but not convincing. A price,
 *    description or reward problem.
 *  - **Barely seen at all** — nobody is finding it. A distribution problem.
 *
 * The fix for each is the opposite of the other, and until now they looked identical.
 *
 * Three of the four numbers already existed and were simply never shown together:
 * `abandoned_checkouts` knows who started, the payment tables know who finished, and
 * `stock_waitlists` knows who is waiting on a sold-out item. Only views are new.
 *
 * Every method is batched — one query per signal for a whole page of listings, never one
 * query per row.
 */
class ItemFunnelService
{
    /** Default reporting window. Long enough to be stable, short enough to be current. */
    public const WINDOW_DAYS = 30;

    /**
     * Statuses that mean the money never arrived.
     *
     * A positive "paid" list would have to be kept in step with every status either
     * module ever adds; the failure set is small and stable.
     */
    private const NOT_PAID = ['initiated', 'pending', 'unpaid', 'created', 'failed', 'cancelled', 'canceled', 'refunded', 'processing'];

    /**
     * Funnel for a set of listings of one type.
     *
     * @param  string  $type  `shop` | `task`
     * @param  array<int>  $ids
     * @return array<int, array> keyed by item id
     */
    public function forItems(string $type, array $ids, int $days = self::WINDOW_DAYS): array
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $ids))));

        if (empty($ids) || ! in_array($type, ItemViewTracker::TYPES, true)) {
            return [];
        }

        $since = now()->subDays(max(1, $days));

        $views = $this->views($type, $ids, $since->toDateString());
        $started = $this->startedCheckout($type, $ids, $since);
        $sold = $this->sold($type, $ids, $since);
        $waiting = $type === 'shop' ? $this->waiting($ids) : [];

        // ⚠️ Was view tracking running for the WHOLE window? Without this a zero is
        // unreadable: it could mean "tracking was not on yet" or "genuinely nobody
        // looked" — opposite findings, and the second one is the distribution problem
        // this whole feature exists to surface. Reporting both as "no data" hides it.
        $trackingSince = app(ItemViewTracker::class)->trackingSince();
        $viewsMeasured = $trackingSince !== null && $trackingSince <= $since->toDateString();

        // Skipped when views are unmeasured: there is nothing to attribute, and this
        // would otherwise be a wasted query on every page load of a fresh install.
        $sources = $viewsMeasured ? $this->sources($type, $ids, $since->toDateString()) : [];

        $out = [];

        foreach ($ids as $id) {
            $seen = (int) ($views[$id]['unique_views'] ?? 0);
            $startedCount = (int) ($started[$id] ?? 0);
            $soldCount = (int) ($sold[$id] ?? 0);

            $out[$id] = [
                'window_days' => $days,
                'views' => (int) ($views[$id]['views'] ?? 0),
                'viewers' => $seen,
                'started' => $startedCount,
                'sold' => $soldCount,
                'waiting' => (int) ($waiting[$id] ?? 0),

                // Null, never 0, when the denominator is empty. "Nobody looked" and
                // "everyone who looked left" are different findings, and showing both
                // as 0% hides the one worth acting on.
                'view_to_checkout' => $seen > 0 ? round(($startedCount / $seen) * 100, 1) : null,
                'checkout_to_sale' => $startedCount > 0 ? round(($soldCount / $startedCount) * 100, 1) : null,
                'view_to_sale' => $seen > 0 ? round(($soldCount / $seen) * 100, 1) : null,

                // Three states, not two:
                //   ok      — measured, and people looked
                //   none    — measured, and NOBODY looked. The actionable one: the
                //             listing is not being found at all.
                //   unknown — tracking was not running for the whole window, so a zero
                //             here means nothing and must not be shown as one.
                'view_state' => ! $viewsMeasured
                    ? 'unknown'
                    : (($seen > 0 || ($views[$id]['views'] ?? 0) > 0) ? 'ok' : 'none'),

                // Kept for callers that only need "is there anything to show".
                'has_view_data' => $seen > 0 || ($views[$id]['views'] ?? 0) > 0,
                'tracking_since' => $trackingSince,

                // Where the people who saw it came from. `item_view_stats` has stored
                // `source` from day one; without surfacing it a creator cannot tell
                // whether the link they shared did anything, which is the question
                // Module 3's tagging was added to answer.
                'sources' => $sources[$id] ?? [],
            ];
        }

        return $out;
    }

    /** @return array<int, array{views:int, unique_views:int}> */
    private function views(string $type, array $ids, string $since): array
    {
        return ItemViewStat::query()
            ->where('item_type', $type)
            ->whereIn('item_id', $ids)
            ->where('date', '>=', $since)
            ->select('item_id', DB::raw('SUM(views) as views'), DB::raw('SUM(unique_views) as unique_views'))
            ->groupBy('item_id')
            ->get()
            ->keyBy('item_id')
            ->map(fn ($r) => ['views' => (int) $r->views, 'unique_views' => (int) $r->unique_views])
            ->all();
    }

    /**
     * Where the views came from, per listing.
     *
     * One grouped query for the whole page, then ranked in PHP — the alternative is a
     * window function per row, and this table is small enough that it is not worth it.
     * Capped at the top three: a creator needs to know where people came from, not a
     * complete census.
     *
     * @return array<int, array<int, array{source:string, viewers:int}>>
     */
    private function sources(string $type, array $ids, string $since): array
    {
        $rows = ItemViewStat::query()
            ->where('item_type', $type)
            ->whereIn('item_id', $ids)
            ->where('date', '>=', $since)
            ->select('item_id', 'source', DB::raw('SUM(unique_views) as viewers'))
            ->groupBy('item_id', 'source')
            ->get();

        $out = [];

        foreach ($rows as $row) {
            $viewers = (int) $row->viewers;

            // A source with only repeat page views and no distinct viewer tells the
            // creator nothing, and would push a real source out of the top three.
            if ($viewers < 1) {
                continue;
            }

            $out[(int) $row->item_id][] = ['source' => (string) $row->source, 'viewers' => $viewers];
        }

        foreach ($out as &$list) {
            usort($list, fn ($a, $b) => $b['viewers'] <=> $a['viewers']);
            $list = array_slice($list, 0, 3);
        }
        unset($list);

        return $out;
    }

    /**
     * How many people reached the payment screen.
     *
     * `abandoned_checkouts` records EVERY checkout, not only the abandoned ones — a
     * completed one is simply marked recovered. So it is the honest count of "got as
     * far as paying", which no payment table can give on its own.
     */
    private function startedCheckout(string $type, array $ids, $since): array
    {
        return AbandonedCheckout::query()
            ->where('product_type', $type)
            ->whereIn('item_id', array_map('strval', $ids))
            ->where('created_at', '>=', $since)
            ->select('item_id', DB::raw('COUNT(*) as total'))
            ->groupBy('item_id')
            ->pluck('total', 'item_id')
            ->mapWithKeys(fn ($total, $id) => [(int) $id => (int) $total])
            ->all();
    }

    private function sold(string $type, array $ids, $since): array
    {
        if ($type === 'shop') {
            return ShopPayment::query()
                ->whereIn('shop_id', $ids)
                ->where('created_at', '>=', $since)
                ->whereNotNull('payment_status')
                ->whereNotIn('payment_status', self::NOT_PAID)
                ->select('shop_id', DB::raw('COUNT(*) as total'))
                ->groupBy('shop_id')
                ->pluck('total', 'shop_id')
                ->mapWithKeys(fn ($total, $id) => [(int) $id => (int) $total])
                ->all();
        }

        return TaskPurchase::query()
            ->whereIn('task_id', $ids)
            ->where('created_at', '>=', $since)
            ->whereNotIn('status', self::NOT_PAID)
            ->select('task_id', DB::raw('COUNT(*) as total'))
            ->groupBy('task_id')
            ->pluck('total', 'task_id')
            ->mapWithKeys(fn ($total, $id) => [(int) $id => (int) $total])
            ->all();
    }

    /** People waiting for a sold-out listing to come back (shop only). */
    private function waiting(array $ids): array
    {
        return StockWaitlist::query()
            ->whereIn('shop_id', $ids)
            ->whereNull('notified_at')
            ->select('shop_id', DB::raw('COUNT(*) as total'))
            ->groupBy('shop_id')
            ->pluck('total', 'shop_id')
            ->mapWithKeys(fn ($total, $id) => [(int) $id => (int) $total])
            ->all();
    }
}
