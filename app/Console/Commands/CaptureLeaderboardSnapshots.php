<?php

namespace App\Console\Commands;

use App\Http\Controllers\Auth\LeaderBoardController;
use App\Models\LeaderboardSnapshot;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CaptureLeaderboardSnapshots extends Command
{
    protected $signature = 'leaderboard:snapshot
                            {--period= : Capture one period only (daily|weekly|monthly|quarterly|annual|all)}
                            {--dry-run : Compute and report without writing}';

    protected $description = 'Capture today\'s leaderboard standing per period so the board can show rank movement';

    /**
     * Only the visible end of the board is worth remembering. Movement below
     * this depth is churn nobody reads, and storing every creator every day
     * for six periods grows the table for no read.
     */
    private const CAPTURE_DEPTH = 500;

    public function handle(LeaderBoardController $leaderboard): int
    {
        $periods = $this->option('period')
            ? [$this->option('period')]
            : LeaderBoardController::PERIODS;

        $today = Carbon::today();
        $dryRun = (bool) $this->option('dry-run');

        foreach ($periods as $period) {
            if (! in_array($period, LeaderBoardController::PERIODS, true)) {
                $this->error("Unknown period: {$period}");

                return self::FAILURE;
            }

            try {
                $rows = $leaderboard->calc($period === 'all' ? null : $period)
                    ->take(self::CAPTURE_DEPTH)
                    ->values();
            } catch (\Throwable $e) {
                // One period failing must not cost the other five their history.
                Log::error('leaderboard:snapshot failed for period', [
                    'period' => $period,
                    'error' => $e->getMessage(),
                ]);
                $this->error("{$period}: {$e->getMessage()}");

                continue;
            }

            $payload = [];
            $rank = 1;

            foreach ($rows as $user) {
                $payload[] = [
                    'user_id' => $user->id,
                    'period' => $period,
                    'rank' => $rank,
                    'score' => round((float) ($user->combined_score ?? 0), 2),
                    'supporters' => (int) ($user->total_supporters ?? 0),
                    'captured_on' => $today->toDateString(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $rank++;
            }

            if ($dryRun) {
                $this->line("{$period}: would capture ".count($payload).' rows');

                continue;
            }

            // upsert on the unique key, so a re-run the same day corrects the
            // capture instead of throwing or duplicating it.
            foreach (array_chunk($payload, 200) as $chunk) {
                DB::table('leaderboard_snapshots')->upsert(
                    $chunk,
                    ['user_id', 'period', 'captured_on'],
                    ['rank', 'score', 'supporters', 'updated_at']
                );
            }

            $this->info("{$period}: captured ".count($payload).' rows');
        }

        if (! $dryRun) {
            $this->prune();

            // Yesterday's arrows are now wrong on any cached board, and the
            // capture is the moment they change.
            foreach (LeaderBoardController::PERIODS as $period) {
                Cache::forget('leaderboard_board_'.$period);
            }
        }

        return self::SUCCESS;
    }

    /**
     * Keep a year of history — enough for an annual board's comparison and a
     * hall-of-fame archive, without the table growing forever.
     */
    private function prune(): void
    {
        $deleted = LeaderboardSnapshot::query()
            ->whereDate('captured_on', '<', Carbon::today()->subYear())
            ->delete();

        if ($deleted) {
            $this->line("pruned {$deleted} snapshot rows older than a year");
        }
    }
}
