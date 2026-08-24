<?php

namespace Tests\Feature;

use App\Http\Controllers\Auth\LeaderBoardController;
use App\Models\LeaderboardSnapshot;
use App\Models\User;
use App\Models\WishItem;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * The board's newer server-side props: the buy route on a row, the close time,
 * and the winners of the period that has just ended.
 */
class LeaderboardBoardExtrasTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The board caches for up to two hours; a test that shares a warm entry
        // with the one before it is testing the cache, not the code.
        foreach (LeaderBoardController::PERIODS as $period) {
            Cache::forget(LeaderBoardController::BOARD_CACHE_KEY.$period);
        }
    }

    private function creator(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'stripe_details_submitted' => 1,
            'suspended_account' => 0,
            'leaderboard_opt_out' => 0,
        ], $attributes));
    }

    public function test_the_close_time_is_null_for_the_lifetime_board_and_set_for_every_other(): void
    {
        // Inventing a deadline for a ranking that has none would be the page
        // telling a creator something untrue.
        $this->assertNull(LeaderBoardController::periodWindow('all'));
        $this->assertNotNull(LeaderBoardController::periodWindow('weekly'));

        $this->get('/leaderboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('period_ends_at', null));
    }

    public function test_the_lifetime_board_has_no_closed_period_and_therefore_no_winners(): void
    {
        $this->assertNull(LeaderBoardController::previousPeriodWindow('all'));
        $this->assertNull(LeaderBoardController::previousPeriodLabel('all'));

        $this->get('/leaderboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('past_winners', []));
    }

    public function test_nobody_is_crowned_for_a_period_in_which_nothing_happened(): void
    {
        // 🚨 `calc()` returns EVERY eligible creator with windowed counts, so it
        // never comes back empty — a quiet month still produced a full
        // collection with every score at zero, and the first three rows of
        // arbitrary database order were published under "Final standing when the
        // board closed".
        $this->creator();
        $this->creator();
        $this->creator();

        $this->get('/leaderboard/monthly')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('past_winners', []));
    }

    public function test_a_creator_with_nothing_live_gets_no_buy_route(): void
    {
        $this->creator();

        $this->get('/leaderboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('data.0.content', null));
    }

    public function test_a_creator_selling_a_wish_gets_a_route_to_the_wishlist(): void
    {
        $creator = $this->creator();

        WishItem::factory()->create([
            'user_id' => $creator->id,
            'is_approved' => 1,
            'is_suspended' => 0,
        ]);

        $this->get('/leaderboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('data.0.content.page', 'wishes')
                ->where('data.0.content.label', 'Wishlist')
            );
    }

    public function test_a_wish_held_by_moderation_is_not_a_buy_route(): void
    {
        // The button must never land on a tab that renders empty.
        $creator = $this->creator();

        WishItem::factory()->create([
            'user_id' => $creator->id,
            'is_approved' => 0,
            'is_suspended' => 0,
        ]);

        $this->get('/leaderboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('data.0.content', null));
    }

    public function test_leaving_the_public_board_invalidates_the_past_winners_cache_immediately(): void
    {
        // 🚨 That panel names a creator on a public page and is cached for six
        // hours under keys that cannot be enumerated. Forgetting the board alone
        // left an opted-out creator crowned for the rest of the window.
        $before = (int) Cache::get(LeaderBoardController::PAST_WINNERS_GENERATION_KEY, 1);

        $this->actingAs($this->creator())
            ->postJson(route('leaderboard.opt-out'), ['opt_out' => true])
            ->assertOk();

        $this->assertSame(
            $before + 1,
            (int) Cache::get(LeaderBoardController::PAST_WINNERS_GENERATION_KEY, 1),
        );
    }

    public function test_a_signed_out_visitor_has_no_supporter_standing(): void
    {
        $this->creator();

        $this->get('/leaderboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('you_supporter', null));
    }

    public function test_the_supporter_standing_is_resolved_from_the_whole_ranking_not_the_top_five(): void
    {
        // A supporter at position seven is a supporter this page would otherwise
        // never mention.
        $viewer = User::factory()->create(['role' => 0]);

        $ranked = [];
        foreach (range(1, 6) as $i) {
            $ranked[] = ['id' => 9000 + $i, 'username' => 'top'.$i, 'gift_count' => 20 - $i];
        }
        $ranked[] = ['id' => $viewer->id, 'username' => $viewer->username, 'gift_count' => 3];

        Cache::put(LeaderBoardController::SUPPORTER_STANDINGS_KEY, $ranked, 900);

        $this->actingAs($viewer)
            ->get('/leaderboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('you_supporter.rank', 7)
                ->where('you_supporter.total', 7)
                ->where('you_supporter.purchases', 3)
                // The gap is stated in PURCHASES. No amount reaches this bar.
                ->where('you_supporter.next.purchases_gap', 11)
            );
    }

    public function test_a_cold_standings_cache_costs_the_bar_rather_than_a_second_full_scan(): void
    {
        Cache::forget(LeaderBoardController::SUPPORTER_STANDINGS_KEY);

        $this->actingAs(User::factory()->create(['role' => 0]))
            ->get('/leaderboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('you_supporter', null));
    }

    public function test_the_movement_window_matches_the_arrows_the_page_draws(): void
    {
        $creator = $this->creator();
        $today = Carbon::now()->startOfDay();

        LeaderboardSnapshot::create([
            'user_id' => $creator->id,
            'period' => 'all',
            'rank' => 9,
            'score' => 5,
            'supporters' => 2,
            'captured_on' => $today->copy()->subDays(40)->toDateString(),
        ]);

        $this->get('/leaderboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('data.0.direction', 'up'));
    }
}
