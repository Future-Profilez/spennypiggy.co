<?php

namespace App\Services;

use App\Models\ItemViewStat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Counts views of a single listing.
 *
 * ⚠️ **This does NOT use VisitTracker's cache-buffer pattern, and cannot.**
 *
 * That flush works by looping over `SOURCES × PAGE_TYPES` — a **fixed** key space it can
 * enumerate. Item ids are unbounded, so buffered per-item counters could never be found
 * again and would simply expire in the cache. This writes straight to the table instead:
 * one upsert per view. Item detail pages are low-volume compared with page views in
 * general, and nothing can be lost between a flush that never runs.
 *
 * Aggregate only — no per-visitor row is ever written.
 */
class ItemViewTracker
{
    /** How long a closed day's rows are kept. A year plus slack, for year-on-year. */
    public const RETENTION_DAYS = 400;

    /** Item types that have a public page to be viewed. Mirrors ItemShareService. */
    public const TYPES = ['shop', 'task'];

    public function __construct(private VisitTracker $visits) {}

    /**
     * Record one view. Never throws — analytics must never be why a page fails.
     *
     * @param  int|null  $creatorId  the owner, so their own views can be excluded
     */
    public function record(Request $request, string $itemType, ?int $itemId, ?int $creatorId = null): bool
    {
        try {
            if (! in_array($itemType, self::TYPES, true) || ! $itemId) {
                return false;
            }

            if ($creatorId && (int) Auth::id() === (int) $creatorId) {
                return false;
            }

            if ($this->visits->isBot($request)) {
                return false;
            }

            $source = $this->visits->resolveSource($request);
            $date = now()->toDateString();

            // The unique claim is taken NOW, on the request, because it depends on the
            // request's own cookie. Only the write is deferred.
            $isUnique = $this->claimUnique($request, $itemType, (int) $itemId, $date);

            // ⚠️ Written AFTER the response, not during it. This is a listing page a
            // popular item can hammer, and counting a view must never sit between the
            // visitor and the page they asked for.
            $type = $itemType;
            $id = (int) $itemId;

            dispatch(function () use ($type, $id, $date, $source, $isUnique) {
                // ⚠️ Its own guard: this closure runs OUTSIDE the try/catch below,
                // after the response has been sent. Without it an analytics failure
                // becomes an unhandled error on a request the visitor already
                // received — the one thing this feature must never cause.
                try {
                    $this->upsert($type, $id, $date, $source, $isUnique);
                } catch (\Throwable $e) {
                    Log::warning('ItemViewTracker: deferred write failed', [
                        'item_type' => $type, 'item_id' => $id, 'error' => $e->getMessage(),
                    ]);
                }
            })->afterResponse();

            return true;
        } catch (\Throwable $e) {
            Log::warning('ItemViewTracker: failed to record a view', [
                'item_type' => $itemType, 'item_id' => $itemId, 'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * First view of this item by this visitor today?
     *
     * Keyed on the existing 24-hour visitor cookie, so it needs no new cookie and stores
     * no identifier of its own — the cache key is derived and expires on its own. Unlike
     * `site_visit_stats.unique_visitors` (which is once per DAY across the whole site),
     * this is per item, which is the only thing that makes sense on a listing.
     */
    private function claimUnique(Request $request, string $itemType, int $itemId, string $date): bool
    {
        $token = (string) ($request->cookies->get(VisitTracker::VISITOR_COOKIE) ?: '');

        if ($token === '') {
            // First ever request: the middleware queues the cookie but it is not
            // readable yet. Fall back to the session so a real person is not counted
            // as unique on every page load.
            if ($request->hasSession()) {
                $token = (string) $request->session()->getId();
            }
        }

        if ($token === '') {
            return false;
        }

        $key = 'ivt:'.sha1($token.'|'.$itemType.'|'.$itemId.'|'.$date);

        // Cache::add is the claim: it only succeeds if the key is absent.
        return Cache::add($key, 1, now()->addDay());
    }

    /**
     * Increment the day's bucket.
     *
     * Written as insert-then-increment rather than read-modify-write so two concurrent
     * views cannot read the same value and both write it back.
     */
    public function upsert(string $itemType, int $itemId, string $date, string $source, bool $isUnique): void
    {
        $keys = [
            'item_type' => $itemType,
            'item_id' => $itemId,
            'date' => $date,
            'source' => $source,
        ];

        // firstOrCreate races cleanly on the unique index; a duplicate-key exception
        // just means another request created the row first.
        try {
            ItemViewStat::firstOrCreate($keys, ['views' => 0, 'unique_views' => 0]);
        } catch (\Throwable $e) {
            // Row exists — that is the outcome we wanted.
        }

        $updated = ItemViewStat::where($keys)->update([
            'views' => DB::raw('views + 1'),
            'unique_views' => DB::raw('unique_views + '.($isUnique ? 1 : 0)),
            'updated_at' => now(),
        ]);

        // Matching nothing means the row we just ensured is not there — the insert
        // failed for a reason other than the unique index, and this view has been
        // lost. Silent loss in an analytics table is indistinguishable from "quiet
        // week", so say so.
        if (! $updated) {
            Log::warning('ItemViewTracker: a view was lost — no row to increment', $keys);
        }
    }

    /**
     * The first day any view was ever recorded, or null if nothing has been.
     *
     * This is what makes a zero readable. Without it, "0 views" could mean tracking was
     * not running yet OR that genuinely nobody looked — and those are opposite findings,
     * one of which is the whole reason this feature exists.
     *
     * Cached: it is a MIN over an append-only table, and it is read on every listing page.
     */
    public function trackingSince(): ?string
    {
        return Cache::remember('item_views:tracking_since', 3600, function () {
            return ItemViewStat::min('date');
        });
    }

    /**
     * Delete closed days past the retention window.
     *
     * One row per item per day per source, so this grows with the catalogue rather than
     * with traffic — but it is still unbounded without a prune.
     */
    public function prune(?int $days = null, bool $dryRun = false): int
    {
        $cutoff = now()->subDays(max(1, $days ?? self::RETENTION_DAYS))->toDateString();

        if ($dryRun) {
            return ItemViewStat::where('date', '<', $cutoff)->count();
        }

        $deleted = 0;

        do {
            $batch = ItemViewStat::where('date', '<', $cutoff)->limit(1000)->delete();
            $deleted += $batch;
        } while ($batch > 0);

        if ($deleted > 0) {
            // Pruning moves MIN(date) forward, and trackingSince() decides whether a
            // zero means "nobody looked" or "we were not counting yet". A stale value
            // there would answer that question wrongly for up to an hour.
            Cache::forget('item_views:tracking_since');
        }

        return $deleted;
    }
}
