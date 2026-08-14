<?php

namespace Tests\Feature;

use App\Mail\CommandFailed;
use App\Models\Currency;
use App\Models\FinancialTransaction;
use App\Models\Payment;
use App\Models\PayoutRun;
use App\Models\PlatformRiskState;
use App\Models\RiskSetting;
use App\Models\TipGoalsPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * `payout:run-weekly --dry-run` exists so the eligible set can be inspected on a
 * live environment WITHOUT moving money. The two properties that matter: it must
 * pay nobody, and a run that finds nobody must stop being silent.
 */
class WeeklyPayoutDryRunTest extends TestCase
{
    use RefreshDatabase;

    private User $creator;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();

        Currency::updateOrCreate(
            ['ISO' => 'GBP'],
            ['name' => 'Pound Sterling', 'conversion_rate' => 1, 'ISOdigits' => 2, 'symbol' => '£']
        );

        $this->creator = User::factory()->create([
            'default_currency' => 'GBP',
            'account_id' => 'acct_test_dryrun',
        ]);

        RiskSetting::updateOrCreate(['key' => 'risk_thresholds'], ['value' => [
            'high_dispute_rate' => 0.01, 'medium_dispute_rate' => 0.005,
            'high_refund_rate' => 0.05, 'min_tx_count' => 10,
        ]]);
        RiskSetting::updateOrCreate(['key' => 'risk_consequences'], ['value' => [
            'high_reserve_percent' => 25, 'high_payout_delay' => 14,
            'medium_reserve_percent' => 10, 'medium_payout_delay' => 7,
            'low_reserve_percent' => 0, 'low_payout_delay' => 7,
        ]]);
        RiskSetting::updateOrCreate(['key' => 'creator_rules'], ['value' => [
            'new_creator_age_days' => 30, 'new_creator_daily_cap' => 50000,
        ]]);

        PlatformRiskState::create(['state' => 'NORMAL', 'set_by' => 'system', 'started_at' => now()]);
    }

    private function seedEligiblePayment(): void
    {
        $sessionId = 'cs_test_'.Str::random(12);

        $tipGoalId = DB::table('tip_goals')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'name' => 'Test Goal',
            'user_id' => $this->creator->id,
            'target' => 100.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Payment::create([
            'creator_id' => $this->creator->uuid,
            'amount' => 1500,
            'reserve_amount_minor' => 150,
            'currency' => 'gbp',
            'stripe_session_id' => $sessionId,
            'stripe_payment_intent_id' => 'pi_test_'.Str::random(12),
            'status' => 'succeeded',
        ]);

        // Only payable once past the 7-day hold.
        Payment::where('stripe_session_id', $sessionId)->update(['created_at' => now()->subDays(10)]);

        $tip = TipGoalsPayment::create([
            'tip_goal_id' => $tipGoalId,
            'user_id' => null,
            'session_id' => $sessionId,
            'currency' => 'GBP',
            'amount' => 15.00,
            'tax' => 3.00,
            'status' => 'paid',
        ]);

        FinancialTransaction::create([
            'user_id' => $this->creator->id,
            'source_type' => TipGoalsPayment::class,
            'source_id' => $tip->id,
            'type' => 'income',
            'gross_amount' => 18.00,
            'platform_fee' => 3.00,
            'stripe_fee' => 0,
            'vat_amount' => 0,
            'net_amount' => 15.00,
            'reserve_amount' => 1.50,
            'reserve_status' => 'held',
            'currency' => 'GBP',
            'status' => 'completed',
            'description' => 'Tip',
            'transaction_date' => now(),
        ]);
    }

    /**
     * The whole point: it must be safe to run this on production on any day.
     * No PayoutRun row, so nothing was ever handed to Stripe.
     */
    public function test_dry_run_reports_the_eligible_creator_and_pays_nobody(): void
    {
        $this->seedEligiblePayment();

        $this->artisan('payout:run-weekly --dry-run')
            ->expectsOutputToContain('DRY RUN')
            ->expectsOutputToContain('Found 1 eligible creators')
            ->assertExitCode(0);

        $this->assertSame(0, PayoutRun::count(), 'A dry run must never create a payout run.');
        Mail::assertNothingSent();
    }

    /**
     * A dry run pays nobody, so the Friday gate would only block the one thing
     * that is safe on any day: looking.
     */
    public function test_dry_run_does_not_require_friday_or_force(): void
    {
        $this->travelTo(now()->next('Wednesday'));

        $this->artisan('payout:run-weekly --dry-run')
            ->doesntExpectOutputToContain('Today is not Friday')
            ->assertExitCode(0);
    }

    public function test_a_real_run_still_refuses_to_execute_on_a_non_friday(): void
    {
        $this->travelTo(now()->next('Wednesday'));

        $this->artisan('payout:run-weekly')
            ->expectsOutputToContain('Today is not Friday')
            ->assertExitCode(0);

        $this->assertSame(0, PayoutRun::count());
    }

    /**
     * The bug this closes: a run with nobody eligible returned in silence — no
     * row, no log, no email — which is indistinguishable from the scheduler
     * never firing.
     */
    public function test_an_empty_run_reports_why_nobody_was_paid_and_emails_ops(): void
    {
        config()->set('services.payout_notifications.weekly_job_email', 'ops@example.test');

        $this->artisan('payout:run-weekly --force')
            ->expectsOutputToContain('No payouts to process.')
            ->expectsOutputToContain('Nothing is waiting to be paid')
            ->assertExitCode(0);

        Mail::assertSent(CommandFailed::class, function (CommandFailed $mail) {
            return str_contains($mail->emailSubject, 'NOTHING TO PAY');
        });
    }

    /**
     * Money is still inside the 7-day hold — the single most common reason a
     * Friday run pays nobody, and the one that reads as "the job didn't run".
     */
    public function test_an_empty_run_names_the_seven_day_hold(): void
    {
        Payment::create([
            'creator_id' => $this->creator->uuid,
            'amount' => 1500,
            'currency' => 'gbp',
            'stripe_session_id' => 'cs_test_'.Str::random(12),
            'status' => 'succeeded',
        ]);

        $this->artisan('payout:run-weekly --dry-run')
            ->expectsOutputToContain('still inside the 7-day hold')
            ->assertExitCode(0);
    }

    /**
     * A dry run must not page ops — it touched nothing, so there is no incident.
     */
    public function test_dry_run_never_emails_on_an_empty_result(): void
    {
        config()->set('services.payout_notifications.weekly_job_email', 'ops@example.test');

        $this->artisan('payout:run-weekly --dry-run')->assertExitCode(0);

        Mail::assertNothingSent();
    }
}
