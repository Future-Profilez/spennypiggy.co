<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\SocialLinks;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Restoring creators stranded at `profile_status_lock = 1` by a routine edit.
 *
 * 🚨 The mistake this command must never make is putting an unreviewed profile
 * back into Discover, so every test here is about who is LEFT ALONE. Restoring
 * one creator too few costs a support ticket; restoring one too many publishes a
 * profile nobody approved.
 */
class RestoreWronglyDemotedProfilesTest extends TestCase
{
    use RefreshDatabase;

    /** A creator demoted by an edit whose assets have all since been cleared. */
    private function stranded(array $overrides = []): User
    {
        $user = User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
            'profile_status_lock' => 1,
            'avatar' => 'avatar-uuid',
            'avatar_approved' => 1,
            'cover' => 'cover-uuid',
            'cover_approved' => 1,
            'bio' => 'Underwater photography from the Andamans.',
            'bio_approved' => 1,
        ], $overrides))->refresh();

        $this->approvedBefore($user);

        return $user;
    }

    /** The proof that an admin once approved this profile. */
    private function approvedBefore(User $user, int $lock = 2): void
    {
        AuditLog::create([
            'action_type' => 'USER_PROFILE_REVIEWED',
            'reference_id' => (string) $user->uuid,
            'actor' => 'admin:1',
            'new_values' => ['profile_status_lock' => $lock],
            'created_at' => now()->subDays(30),
        ]);
    }

    private function restore(array $options = []): void
    {
        $this->artisan('profile:restore-wrongly-demoted', $options);
    }

    public function test_it_restores_a_creator_whose_assets_are_all_settled(): void
    {
        $user = $this->stranded();

        $this->restore(['--apply' => true]);

        $this->assertSame(2, (int) $user->refresh()->profile_status_lock);
    }

    public function test_a_dry_run_writes_nothing(): void
    {
        $user = $this->stranded();

        $this->restore();

        $this->assertSame(1, (int) $user->refresh()->profile_status_lock);
    }

    public function test_a_creator_with_work_still_waiting_is_left_alone(): void
    {
        // `lock = 1` is exactly right for them — an admin genuinely has to decide.
        $user = $this->stranded(['bio_approved' => 0]);

        $this->restore(['--apply' => true]);

        $this->assertSame(1, (int) $user->refresh()->profile_status_lock);
    }

    public function test_a_creator_with_pending_handles_is_left_alone(): void
    {
        $user = $this->stranded();
        SocialLinks::create([
            'user_id' => $user->id,
            // NOT NULL with no default, and the model has no creating hook —
            // SocialLinksController always passes one explicitly.
            'uuid' => '99999999-9999-4999-8999-999999999999',
            'instagram' => 'someone',
            'status' => 0,
        ]);

        $this->restore(['--apply' => true]);

        $this->assertSame(1, (int) $user->refresh()->profile_status_lock);
    }

    public function test_a_creator_who_was_told_something_is_left_alone(): void
    {
        // A reason means a human wrote words to this creator, so a human decided.
        $user = $this->stranded(['profile_reject_reason' => 'Please use a clearer photo.']);

        $this->restore(['--apply' => true]);

        $this->assertSame(1, (int) $user->refresh()->profile_status_lock);
    }

    public function test_a_bio_edit_reason_also_counts_as_a_human_decision(): void
    {
        $user = $this->stranded(['edit_bio_reason' => 'Drop the phone number.']);

        $this->restore(['--apply' => true]);

        $this->assertSame(1, (int) $user->refresh()->profile_status_lock);
    }

    /** 🚨 The one that matters most. */
    public function test_a_creator_never_approved_is_never_restored(): void
    {
        $user = User::factory()->create([
            'role' => 1,
            'suspended_account' => 0,
            'profile_status_lock' => 1,
            'avatar' => 'avatar-uuid',
            'avatar_approved' => 1,
            'bio' => 'A first bio.',
            'bio_approved' => 1,
        ]);

        // No audit row: "was at 2 once" cannot be inferred from the current row.
        $this->restore(['--apply' => true]);

        $this->assertSame(1, (int) $user->refresh()->profile_status_lock);
    }

    public function test_the_most_recent_decision_wins(): void
    {
        $user = $this->stranded();

        // Approved thirty days ago, rejected since. Restoring would overrule a person.
        AuditLog::create([
            'action_type' => 'USER_PROFILE_REVIEWED',
            'reference_id' => (string) $user->uuid,
            'actor' => 'admin:1',
            'new_values' => ['profile_status_lock' => 0],
            'created_at' => now()->subDay(),
        ]);

        $this->restore(['--apply' => true]);

        $this->assertSame(1, (int) $user->refresh()->profile_status_lock);
    }

    public function test_a_suspended_creator_is_never_restored(): void
    {
        $user = $this->stranded(['suspended_account' => 1]);

        $this->restore(['--apply' => true]);

        $this->assertSame(1, (int) $user->refresh()->profile_status_lock);
    }

    public function test_max_caps_the_creators_restored(): void
    {
        $first = $this->stranded();
        $second = $this->stranded();

        $this->restore(['--apply' => true, '--max' => 1]);

        $restored = collect([$first, $second])
            ->filter(fn (User $u) => (int) $u->refresh()->profile_status_lock === 2)
            ->count();

        $this->assertSame(1, $restored);
    }

    public function test_it_can_target_one_creator(): void
    {
        $wanted = $this->stranded();
        $other = $this->stranded();

        $this->restore(['--apply' => true, '--user' => $wanted->username]);

        $this->assertSame(2, (int) $wanted->refresh()->profile_status_lock);
        $this->assertSame(1, (int) $other->refresh()->profile_status_lock);
    }
}
