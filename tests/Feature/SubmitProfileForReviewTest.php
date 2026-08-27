<?php

namespace Tests\Feature;

use App\Models\MonthlyCharge;
use App\Models\SocialLinks;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The gate on "Submit for review".
 *
 * 🚨 The first test is the bug this file was written for: the check read
 * `$user->socialLinks`, which is not a relation, so it resolved to NULL and
 * EVERY creator was refused for a missing social handle while their handle
 * rendered on the page behind the error. A guard that cannot fail on its own
 * case certifies what it missed.
 */
class SubmitProfileForReviewTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $attributes = [], bool $withCard = true): User
    {
        $user = User::factory()->create(array_merge([
            'role' => 1,
            'avatar' => 'https://ucarecdn.com/avatar/',
            'bio' => 'I am a musician',
            'profile_status_lock' => 0,
        ], $attributes));

        // `subscription_status` is an ACCESSOR over MonthlyCharge, not a column —
        // "card added" is a live subscription period, which is what the journey
        // card reads too.
        if ($withCard) {
            MonthlyCharge::create([
                'user_id' => $user->id,
                'status' => 'paid',
                'current_start_subscription_date' => now()->subDay(),
                'current_end_subscription_date' => now()->addMonth(),
            ]);
        }

        return $user->fresh();
    }

    private function handles(User $user, array $columns): void
    {
        SocialLinks::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'status' => 0,
        ], $columns));
    }

    public function test_a_complete_creator_can_submit_for_review(): void
    {
        $user = $this->creator();

        $this->handles($user, ['instagram' => 'ben_lewis']);

        $this->actingAs($user)
            ->get('/update-profile-lock-status')
            ->assertSessionHas('success');

        $this->assertSame(1, (int) $user->fresh()->profile_status_lock);
    }

    /**
     * A handle on a platform that is no longer accepted for NEW submissions is
     * still a handle — the creator was verified on it and it is on their profile.
     */
    public function test_a_legacy_platform_handle_counts_as_a_social_handle(): void
    {
        $user = $this->creator();

        $this->handles($user, ['facebook' => 'ben.lewis']);

        $this->actingAs($user)
            ->get('/update-profile-lock-status')
            ->assertSessionHas('success');
    }

    public function test_a_creator_with_no_handle_at_all_is_refused(): void
    {
        $user = $this->creator();

        $this->handles($user, []);

        $this->actingAs($user)->get('/update-profile-lock-status');

        $this->assertSame(0, (int) $user->fresh()->profile_status_lock);
        $this->assertStringContainsString('a social handle', session('error'));
    }

    public function test_the_other_three_requirements_still_block(): void
    {
        $user = $this->creator(['avatar' => null, 'bio' => null], withCard: false);

        $this->handles($user, ['instagram' => 'ben_lewis']);

        $this->actingAs($user)->get('/update-profile-lock-status');

        $error = session('error');
        $this->assertStringContainsString('a profile photo', $error);
        $this->assertStringContainsString('a bio', $error);
        $this->assertStringContainsString('a payment card', $error);
        $this->assertStringNotContainsString('a social handle', $error);
    }

    /**
     * The Creator Studio path, end to end.
     *
     * 🚨 This is the flow the fix has to keep working: a creator who adds nothing
     * at signup and types their handle inside the app afterwards. It saves the
     * CANONICAL URL (the form's own output), where the signup form saves a bare
     * handle — one column, two shapes — so a check that only understood one of
     * them would refuse exactly one of the two ways a handle can arrive.
     */
    public function test_a_handle_added_inside_creator_studio_unlocks_submit(): void
    {
        $user = $this->creator();

        $this->actingAs($user)
            ->postJson('/save_social_links', [
                'instagram' => 'https://instagram.com/ben_lewis',
                'twitter' => null,
                'tiktok' => null,
            ])
            ->assertOk();

        // Saved as a normal submission, waiting for review — not auto-approved.
        $this->assertDatabaseHas('social_links', [
            'user_id' => $user->id,
            'instagram' => 'https://instagram.com/ben_lewis',
            'status' => 0,
        ]);

        $this->actingAs($user)
            ->get('/update-profile-lock-status')
            ->assertSessionHas('success');

        $this->assertSame(1, (int) $user->fresh()->profile_status_lock);
    }

    /**
     * ⚠️ An UNAPPROVED handle still unlocks submit — that is the point of the
     * step. Requiring approval first would deadlock the creator: nobody reviews
     * a profile that was never submitted.
     */
    public function test_submit_does_not_wait_for_the_handle_to_be_approved(): void
    {
        $user = $this->creator();
        $this->handles($user, ['tiktok' => 'ben_lewis']);

        $this->actingAs($user)
            ->get('/update-profile-lock-status')
            ->assertSessionHas('success');
    }
}
