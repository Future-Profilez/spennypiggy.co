<?php

namespace App\Services;

use App\Models\LeaderboardSnapshot;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Rank movement — the difference between a board and a scoreboard.
 *
 * Reads the previous capture for a period and answers "did this creator go up
 * or down, and by how much". Every consumer (the board payload, the climbers
 * panel, the overtake notification) resolves movement here so the arrow on a
 * row and the creator named in a "biggest climber" panel can never disagree.
 */
class LeaderboardMovementService
{
    /**
     * How far back to look for the comparison capture, per period. A weekly
     * board compared against yesterday barely moves; compared against last
     * week it tells a story.
     */
    private const LOOKBACK_DAYS = [
        'daily' => 1,
        'weekly' => 7,
        'monthly' => 30,
        'quarterly' => 30,
        'annual' => 30,
        'all' => 7,
    ];

    /** A climb smaller than this is noise, not news. */
    public const CLIMBER_MIN_DELTA = 2;

    public static function lookbackDays(?string $period): int
    {
        return self::LOOKBACK_DAYS[$period ?? 'all'] ?? 7;
    }

    /**
     * Previous ranks for a period, keyed by user id.
     *
     * Uses the newest capture on or before the lookback date rather than an
     * exact date match — the scheduler can miss a day (Vapor blip, worker
     * down) and an exact match would silently blank every arrow on the board.
     *
     * @return array<int, int> user_id => rank
     */
    public static function previousRanks(?string $period): array
    {
        $period = $period ?: 'all';
        $cutoff = Carbon::today()->subDays(self::lookbackDays($period));

        $capturedOn = LeaderboardSnapshot::query()
            ->where('period', $period)
            ->whereDate('captured_on', '<=', $cutoff)
            ->max('captured_on');

        if (! $capturedOn) {
            return [];
        }

        // MAX() returns the stored value verbatim, and a legacy row may carry a
        // time component. whereDate compares the date part only, so the operand
        // has to be a bare date or nothing matches.
        $capturedOn = substr((string) $capturedOn, 0, 10);

        return LeaderboardSnapshot::query()
            ->where('period', $period)
            ->whereDate('captured_on', $capturedOn)
            ->pluck('rank', 'user_id')
            ->map(fn ($rank) => (int) $rank)
            ->all();
    }

    /**
     * Movement for one creator against a previous-ranks map.
     *
     * `direction` is what the UI renders: `up` / `down` / `same` / `new`.
     * A creator with no previous capture is `new` — not a 0 delta, because
     * "arrived on the board" and "held their place" are different events.
     *
     * @return array{direction: string, delta: int}
     */
    public static function movementFor(int $userId, int $currentRank, array $previousRanks): array
    {
        if (! isset($previousRanks[$userId])) {
            return ['direction' => 'new', 'delta' => 0];
        }

        // Ranks count downward — a smaller number is a better position.
        $delta = $previousRanks[$userId] - $currentRank;

        return [
            'direction' => $delta > 0 ? 'up' : ($delta < 0 ? 'down' : 'same'),
            'delta' => abs($delta),
        ];
    }

    /**
     * The biggest climbers on a period's board.
     *
     * Takes the already-ranked rows (each needing `id`, `rank`) so it costs one
     * extra query for the previous capture, not a second leaderboard
     * computation.
     *
     * @param  Collection|array  $rankedRows  rows carrying at least id + rank
     */
    public static function climbers($rankedRows, ?string $period, int $limit = 5): array
    {
        $previous = self::previousRanks($period);

        if (empty($previous)) {
            return [];
        }

        return collect($rankedRows)
            ->map(function ($row) use ($previous) {
                $row = (array) $row;
                $movement = self::movementFor((int) $row['id'], (int) $row['rank'], $previous);

                return $movement['direction'] === 'up'
                    ? $row + ['delta' => $movement['delta'], 'previous_rank' => $previous[(int) $row['id']]]
                    : null;
            })
            ->filter()
            ->filter(fn ($row) => $row['delta'] >= self::CLIMBER_MIN_DELTA)
            ->sortByDesc('delta')
            ->take($limit)
            ->values()
            ->all();
    }
}
