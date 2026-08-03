<?php

namespace Tests\Feature;

use App\Models\PiggyPot;
use App\Models\User;
use App\Services\PiggyPotStatusService;
use App\Services\UserProfileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * A pot whose deadline has passed must leave the public profile.
 *
 * Before this, nothing flipped `status` to `expired` and the profile query
 * filtered on status alone — so a PINNED pot whose date lapsed months earlier
 * still occupied the creator's featured slot AND silenced the fallback, sending
 * every visitor who clicked it to "this content is no longer available". Six
 * such pots were live when this shipped, three of them pinned.
 */
class PiggyPotExpiryTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        return User::factory()->create(['role' => 1]);
    }

    private function pot(User $creator, array $attributes = []): PiggyPot
    {
        return PiggyPot::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'title' => 'Studio content',
            'description' => 'Behind the scenes',
            'target_amount' => 500,
            'currency' => 'gbp',
            'status' => 'active',
        ], $attributes));
    }

    /** The deadline includes its own day — a pot dated today is still open. */
    public function test_deadline_is_inclusive_of_its_own_day(): void
    {
        $this->assertFalse(PiggyPotStatusService::deadlinePassed(now()->startOfDay()));
        $this->assertFalse(PiggyPotStatusService::deadlinePassed(null));
        $this->assertTrue(PiggyPotStatusService::deadlinePassed(now()->subDay()));
    }

    public function test_expired_pot_is_hidden_from_the_public_profile(): void
    {
        $creator = $this->creator();
        $this->pot($creator, ['deadline' => now()->subWeek()]);

        $pots = app(UserProfileService::class)
            ->getOptimizedPiggyPots($creator->id, false, false);

        $this->assertSame([], $pots);
    }

    /**
     * The regression that started this: a pinned pot past its date used to win
     * the featured slot and stop the fallback from running, so the creator's
     * profile showed a dead pot while a live one sat behind it.
     */
    public function test_a_lapsed_pinned_pot_does_not_hold_the_featured_slot(): void
    {
        $creator = $this->creator();
        $this->pot($creator, ['title' => 'Lapsed', 'is_pinned' => true, 'deadline' => now()->subMonth()]);
        $live = $this->pot($creator, ['title' => 'Live now']);

        $pots = app(UserProfileService::class)
            ->getOptimizedPiggyPots($creator->id, false, true);

        $this->assertCount(1, $pots);
        $this->assertSame($live->id, $pots[0]['id']);
    }

    /** The creator keeps seeing their own closed pots — that is where they fix them. */
    public function test_owner_still_sees_a_lapsed_pot(): void
    {
        $creator = $this->creator();
        $this->pot($creator, ['status' => 'expired', 'deadline' => now()->subWeek()]);

        $pots = app(UserProfileService::class)
            ->getOptimizedPiggyPots($creator->id, true, false);

        $this->assertCount(1, $pots);
    }

    public function test_a_completed_pot_is_not_advertised(): void
    {
        $creator = $this->creator();
        $this->pot($creator, ['status' => 'completed']);

        $this->assertSame([], app(UserProfileService::class)
            ->getOptimizedPiggyPots($creator->id, false, false));
    }

    public function test_visibility_names_the_reason_and_the_fix(): void
    {
        $creator = $this->creator();

        $lapsed = PiggyPotStatusService::visibility(
            $this->pot($creator, ['deadline' => now()->subWeek()])
        );
        $this->assertFalse($lapsed['visible']);
        $this->assertSame('deadline_passed', $lapsed['code']);
        $this->assertNotNull($lapsed['fix']);

        $held = PiggyPotStatusService::visibility(
            $this->pot($creator, ['status' => 'moderation_hold'])
        );
        $this->assertSame('moderation_hold', $held['code']);
        // Nothing for the creator to do while an admin reviews it.
        $this->assertNull($held['fix']);
    }

    /** Another pot holding the slot is a different problem from a lapsed date. */
    public function test_a_pot_that_is_simply_not_featured_says_so(): void
    {
        $creator = $this->creator();
        $featured = $this->pot($creator, ['is_pinned' => true]);
        $other = $this->pot($creator);

        $result = PiggyPotStatusService::visibility($other, $featured->id);

        $this->assertSame('not_featured', $result['code']);
        $this->assertTrue(PiggyPotStatusService::visibility($featured, $featured->id)['visible']);
    }

    public function test_the_sweep_closes_lapsed_pots_and_leaves_live_ones_alone(): void
    {
        $creator = $this->creator();
        $lapsed = $this->pot($creator, ['deadline' => now()->subDay()]);
        $live = $this->pot($creator, ['deadline' => now()->addWeek()]);
        $undated = $this->pot($creator);

        $this->artisan('piggy-pots:expire')->assertSuccessful();

        $this->assertSame('expired', $lapsed->fresh()->status);
        $this->assertSame('active', $live->fresh()->status);
        $this->assertSame('active', $undated->fresh()->status);
    }

    public function test_dry_run_changes_nothing(): void
    {
        $creator = $this->creator();
        $lapsed = $this->pot($creator, ['deadline' => now()->subDay()]);

        $this->artisan('piggy-pots:expire --dry-run')->assertSuccessful();

        $this->assertSame('active', $lapsed->fresh()->status);
    }

    /**
     * The fix the dashboard tells the creator to make has to work: the edit form
     * legitimately posts `status = expired` (that IS the pot's status), so
     * without the reopen rule a new deadline left the pot hidden with no clue why.
     */
    public function test_a_new_deadline_reopens_a_closed_pot(): void
    {
        $creator = $this->creator();
        $pot = $this->pot($creator, ['status' => 'expired', 'deadline' => now()->subWeek()]);

        $response = $this->actingAs($creator)
            ->post(route('piggy-pots.update', $pot->id), [
                'title' => $pot->title,
                'description' => $pot->description,
                'target_amount' => 500,
                'currency' => 'gbp',
                'status' => 'expired',
                'deadline' => now()->addWeek()->toDateString(),
                'reward_title' => 'Studio content',
                'reward_type' => 'message',
                'reward_body' => 'Thanks for buying.',
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame('active', $pot->fresh()->status);
    }

    /** A reached goal is not undone by moving a date. */
    public function test_a_new_deadline_does_not_reopen_a_completed_pot(): void
    {
        $creator = $this->creator();
        $pot = $this->pot($creator, ['status' => 'completed']);

        $this->actingAs($creator)
            ->post(route('piggy-pots.update', $pot->id), [
                'title' => $pot->title,
                'target_amount' => 500,
                'currency' => 'gbp',
                'status' => 'completed',
                'deadline' => now()->addWeek()->toDateString(),
                'reward_title' => 'Studio content',
                'reward_type' => 'message',
                'reward_body' => 'Thanks for buying.',
            ]);

        $this->assertSame('completed', $pot->fresh()->status);
    }
}
