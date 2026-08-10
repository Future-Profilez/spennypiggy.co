<?php

namespace Tests\Feature;

use App\Mail\SendSuspendedMailForSubscription;
use App\Models\MonthlyCharge;
use App\Models\User;
use App\Support\SubscriptionPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * app:auto-suspend-account locks a creator out of their own account, and nothing
 * un-suspends them automatically — so a false positive is permanent until an
 * admin intervenes. The old rule ("no monthly_charges row with status = 'paid'")
 * suspended every creator in their free period once billing moved to first sale.
 */
class AutoSuspendAccountTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $attributes = []): User
    {
        return User::factory()->create(array_merge(['role' => 1, 'suspended_account' => 0], $attributes));
    }

    private function charge(User $creator, array $attributes = []): MonthlyCharge
    {
        return MonthlyCharge::create(array_merge([
            'user_id' => $creator->id,
            'email' => $creator->email,
            'currency' => 'GBP',
            'amount' => SubscriptionPlan::price(),
            'tax' => SubscriptionPlan::vat(),
            'status' => 'trialing',
        ], $attributes));
    }

    private function runSuspend(array $options = []): void
    {
        $this->artisan('app:auto-suspend-account', $options);
    }

    /** The regression: a card saved, no sale yet, therefore never charged. */
    public function test_a_creator_in_their_free_period_is_not_suspended(): void
    {
        Mail::fake();
        $creator = $this->creator();
        $this->charge($creator, ['stripe_payment_method' => 'pm_test', 'status' => 'trialing']);

        $this->runSuspend();

        $this->assertSame(0, (int) $creator->fresh()->suspended_account);
        Mail::assertNothingSent();
    }

    /** Setup-mode writes no trial dates at all — that must still read as a free period. */
    public function test_a_free_period_row_with_no_trial_dates_is_not_suspended(): void
    {
        $creator = $this->creator();
        $this->charge($creator, [
            'status' => 'trialing',
            'current_start_trial_date' => null,
            'current_end_trial_date' => null,
        ]);

        $this->runSuspend();

        $this->assertSame(0, (int) $creator->fresh()->suspended_account);
    }

    /** An abandoned checkout owes nothing — the connect and checkout gates already stop them. */
    public function test_an_abandoned_checkout_is_not_suspended(): void
    {
        $creator = $this->creator();
        $this->charge($creator, ['status' => 'initiated']);

        $this->runSuspend();

        $this->assertSame(0, (int) $creator->fresh()->suspended_account);
    }

    public function test_a_creator_whose_billed_subscription_lapsed_is_suspended(): void
    {
        Mail::fake();
        $creator = $this->creator();
        $this->charge($creator, [
            'status' => 'expired',
            'current_start_subscription_date' => now()->subMonths(2),
            'current_end_subscription_date' => now()->subMonth(),
        ]);

        $this->runSuspend();

        $this->assertSame(1, (int) $creator->fresh()->suspended_account);
        Mail::assertSent(SendSuspendedMailForSubscription::class);
    }

    public function test_a_failed_card_is_suspended(): void
    {
        $creator = $this->creator();
        $this->charge($creator, [
            'status' => 'failed',
            'current_start_subscription_date' => now()->subMonths(2),
            'current_end_subscription_date' => now()->subMonth(),
        ]);

        $this->runSuspend();

        $this->assertSame(1, (int) $creator->fresh()->suspended_account);
    }

    public function test_an_actively_billing_creator_is_not_suspended(): void
    {
        $creator = $this->creator();
        $this->charge($creator, [
            'status' => 'paid',
            'current_start_subscription_date' => now()->subDays(5),
            'current_end_subscription_date' => now()->addDays(25),
        ]);

        $this->runSuspend();

        $this->assertSame(0, (int) $creator->fresh()->suspended_account);
    }

    public function test_a_fan_is_never_touched(): void
    {
        $fan = User::factory()->create(['role' => 0, 'suspended_account' => 0]);
        $this->charge($fan, ['status' => 'expired', 'current_start_subscription_date' => now()->subMonths(2)]);

        $this->runSuspend();

        $this->assertSame(0, (int) $fan->fresh()->suspended_account);
    }

    public function test_dry_run_writes_nothing(): void
    {
        Mail::fake();
        $creator = $this->creator();
        $this->charge($creator, [
            'status' => 'expired',
            'current_start_subscription_date' => now()->subMonths(2),
            'current_end_subscription_date' => now()->subMonth(),
        ]);

        $this->runSuspend(['--dry-run' => true]);

        $this->assertSame(0, (int) $creator->fresh()->suspended_account);
        Mail::assertNothingSent();
    }

    public function test_restore_command_only_frees_a_free_period_creator(): void
    {
        $wronglySuspended = $this->creator(['suspended_account' => 1]);
        $this->charge($wronglySuspended, ['status' => 'trialing']);

        $lapsed = $this->creator(['suspended_account' => 1]);
        $this->charge($lapsed, [
            'status' => 'expired',
            'current_start_subscription_date' => now()->subMonths(2),
            'current_end_subscription_date' => now()->subMonth(),
        ]);

        $this->artisan('subscription:restore-wrongly-suspended', ['--apply' => true]);

        $this->assertSame(0, (int) $wronglySuspended->fresh()->suspended_account);
        $this->assertSame(1, (int) $lapsed->fresh()->suspended_account);
    }

    public function test_restore_command_is_a_dry_run_by_default(): void
    {
        $creator = $this->creator(['suspended_account' => 1]);
        $this->charge($creator, ['status' => 'trialing']);

        $this->artisan('subscription:restore-wrongly-suspended');

        $this->assertSame(1, (int) $creator->fresh()->suspended_account);
    }
}
