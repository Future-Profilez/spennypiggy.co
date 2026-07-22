<?php

namespace Tests\Unit;

use App\Http\Controllers\Auth\LeaderBoardController;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * The leaderboard offers six periods and every source in the query reads its
 * window from one place. These tests pin that place down.
 */
class LeaderboardPeriodTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // A mid-quarter, mid-week date so no window collapses onto a boundary
        // and accidentally passes.
        Carbon::setTestNow(Carbon::parse('2026-05-14 15:30:00'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_every_advertised_period_resolves(): void
    {
        foreach (LeaderBoardController::PERIODS as $period) {
            $window = LeaderBoardController::periodWindow($period);

            if ($period === 'all') {
                $this->assertNull($window, 'The lifetime board must have no date constraint.');

                continue;
            }

            $this->assertIsArray($window, "Period {$period} produced no window.");
            $this->assertTrue($window[0]->lt($window[1]), "Period {$period} window is inverted.");
        }
    }

    public function test_windows_match_the_period_they_are_named_after(): void
    {
        $this->assertSame('2026-05-14', LeaderBoardController::periodWindow('daily')[0]->toDateString());
        $this->assertSame('2026-05-11', LeaderBoardController::periodWindow('weekly')[0]->toDateString());
        $this->assertSame('2026-05-01', LeaderBoardController::periodWindow('monthly')[0]->toDateString());
        $this->assertSame('2026-04-01', LeaderBoardController::periodWindow('quarterly')[0]->toDateString());
        $this->assertSame('2026-06-30', LeaderBoardController::periodWindow('quarterly')[1]->toDateString());
        $this->assertSame('2026-01-01', LeaderBoardController::periodWindow('annual')[0]->toDateString());
        $this->assertSame('2026-12-31', LeaderBoardController::periodWindow('annual')[1]->toDateString());
    }

    public function test_each_period_contains_the_shorter_one_inside_it(): void
    {
        // Nesting is the property that makes the boards comparable: a creator's
        // weekly total can never exceed their monthly, and so on up to lifetime.
        $order = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'];

        foreach ($order as $i => $period) {
            $inner = LeaderBoardController::periodWindow($period);
            $outer = LeaderBoardController::periodWindow($order[$i + 1] ?? null);

            if (! $outer) {
                continue;
            }

            $this->assertTrue(
                $inner[0]->gte($outer[0]) && $inner[1]->lte($outer[1]),
                "{$period} is not contained within the next period up."
            );
        }
    }

    public function test_an_unknown_period_falls_back_to_lifetime_not_an_error(): void
    {
        // A stale bookmark or a typed URL must not 500 the public leaderboard.
        $this->assertNull(LeaderBoardController::periodWindow('fortnightly'));
        $this->assertNull(LeaderBoardController::periodWindow(null));
    }
}
