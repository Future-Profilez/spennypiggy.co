<?php

namespace App\Console\Commands;

use App\Models\LeaderboardSnapshot;
use App\Models\User;
use App\Services\LeaderboardMovementService;
use App\Services\NotificationDispatcher;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Tell a creator when they have climbed the board.
 *
 * 🚨 THE DATA FOR THIS ALREADY EXISTED AND NOTHING READ IT. `leaderboard:snapshot`
 * has been writing a rank per creator per period per day since the movement
 * arrows were built; the arrows are the only thing that ever looked at it, and
 * a creator had to open the page to see one. This is the same fact, delivered.
 *
 * 🚨 UPWARD MOVES ONLY. A creator who slipped two places has not done anything
 * wrong, and a push saying so is a telling-off from the platform they sell on.
 * The board's own "down" chip is grey rather than red for the same reason.
 *
 * ⚠️ Snapshots, never a live recompute. The board query scans seven aggregates
 * across every creator; the captures are what it is for, and reading them means
 * this command cannot disagree with the arrows the page draws.
 *
 * ⚠️ Needs `queue:work` — the fan-out is queued per creator
 * (`NotificationDispatcher::queue`), never sent inline in a loop: `send()` makes
 * a synchronous HTTP call per recipient and production is a 60-second Lambda.
 */
class NotifyLeaderboardMovement extends Command
{
    protected $signature = 'leaderboard:notify-movement
                            {--dry-run : Report what would be sent and claim nothing}
                            {--period= : Override the configured board}
                            {--min= : Override the minimum number of places climbed}';

    protected $description = 'Notify creators who have climbed the leaderboard since the last comparable capture';

    public const TYPE = 'leaderboard_movement';

    public function handle(): int
    {
        // The migration lives in this app, but the guard is the house pattern —
        // a command must not fatal on an environment where the table is absent.
        if (! Schema::hasTable('leaderboard_snapshots')) {
            $this->warn('leaderboard_snapshots is not present — nothing to compare.');

            return self::SUCCESS;
        }

        $period = (string) ($this->option('period') ?: config('leaderboard.movement_period', 'weekly'));
        $minPlaces = (int) ($this->option('min') ?: config('leaderboard.movement_min_places', 3));
        $dryRun = (bool) $this->option('dry-run');
        $enabled = (bool) config('leaderboard.movement_notifications', false);

        // ⚠️ `substr(…, 0, 10)`: MAX() returns the stored value verbatim and a
        // legacy row can carry a time component, so an exact string compare
        // against a bare date matches nothing. Same trap `previousRanks()`
        // documents.
        $latest = LeaderboardSnapshot::where('period', $period)->max('captured_on');
        $latest = $latest ? substr((string) $latest, 0, 10) : null;

        if (! $latest) {
            $this->warn("No captures for the {$period} board yet.");

            return self::SUCCESS;
        }

        // 🚨 THE NEWEST CAPTURE AT OR BEFORE THE CUTOFF, NEVER AN EXACT DATE.
        // The scheduler misses days. An exact match on `latest - lookback` finds
        // no comparison row, reports "nobody climbed" and sends NOTHING, with no
        // error anywhere — the identical fault
        // `LeaderboardMovementService::previousRanks()` already works around for
        // the page's own arrows. The lookback is that service's, so a creator
        // told they climbed 12 places sees "12" on the chip.
        $lookback = LeaderboardMovementService::lookbackDays($period);
        $cutoff = Carbon::parse($latest)->subDays($lookback)->toDateString();

        $since = LeaderboardSnapshot::where('period', $period)
            ->whereDate('captured_on', '<=', $cutoff)
            ->max('captured_on');
        $since = $since ? substr((string) $since, 0, 10) : null;

        if (! $since) {
            $this->warn("No capture on or before {$cutoff} to compare the {$period} board against.");

            return self::SUCCESS;
        }

        $movers = $this->movers($period, $latest, $since, $minPlaces);

        if ($movers === []) {
            $this->info("No creator climbed {$minPlaces}+ places on the {$period} board since {$since}.");

            return self::SUCCESS;
        }

        $cap = config('leaderboard.movement_max_per_run');
        if ($cap !== null && $cap !== '' && count($movers) > (int) $cap) {
            // 🚨 Never truncate silently. A capped run reads as "that is everyone"
            // when it is not, and the creators cut are the ones nobody hears about.
            $this->warn(sprintf('%d movers found, capping this run at %d.', count($movers), (int) $cap));
            $movers = array_slice($movers, 0, (int) $cap);
        }

        $sent = 0;
        $skipped = 0;

        // ⚠️ One query, not one per mover. Capped at 500 a run, `User::find()`
        // inside the loop was 500 round trips.
        $users = User::whereIn('id', array_column($movers, 'user_id'))->get()->keyBy('id');

        foreach ($movers as $row) {
            $user = $users->get($row['user_id']);

            // A creator who left the public board, or who is suspended, is not
            // told about a rank they no longer hold.
            if (! $user || (int) ($user->suspended_account ?? 0) === 1 || (bool) ($user->leaderboard_opt_out ?? false)) {
                $skipped++;

                continue;
            }

            if ($dryRun || ! $enabled) {
                $this->line(sprintf(
                    '  would notify @%s — #%d, up %d',
                    $user->username,
                    $row['rank'],
                    $row['delta'],
                ));
                $skipped++;

                continue;
            }

            // One notification per creator per capture. Claimed BEFORE the queue
            // push, so a re-run on the same day cannot double-send.
            if (! NotificationDispatcher::claim($user->id, self::TYPE, $period.'|'.$latest)) {
                $skipped++;

                continue;
            }

            try {
                NotificationDispatcher::queue(
                    $user,
                    self::TYPE,
                    $this->payload($row, $period),
                    [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH],
                );
                $sent++;
            } catch (\Throwable $e) {
                Log::error('leaderboard:notify-movement failed for creator', [
                    'user_id' => $user->id, 'error' => $e->getMessage(),
                ]);
                $skipped++;
            }
        }

        if (! $enabled && ! $dryRun) {
            $this->warn('LEADERBOARD_MOVEMENT_NOTIFICATIONS is off — reported only, nothing claimed or sent.');
        }

        $this->info("Movement notifications: {$sent} queued, {$skipped} skipped.");

        return self::SUCCESS;
    }

    /**
     * Creators whose rank IMPROVED by at least `$minPlaces` between two captures.
     *
     * ⚠️ A lower rank number is a better position, so the climb is
     * `then - now`. Getting that backwards congratulates everyone who slipped.
     *
     * @return array<int, array{user_id: int, rank: int, previous: int, delta: int}>
     */
    private function movers(string $period, string $latest, string $since, int $minPlaces): array
    {
        // ⚠️ The aliases are `cur`/`prv`, not `now`/`then`. Both of those are SQL
        // keywords, and they appear UNQUOTED inside the raw comparison below —
        // SQLite answers `near "then": syntax error` and the whole command dies.
        $rows = DB::table('leaderboard_snapshots as cur')
            ->join('leaderboard_snapshots as prv', function ($join) use ($period, $since) {
                $join->on('prv.user_id', '=', 'cur.user_id')
                    ->where('prv.period', '=', $period)
                    ->whereDate('prv.captured_on', '=', $since);
            })
            ->where('cur.period', $period)
            ->whereDate('cur.captured_on', $latest)
            /*
             * 🚨 CAST TO SIGNED, OR A CREATOR WHO SLIPPED TAKES THE COMMAND DOWN.
             *
             * `leaderboard_snapshots.rank` is `unsignedInteger`, and in MySQL an
             * UNSIGNED minus an UNSIGNED is UNSIGNED — so for anybody whose rank got
             * WORSE (cur > prv) the subtraction underflows and MySQL answers
             * **1690 "BIGINT UNSIGNED value is out of range"** rather than a negative
             * number. The row is evaluated before the `>= $minPlaces` filter can
             * exclude it, so one creator slipping kills the whole run and NOBODY who
             * climbed is told (JAVASCRIPT-REACT-AK).
             *
             * ⚠️ SQLITE HAS NO UNSIGNED TYPES, so the test suite could never reproduce
             * this and never will — the guard is the cast being here, not a test
             * result. `CAST(x AS SIGNED)` is valid in both (SQLite reads the unknown
             * type name as NUMERIC affinity), so the two engines agree.
             */
            ->whereRaw('CAST(prv.rank AS SIGNED) - CAST(cur.rank AS SIGNED) >= ?', [$minPlaces])
            ->orderByRaw('CAST(prv.rank AS SIGNED) - CAST(cur.rank AS SIGNED) DESC')
            ->get(['cur.user_id', 'cur.rank as rank', 'prv.rank as previous']);

        return $rows->map(fn ($r) => [
            'user_id' => (int) $r->user_id,
            'rank' => (int) $r->rank,
            'previous' => (int) $r->previous,
            'delta' => (int) $r->previous - (int) $r->rank,
        ])->all();
    }

    /**
     * ⚠️ No money and no supporter's name. The board publishes neither, and a
     * push is the one surface a creator reads without any of that context.
     *
     * @param  array{rank: int, delta: int}  $row
     * @return array<string, mixed>
     */
    private function payload(array $row, string $period): array
    {
        $label = match ($period) {
            'daily' => 'today',
            'weekly' => 'this week',
            'monthly' => 'this month',
            'quarterly' => 'this quarter',
            'annual' => 'this year',
            default => 'on the leaderboard',
        };

        return [
            'title' => sprintf('You climbed %d place%s', $row['delta'], $row['delta'] === 1 ? '' : 's'),
            'body' => sprintf('You are #%d %s. Keep going.', $row['rank'], $label),
            'url' => $period === 'all' ? '/leaderboard' : '/leaderboard/'.$period,
            'module' => 'leaderboard',
        ];
    }
}
