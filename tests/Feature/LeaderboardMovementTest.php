<?php

namespace Tests\Feature;

use App\Http\Controllers\Auth\LeaderBoardController;
use App\Models\LeaderboardSnapshot;
use App\Services\LeaderboardMovementService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class LeaderboardMovementTest extends TestCase
{
    use RefreshDatabase;

    private function capture(int $userId, string $period, int $rank, Carbon $on): void
    {
        LeaderboardSnapshot::create([
            'user_id' => $userId,
            'period' => $period,
            'rank' => $rank,
            'score' => 100 - $rank,
            'supporters' => 50 - $rank,
            'captured_on' => $on->toDateString(),
        ]);
    }

    public function test_movement_reads_up_down_held_and_new(): void
    {
        $previous = [1 => 5, 2 => 3, 3 => 9];

        $this->assertSame(
            ['direction' => 'up', 'delta' => 3],
            LeaderboardMovementService::movementFor(1, 2, $previous)
        );

        $this->assertSame(
            ['direction' => 'down', 'delta' => 4],
            LeaderboardMovementService::movementFor(2, 7, $previous)
        );

        $this->assertSame(
            ['direction' => 'same', 'delta' => 0],
            LeaderboardMovementService::movementFor(3, 9, $previous)
        );

        // Never seen before is `new`, not a zero delta — arriving on the board
        // and holding your place are different events.
        $this->assertSame(
            ['direction' => 'new', 'delta' => 0],
            LeaderboardMovementService::movementFor(99, 4, $previous)
        );
    }

    public function test_previous_ranks_fall_back_to_the_newest_capture_before_the_cutoff(): void
    {
        // The scheduler missed the exact lookback day. An exact-date match would
        // blank every arrow on the board; the newest earlier capture is used.
        $this->capture(1, 'weekly', 4, Carbon::today()->subDays(11));
        $this->capture(1, 'weekly', 2, Carbon::today()->subDays(9));
        $this->capture(1, 'weekly', 1, Carbon::today()); // today must never be the baseline

        $ranks = LeaderboardMovementService::previousRanks('weekly');

        $this->assertSame([1 => 2], $ranks);
    }

    public function test_previous_ranks_are_empty_before_any_history_exists(): void
    {
        $this->assertSame([], LeaderboardMovementService::previousRanks('monthly'));
    }

    public function test_periods_do_not_read_each_others_captures(): void
    {
        $this->capture(1, 'daily', 8, Carbon::today()->subDays(1));
        $this->capture(1, 'monthly', 3, Carbon::today()->subDays(30));

        $this->assertSame([1 => 8], LeaderboardMovementService::previousRanks('daily'));
        $this->assertSame([1 => 3], LeaderboardMovementService::previousRanks('monthly'));
    }

    public function test_climbers_are_ranked_by_delta_and_ignore_small_moves(): void
    {
        $on = Carbon::today()->subDays(8);
        $this->capture(1, 'all', 12, $on);  // climbs 9
        $this->capture(2, 'all', 3, $on);   // slips
        $this->capture(3, 'all', 6, $on);   // climbs 1 — noise, not news
        $this->capture(4, 'all', 20, $on);  // climbs 16

        $board = [
            ['id' => 4, 'rank' => 4, 'username' => 'four'],
            ['id' => 1, 'rank' => 3, 'username' => 'one'],
            ['id' => 3, 'rank' => 5, 'username' => 'three'],
            ['id' => 2, 'rank' => 8, 'username' => 'two'],
        ];

        $climbers = LeaderboardMovementService::climbers($board, 'all');

        $this->assertSame([4, 1], array_column($climbers, 'id'));
        $this->assertSame([16, 9], array_column($climbers, 'delta'));
        $this->assertSame(20, $climbers[0]['previous_rank']);
    }

    public function test_climbers_are_empty_when_there_is_nothing_to_compare_against(): void
    {
        $board = [['id' => 1, 'rank' => 1, 'username' => 'one']];

        $this->assertSame([], LeaderboardMovementService::climbers($board, 'weekly'));
    }

    public function test_the_board_is_public_and_ships_the_props_the_page_needs(): void
    {
        $this->get('/leaderboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('leaderboard/Board')
                ->has('data')
                ->has('periods')
                ->has('total')
                ->has('climbers')
                ->where('period', 'all')
                // A guest has no standing and no opt-out setting to read.
                ->where('you', null)
                ->where('opted_out', false)
            );
    }

    public function test_an_empty_board_is_never_cached(): void
    {
        // The bug this guards: Cache::remember stored whatever the callback
        // returned, so one bad moment pinned "0 creators ranked" on the page
        // for the full two-hour TTL after the query had already recovered.
        Cache::forget(LeaderBoardController::BOARD_CACHE_KEY.'all');

        $this->get('/leaderboard')->assertOk();

        $this->assertNull(Cache::get(LeaderBoardController::BOARD_CACHE_KEY.'all'));
    }

    public function test_a_cached_board_is_served_without_recomputing(): void
    {
        Cache::put(LeaderBoardController::BOARD_CACHE_KEY.'all', [[
            'id' => 7,
            'rank' => 1,
            'name' => 'Cached Creator',
            'username' => 'cached',
            'profile_status_lock' => 2,
            'role' => 1,
            'avatar' => null,
            'coverimg' => null,
            'top' => 100.0,
            'amount' => 0,
            'currency' => 'GBP',
            'supporters' => 3,
            'engagement' => 6,
        ]], 60);

        $this->get('/leaderboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('total', 1)
                ->where('data.0.username', 'cached')
            );
    }

    public function test_an_unrecognised_period_falls_back_to_all_instead_of_minting_a_cache_key(): void
    {
        $this->get('/leaderboard/not-a-period')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('period', 'all'));

        $this->assertNull(Cache::get(LeaderBoardController::BOARD_CACHE_KEY.'not-a-period'));
    }

    public function test_a_re_run_on_the_same_day_corrects_the_capture_instead_of_duplicating_it(): void
    {
        $today = Carbon::today()->toDateString();

        foreach ([7, 2] as $rank) {
            DB::table('leaderboard_snapshots')->upsert([[
                'user_id' => 1,
                'period' => 'weekly',
                'rank' => $rank,
                'score' => 1,
                'supporters' => 1,
                'captured_on' => $today,
                'created_at' => now(),
                'updated_at' => now(),
            ]], ['user_id', 'period', 'captured_on'], ['rank', 'score', 'supporters', 'updated_at']);
        }

        $this->assertSame(1, LeaderboardSnapshot::count());
        $this->assertSame(2, LeaderboardSnapshot::first()->rank);
    }
}
