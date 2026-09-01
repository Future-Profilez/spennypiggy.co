<?php

namespace Tests\Feature;

use App\Console\Commands\NotifyLeaderboardMovement;
use App\Jobs\SendEngagementNotification;
use App\Models\EngagementNotification;
use App\Models\LeaderboardSnapshot;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class LeaderboardMovementNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();
        config(['leaderboard.movement_notifications' => true]);
        config(['leaderboard.movement_min_places' => 3]);
        config(['leaderboard.movement_period' => 'weekly']);
    }

    /** Two captures a lookback apart: where they were, and where they are. */
    private function track(User $user, int $then, int $now, string $period = 'weekly'): void
    {
        $today = Carbon::now()->startOfDay();
        // `weekly` looks back 7 days — the same window the page's arrows use.
        $earlier = $today->copy()->subDays(7);

        foreach ([[$earlier, $then], [$today, $now]] as [$on, $rank]) {
            LeaderboardSnapshot::create([
                'user_id' => $user->id,
                'period' => $period,
                'rank' => $rank,
                'score' => 100 - $rank,
                'supporters' => 50 - $rank,
                'captured_on' => $on->toDateString(),
            ]);
        }
    }

    public function test_a_creator_who_climbed_is_notified(): void
    {
        $user = User::factory()->create(['role' => 1]);
        $this->track($user, then: 20, now: 8);

        $this->artisan('leaderboard:notify-movement')->assertSuccessful();

        Queue::assertPushed(SendEngagementNotification::class);
        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $user->id,
            'type' => NotifyLeaderboardMovement::TYPE,
        ]);
    }

    public function test_a_creator_who_slipped_is_never_notified(): void
    {
        // 🚨 The whole point. A creator who lost places has not done anything
        // wrong, and a push telling them so is a telling-off from the platform
        // they sell on.
        $user = User::factory()->create(['role' => 1]);
        $this->track($user, then: 4, now: 19);

        $this->artisan('leaderboard:notify-movement')->assertSuccessful();

        Queue::assertNothingPushed();
        $this->assertDatabaseCount('engagement_notifications', 0);
    }

    public function test_a_move_below_the_threshold_is_noise_and_is_not_sent(): void
    {
        $user = User::factory()->create(['role' => 1]);
        $this->track($user, then: 10, now: 8);

        $this->artisan('leaderboard:notify-movement')->assertSuccessful();

        Queue::assertNothingPushed();
    }

    public function test_the_flag_off_reports_and_claims_nothing(): void
    {
        // Claiming while switched off would silently swallow the first real run.
        config(['leaderboard.movement_notifications' => false]);

        $user = User::factory()->create(['role' => 1]);
        $this->track($user, then: 30, now: 2);

        $this->artisan('leaderboard:notify-movement')->assertSuccessful();

        Queue::assertNothingPushed();
        $this->assertDatabaseCount('engagement_notifications', 0);
    }

    public function test_a_dry_run_claims_nothing_even_with_the_flag_on(): void
    {
        $user = User::factory()->create(['role' => 1]);
        $this->track($user, then: 30, now: 2);

        $this->artisan('leaderboard:notify-movement', ['--dry-run' => true])->assertSuccessful();

        Queue::assertNothingPushed();
        $this->assertDatabaseCount('engagement_notifications', 0);
    }

    public function test_a_creator_who_left_the_public_board_is_not_told_about_a_rank_they_no_longer_hold(): void
    {
        $user = User::factory()->create(['role' => 1, 'leaderboard_opt_out' => true]);
        $this->track($user, then: 30, now: 2);

        $this->artisan('leaderboard:notify-movement')->assertSuccessful();

        Queue::assertNothingPushed();
    }

    public function test_a_suspended_account_is_not_notified(): void
    {
        $user = User::factory()->create(['role' => 1, 'suspended_account' => 1]);
        $this->track($user, then: 30, now: 2);

        $this->artisan('leaderboard:notify-movement')->assertSuccessful();

        Queue::assertNothingPushed();
    }

    public function test_a_re_run_on_the_same_capture_does_not_send_twice(): void
    {
        $user = User::factory()->create(['role' => 1]);
        $this->track($user, then: 30, now: 2);

        $this->artisan('leaderboard:notify-movement')->assertSuccessful();
        $this->artisan('leaderboard:notify-movement')->assertSuccessful();

        Queue::assertPushed(SendEngagementNotification::class, 1);
        $this->assertSame(1, EngagementNotification::where('user_id', $user->id)->count());
    }

    public function test_a_missed_snapshot_day_still_finds_the_comparison_capture(): void
    {
        // 🚨 The scheduler misses days. An EXACT match on `latest - lookback`
        // finds no comparison row, reports "nobody climbed" and sends nothing,
        // with no error anywhere — which is why this is a test and not a comment.
        $user = User::factory()->create(['role' => 1]);
        $today = Carbon::now()->startOfDay();

        // The 7-day-ago capture never ran; the newest earlier one is 9 days old.
        foreach ([[$today->copy()->subDays(9), 30], [$today, 4]] as [$on, $rank]) {
            LeaderboardSnapshot::create([
                'user_id' => $user->id,
                'period' => 'weekly',
                'rank' => $rank,
                'score' => 100 - $rank,
                'supporters' => 50 - $rank,
                'captured_on' => $on->toDateString(),
            ]);
        }

        $this->artisan('leaderboard:notify-movement')->assertSuccessful();

        Queue::assertPushed(SendEngagementNotification::class);
    }

    public function test_nothing_is_sent_when_there_is_no_earlier_capture_to_compare_against(): void
    {
        $user = User::factory()->create(['role' => 1]);

        LeaderboardSnapshot::create([
            'user_id' => $user->id,
            'period' => 'weekly',
            'rank' => 2,
            'score' => 98,
            'supporters' => 48,
            'captured_on' => Carbon::now()->startOfDay()->toDateString(),
        ]);

        $this->artisan('leaderboard:notify-movement')->assertSuccessful();

        Queue::assertNothingPushed();
    }

    public function test_the_run_is_capped_and_says_so_rather_than_truncating_silently(): void
    {
        config(['leaderboard.movement_max_per_run' => 1]);

        foreach (range(1, 3) as $i) {
            $this->track(User::factory()->create(['role' => 1]), then: 40 - $i, now: $i);
        }

        $this->artisan('leaderboard:notify-movement')
            ->expectsOutputToContain('capping this run at 1')
            ->assertSuccessful();

        Queue::assertPushed(SendEngagementNotification::class, 1);
    }

    /**
     * 🚨 A CREATOR WHO SLIPPED USED TO TAKE THE WHOLE RUN DOWN.
     *
     * `leaderboard_snapshots.rank` is `unsignedInteger`, and in MySQL an UNSIGNED minus
     * an UNSIGNED is UNSIGNED — so for anybody whose rank got WORSE the subtraction
     * underflows and MySQL answers 1690 "BIGINT UNSIGNED value is out of range" before
     * the `>= minPlaces` filter can exclude them. One slipping creator meant nobody who
     * climbed was told (JAVASCRIPT-REACT-AK).
     *
     * ⚠️ SQLITE HAS NO UNSIGNED TYPES, so this test can NEVER reproduce the crash and
     * asserting on behaviour here would pass against the bug. It asserts the CAST is in
     * the SQL the command actually issues — the only thing that is true on both engines.
     */
    public function test_the_rank_difference_is_cast_to_signed(): void
    {
        $climber = User::factory()->create(['role' => 1]);
        $slipper = User::factory()->create(['role' => 1]);

        $this->track($climber, then: 9, now: 2);
        $this->track($slipper, then: 2, now: 9);

        $statements = [];

        DB::listen(function ($q) use (&$statements) {
            $statements[] = $q->sql;
        });

        $this->artisan('leaderboard:notify-movement')->assertExitCode(0);

        $movers = array_values(array_filter(
            $statements,
            fn ($sql) => str_contains($sql, 'leaderboard_snapshots') && str_contains($sql, 'prv')
        ));

        $this->assertNotEmpty($movers, 'The movers query did not run at all.');

        foreach ($movers as $sql) {
            $this->assertMatchesRegularExpression(
                '/cast\s*\(\s*prv\.rank\s+as\s+signed\s*\)/i',
                $sql,
                'An unsigned subtraction underflows in MySQL for every creator who slipped.'
            );
        }
    }
}
