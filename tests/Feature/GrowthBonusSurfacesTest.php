<?php

namespace Tests\Feature;

use App\Models\GrowthBonusProfile;
use App\Models\GrowthBonusReward;
use App\Models\User;
use App\Services\PromoBannerService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Where a creator and a visitor actually MEET the Growth Bonus — the public
 * page, the landing-page callout and the profile promo deck.
 *
 * 🚨 THE FLAG IS THE POINT OF MOST OF THESE. Everything here ships dark, and a
 * surface that advertises the scheme while `/growth-bonus` 404s is worse than no
 * surface: it is a button into nothing on the page a creator was sent to. Each
 * entry point is asserted OFF as well as on.
 */
class GrowthBonusSurfacesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'growth_bonus.enabled' => true,
            'growth_bonus.launch_cutoff' => '2026-08-26',
        ]);
    }

    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'default_currency' => 'GBP',
            'stripe_connected_at' => Carbon::parse('2026-09-01 10:00:00'),
            'stripe_details_submitted' => 1,
            'account_id' => 'acct_'.uniqid(),
        ], $overrides));
    }

    // ── The public page ──────────────────────────────────────────────────

    public function test_the_page_404s_while_the_scheme_is_dark(): void
    {
        config(['growth_bonus.enabled' => false]);

        $this->get('/growth-bonus')->assertNotFound();
    }

    public function test_a_logged_out_visitor_can_read_the_ladder(): void
    {
        $response = $this->get('/growth-bonus');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('GrowthBonus/Index')
            ->where('progress', null)
            ->where('programme.max_total', fn ($v) => (float) $v === 1000.0)
            ->where('programme.activation_gmv', fn ($v) => (float) $v === 100.0)
            ->has('programme.ladder', 11));
    }

    public function test_the_ladder_carries_a_running_total_matching_the_brief(): void
    {
        $response = $this->get('/growth-bonus');

        $ladder = $response->viewData('page')['props']['programme']['ladder'];

        // The brief's cumulative column, rung for rung.
        $this->assertSame(
            [25.0, 50.0, 100.0, 150.0, 225.0, 300.0, 400.0, 500.0, 650.0, 800.0, 1000.0],
            array_map(fn ($r) => (float) $r['cumulative'], $ladder),
        );
    }

    public function test_a_creator_sees_their_own_position(): void
    {
        $creator = $this->creator();
        $profile = GrowthBonusProfile::create([
            'creator_id' => $creator->id,
            'status' => GrowthBonusProfile::STATUS_ACTIVE,
            'activation_deadline' => Carbon::parse('2026-10-01'),
            'activated_at' => Carbon::parse('2026-09-05'),
            'seat_claimed_at' => Carbon::parse('2026-09-05'),
            'expires_at' => Carbon::parse('2027-09-05'),
            'qualifying_gmv' => 300,
            'current_milestone' => 250,
        ]);

        GrowthBonusReward::create([
            'profile_id' => $profile->id,
            'creator_id' => $creator->id,
            'milestone_gmv' => 100,
            'amount' => 25,
            'status' => GrowthBonusReward::STATUS_PAID,
        ]);

        $response = $this->actingAs($creator)->get('/growth-bonus');

        $response->assertInertia(fn ($page) => $page
            ->where('progress.status', 'active')
            ->where('progress.qualifying_gmv', fn ($v) => (float) $v === 300.0)
            ->where('progress.earned_total', fn ($v) => (float) $v === 25.0)
            ->where('progress.paid_total', fn ($v) => (float) $v === 25.0)
            // Next rung is £500, so £200 to go.
            ->where('progress.next_milestone', fn ($v) => (float) $v === 500.0)
            ->where('progress.remaining_to_next', fn ($v) => (float) $v === 200.0));
    }

    public function test_a_reversed_reward_is_not_counted_as_earned(): void
    {
        $creator = $this->creator();
        $profile = GrowthBonusProfile::create([
            'creator_id' => $creator->id,
            'status' => GrowthBonusProfile::STATUS_ACTIVE,
            'activation_deadline' => Carbon::parse('2026-10-01'),
            'qualifying_gmv' => 120,
        ]);

        GrowthBonusReward::create([
            'profile_id' => $profile->id,
            'creator_id' => $creator->id,
            'milestone_gmv' => 100,
            'amount' => 25,
            'status' => GrowthBonusReward::STATUS_REVERSED,
        ]);

        $this->actingAs($creator)->get('/growth-bonus')
            ->assertInertia(fn ($page) => $page->where('progress.earned_total', fn ($v) => (float) $v === 0.0));
    }

    // ── The landing page callout ─────────────────────────────────────────

    public function test_the_landing_page_carries_no_growth_prop_while_dark(): void
    {
        config(['growth_bonus.enabled' => false]);

        $this->get('/')->assertInertia(fn ($page) => $page->where('growthBonus', null));
    }

    public function test_the_landing_page_callout_reads_the_real_ladder(): void
    {
        $this->get('/')->assertInertia(fn ($page) => $page
            ->where('growthBonus.maxTotal', fn ($v) => (float) $v === 1000.0)
            ->where('growthBonus.firstReward', fn ($v) => (float) $v === 25.0)
            ->where('growthBonus.activationGmv', fn ($v) => (float) $v === 100.0)
            ->where('growthBonus.maxSeats', 150)
            ->where('growthBonus.seatsRemaining', 150));
    }

    public function test_the_landing_page_seat_count_falls_as_places_are_taken(): void
    {
        $creator = $this->creator();
        GrowthBonusProfile::create([
            'creator_id' => $creator->id,
            'status' => GrowthBonusProfile::STATUS_ACTIVE,
            'activation_deadline' => Carbon::parse('2026-10-01'),
            'seat_claimed_at' => now(),
        ]);

        $this->get('/')->assertInertia(fn ($page) => $page->where('growthBonus.seatsRemaining', 149));
    }

    // ── The profile promo deck ───────────────────────────────────────────

    private function deckKeys(?User $user): array
    {
        $deck = app(PromoBannerService::class)->for($user, ['is_creator' => $user && (int) $user->role === 1]);

        return array_column($deck['banners'], 'key');
    }

    public function test_the_promo_card_is_absent_while_the_scheme_is_dark(): void
    {
        config(['growth_bonus.enabled' => false]);

        $this->assertNotContains('growth_bonus', $this->deckKeys($this->creator()));
    }

    public function test_an_eligible_creator_is_shown_the_promo_card(): void
    {
        $this->assertContains('growth_bonus', $this->deckKeys($this->creator()));
    }

    public function test_a_creator_who_connected_before_the_cutoff_is_not_shown_it(): void
    {
        $creator = $this->creator(['stripe_connected_at' => Carbon::parse('2026-08-01')]);

        $this->assertNotContains('growth_bonus', $this->deckKeys($creator));
    }

    public function test_the_card_closes_once_the_creator_has_missed(): void
    {
        $creator = $this->creator();
        GrowthBonusProfile::create([
            'creator_id' => $creator->id,
            'status' => GrowthBonusProfile::STATUS_MISSED,
            'missed_reason' => 'earnings_below_threshold',
            'activation_deadline' => Carbon::parse('2026-10-01'),
        ]);

        $this->assertNotContains('growth_bonus', $this->deckKeys($creator));
    }

    public function test_an_active_creator_still_sees_it(): void
    {
        $creator = $this->creator();
        GrowthBonusProfile::create([
            'creator_id' => $creator->id,
            'status' => GrowthBonusProfile::STATUS_ACTIVE,
            'activation_deadline' => Carbon::parse('2026-10-01'),
            'seat_claimed_at' => now(),
        ]);

        $this->assertContains('growth_bonus', $this->deckKeys($creator));
    }

    public function test_a_gifter_is_never_shown_the_card(): void
    {
        $gifter = User::factory()->create(['role' => 0]);

        $this->assertNotContains('growth_bonus', $this->deckKeys($gifter));
    }

    /**
     * ⚠️ Numeric props are asserted through a closure, not a literal: Inertia's
     * assertion compares against the JSON-DECODED payload and a whole float
     * (1000.0) comes back as an int, so a strict `where()` fails for a reason
     * that has nothing to do with the value being wrong.
     *
     * 🚨 The card's figures come from the ladder that pays, never from the JSX —
     * the house rule the £6.99/£8.99 subscription card was fixed for.
     */
    public function test_the_card_figures_come_from_the_config(): void
    {
        config(['growth_bonus.ladder' => [
            ['gmv' => 200.00, 'amount' => 40.00],
            ['gmv' => 900.00, 'amount' => 60.00],
        ]]);

        $deck = app(PromoBannerService::class)->for($this->creator(), ['is_creator' => true]);
        $card = collect($deck['banners'])->firstWhere('key', 'growth_bonus');

        $this->assertSame('£200', $card['facts']['spend']);
        $this->assertSame('£40', $card['facts']['reward']);
        $this->assertSame('£100', $card['facts']['total']);
        $this->assertSame('2', $card['facts']['steps']);
    }

    public function test_the_card_points_at_a_route_that_resolves(): void
    {
        $deck = app(PromoBannerService::class)->for($this->creator(), ['is_creator' => true]);
        $card = collect($deck['banners'])->firstWhere('key', 'growth_bonus');

        $this->assertNotNull($card['href']);
        $this->get($card['href'])->assertOk();
    }
}
