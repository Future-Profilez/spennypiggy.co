<?php

namespace Tests\Feature;

use App\Mail\ProfileApprovalStatusMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ReleasePendingCreatorsTest extends TestCase
{
    use RefreshDatabase;

    public function test_dry_run_does_not_modify_database(): void
    {
        Mail::fake();

        $creator = User::factory()->create([
            'role' => 1,
            'profile_status_lock' => 0,
            'profile_reject_reason' => null,
            'suspended_account' => 0,
        ]);

        $this->artisan('creators:release-pending', ['--user' => $creator->id])
            ->assertExitCode(0);

        $creator->refresh();
        $this->assertSame(0, (int) $creator->profile_status_lock);
        Mail::assertNothingQueued();
    }

    public function test_apply_releases_tier1_creator_and_queues_email(): void
    {
        Mail::fake();

        $creator = User::factory()->create([
            'role' => 1,
            'profile_status_lock' => 0,
            'profile_reject_reason' => null,
            'suspended_account' => 0,
        ]);

        $this->artisan('creators:release-pending', [
            '--apply' => true,
            '--user' => $creator->id,
        ])->assertExitCode(0);

        $creator->refresh();
        $this->assertSame(2, (int) $creator->profile_status_lock);
        $this->assertNull($creator->profile_reject_reason);

        Mail::assertQueued(ProfileApprovalStatusMail::class, function ($mail) {
            return $mail->status === true;
        });
    }

    public function test_suspended_creators_tier3_are_never_released(): void
    {
        Mail::fake();

        $suspended = User::factory()->create([
            'role' => 1,
            'profile_status_lock' => 0,
            'suspended_account' => 1,
        ]);

        $this->artisan('creators:release-pending', [
            '--apply' => true,
            '--user' => $suspended->id,
        ])->assertExitCode(0);

        $suspended->refresh();
        $this->assertSame(0, (int) $suspended->profile_status_lock);
        $this->assertSame(1, (int) $suspended->suspended_account);
        Mail::assertNothingQueued();
    }

    public function test_tier2_creator_is_held_without_include_tier2_flag(): void
    {
        Mail::fake();

        $tier2 = User::factory()->create([
            'role' => 1,
            'profile_status_lock' => 0,
            'profile_reject_reason' => 'Not a legitimate creator based on policy review',
            'suspended_account' => 0,
        ]);

        $this->artisan('creators:release-pending', [
            '--apply' => true,
            '--user' => $tier2->id,
        ])->assertExitCode(0);

        $tier2->refresh();
        $this->assertSame(0, (int) $tier2->profile_status_lock);
        Mail::assertNothingQueued();

        // Now run with --include-tier2
        $this->artisan('creators:release-pending', [
            '--apply' => true,
            '--include-tier2' => true,
            '--user' => $tier2->id,
        ])->assertExitCode(0);

        $tier2->refresh();
        $this->assertSame(2, (int) $tier2->profile_status_lock);
        $this->assertNull($tier2->profile_reject_reason);
        Mail::assertQueued(ProfileApprovalStatusMail::class);
    }
}
