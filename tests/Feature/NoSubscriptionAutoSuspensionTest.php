<?php

namespace Tests\Feature;

use App\Console\Commands\ReleaseSubscriptionSuspensions;
use App\Models\Logs;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

/**
 * An unpaid platform subscription is not a reason to suspend an account
 * (client direction, 14 Sep 2026). `app:auto-suspend-account` is deleted.
 *
 * 🚨 WHY A GUARD AT ALL. Selling was never what that command stopped — every
 * checkout already refuses a creator whose `subscription_status` is 0 or 3,
 * in `CreatorSubscriptionService::validateCreatorSubscription`, at all eleven
 * gates. What the suspension added was hiding the profile, pausing the
 * supporters' subscriptions, cancelling the outgoing ones and freezing
 * payouts. That last one withholds money the creator earned while their
 * subscription WAS live, over a bill raised afterwards — which is the fault
 * that made this change necessary, and it is invisible from every screen:
 * the creator reads "suspended", the payout run simply never lists them.
 *
 * Re-adding a daily sweep that writes the flag is a small, plausible-looking
 * commit. This is what says no to it.
 */
class NoSubscriptionAutoSuspensionTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 1,
        ], $attributes));
    }

    public function test_the_auto_suspend_command_no_longer_exists(): void
    {
        $this->assertArrayNotHasKey(
            'app:auto-suspend-account',
            Artisan::all(),
            'app:auto-suspend-account is registered again. An unpaid subscription must not suspend an account — '
                .'the checkout gates already stop the creator selling, and suspension additionally freezes payouts '
                .'on money they earned while the subscription was live.'
        );
    }

    public function test_nothing_schedules_an_automatic_subscription_suspension(): void
    {
        $kernel = file_get_contents(app_path('Console/Kernel.php'));

        // Comments blanked first: the note explaining the removal names the
        // command it is warning against.
        $kernel = preg_replace('#/\*.*?\*/#s', '', $kernel);
        $kernel = preg_replace('#//[^\n]*#', '', (string) $kernel);

        $this->assertStringNotContainsString(
            'auto-suspend',
            (string) $kernel,
            'Console\Kernel schedules an auto-suspend command again. See the note in that file.'
        );
    }

    public function test_it_releases_a_creator_the_deleted_rule_suspended(): void
    {
        $creator = $this->creator();
        Logs::create([
            'suspended_user_id' => $creator->id,
            'message' => ReleaseSubscriptionSuspensions::LOG_MARKER.' Suspended automatically — platform subscription is not active.',
        ]);

        $this->artisan('subscription:release-auto-suspended', ['--apply' => true]);

        $this->assertSame(0, (int) $creator->fresh()->suspended_account);
    }

    /**
     * 🚨 The marker is the ONLY thing separating the cron's suspensions from a
     * person's, and without this the release becomes "un-suspend everyone" —
     * putting accounts an admin deliberately removed back on the platform.
     */
    public function test_it_never_releases_a_creator_a_person_suspended(): void
    {
        $creator = $this->creator();
        Logs::create([
            'suspended_user_id' => $creator->id,
            'message' => 'Jack suspended this account for repeated policy breaches.',
        ]);

        $this->artisan('subscription:release-auto-suspended', ['--apply' => true]);

        $this->assertSame(1, (int) $creator->fresh()->suspended_account);
    }

    /**
     * The cron took an account, an admin later released and re-suspended it by
     * hand. The newest entry is the person's, so the account is theirs — a
     * scan for "carries the marker anywhere" would hand it back.
     */
    public function test_a_later_human_suspension_wins_over_an_earlier_marker(): void
    {
        $creator = $this->creator();
        Logs::create([
            'suspended_user_id' => $creator->id,
            'message' => ReleaseSubscriptionSuspensions::LOG_MARKER.' Suspended automatically.',
            'created_at' => now()->subDays(10),
        ]);
        Logs::create([
            'suspended_user_id' => $creator->id,
            'message' => 'Jack suspended this account after a manual review.',
            'created_at' => now()->subDay(),
        ]);

        $this->artisan('subscription:release-auto-suspended', ['--apply' => true]);

        $this->assertSame(1, (int) $creator->fresh()->suspended_account);
    }

    /**
     * The reverse, and the case Jack Legit is actually in: four older rows
     * recording an admin *removing* a suspension, then the cron's marker on
     * top. The cron is why the account is suspended today.
     */
    public function test_an_earlier_human_release_does_not_block_a_later_marker(): void
    {
        $creator = $this->creator();
        Logs::create([
            'suspended_user_id' => $creator->id,
            'message' => 'Jack remove the suspension from this account.',
            'created_at' => now()->subDays(30),
        ]);
        Logs::create([
            'suspended_user_id' => $creator->id,
            'message' => ReleaseSubscriptionSuspensions::LOG_MARKER.' Suspended automatically.',
            'created_at' => now()->subDay(),
        ]);

        $this->artisan('subscription:release-auto-suspended', ['--apply' => true]);

        $this->assertSame(0, (int) $creator->fresh()->suspended_account);
    }

    /**
     * ⚠️ The cron wrote no log for part of its life, so a suspended account
     * with no trace at all cannot be attributed either way. Releasing one
     * would be guessing, and the costly direction to guess in.
     */
    public function test_a_suspension_with_no_log_is_left_alone(): void
    {
        $creator = $this->creator();

        $this->artisan('subscription:release-auto-suspended', ['--apply' => true]);

        $this->assertSame(1, (int) $creator->fresh()->suspended_account);
    }

    public function test_a_dry_run_writes_nothing(): void
    {
        $creator = $this->creator();
        Logs::create([
            'suspended_user_id' => $creator->id,
            'message' => ReleaseSubscriptionSuspensions::LOG_MARKER.' Suspended automatically.',
        ]);

        $this->artisan('subscription:release-auto-suspended');

        $this->assertSame(1, (int) $creator->fresh()->suspended_account);
    }

    /**
     * 🚨 `suspension:enforce` sweeps `suspended_account = 0 AND
     * suspension_enforced_at IS NOT NULL` and is what actually resumes the
     * supporters' subscriptions and releases the payout hold. Clearing that
     * marker here leaves every paused subscription paused with nothing left
     * to notice.
     */
    public function test_the_enforcement_marker_survives_so_the_sweep_can_undo_the_consequences(): void
    {
        $creator = $this->creator();
        $creator->forceFill(['suspension_enforced_at' => now()->subDay()])->save();
        Logs::create([
            'suspended_user_id' => $creator->id,
            'message' => ReleaseSubscriptionSuspensions::LOG_MARKER.' Suspended automatically.',
        ]);

        $this->artisan('subscription:release-auto-suspended', ['--apply' => true]);

        $fresh = $creator->fresh();
        $this->assertSame(0, (int) $fresh->suspended_account);
        $this->assertNotNull($fresh->suspension_enforced_at);
    }

    /**
     * ⚠️ `updated_at` keys the public profile cache and ORDERS the admin
     * creator-review queue, so a backfill over every affected account would
     * reshuffle that queue in one command.
     */
    public function test_releasing_does_not_re_date_the_profile(): void
    {
        $creator = $this->creator();
        $before = $creator->fresh()->updated_at;
        Logs::create([
            'suspended_user_id' => $creator->id,
            'message' => ReleaseSubscriptionSuspensions::LOG_MARKER.' Suspended automatically.',
        ]);

        $this->artisan('subscription:release-auto-suspended', ['--apply' => true]);

        $this->assertEquals($before, $creator->fresh()->updated_at);
    }
}
