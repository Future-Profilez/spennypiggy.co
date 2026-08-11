<?php

namespace Tests\Feature;

use App\Mail\PayoutInitiated;
use App\Models\EngagementNotification;
use App\Models\PayoutRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Repair command for payouts executed from the admin panel, which runs the admin
 * app's own PayoutService — a copy that pushes a notification and sends no email.
 *
 * The property that matters most is that it cannot double-mail: it is run by hand,
 * usually more than once, against money that has already moved.
 */
class SendPayoutInitiatedMailsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function creator(array $attrs = []): User
    {
        return User::factory()->create(array_merge([
            'default_currency' => 'GBP',
            'account_id' => 'acct_test_123',
        ], $attrs));
    }

    private function record(User $creator, array $attrs = []): PayoutRecord
    {
        return PayoutRecord::create(array_merge([
            'creator_id' => $creator->uuid,
            'amount_minor' => 1500,
            'currency' => 'gbp',
            'status' => 'in_transit',
            'stripe_payout_id' => 'po_test_'.uniqid(),
            'arrival_date' => now()->addDays(3),
        ], $attrs));
    }

    public function test_it_emails_the_creator_for_todays_payout(): void
    {
        $creator = $this->creator();
        $this->record($creator);

        $this->artisan('payout:send-initiated-mails')
            ->expectsOutputToContain('Sent: 1')
            ->assertExitCode(0);

        Mail::assertSent(PayoutInitiated::class, function (PayoutInitiated $mail) use ($creator) {
            return $mail->hasTo($creator->email)
                && $mail->amount === 15.00
                && $mail->currency === 'GBP'
                && $mail->arrivalDate !== null;
        });
    }

    /**
     * The whole point. It is run by hand against money that already moved, so a
     * second run must be a no-op — not a second email telling a creator they are
     * being paid twice.
     */
    public function test_running_it_twice_sends_only_one_email(): void
    {
        $creator = $this->creator();
        $this->record($creator);

        $this->artisan('payout:send-initiated-mails')->assertExitCode(0);
        $this->artisan('payout:send-initiated-mails')
            ->expectsOutputToContain('Sent: 0')
            ->assertExitCode(0);

        Mail::assertSent(PayoutInitiated::class, 1);
    }

    public function test_dry_run_sends_nothing_and_claims_nothing(): void
    {
        $creator = $this->creator();
        $this->record($creator);

        $this->artisan('payout:send-initiated-mails --dry-run')
            ->expectsOutputToContain('DRY RUN')
            ->assertExitCode(0);

        Mail::assertNothingSent();
        $this->assertSame(0, EngagementNotification::count(), 'A dry run must not burn the claim.');
    }

    /**
     * "Your payout is on the way" is false for a payout that failed or was
     * cancelled, and it is the kind of false that generates a support ticket.
     */
    public function test_it_never_emails_for_a_failed_or_cancelled_payout(): void
    {
        $creator = $this->creator();
        $this->record($creator, ['status' => 'failed']);
        $this->record($creator, ['status' => 'canceled']);

        $this->artisan('payout:send-initiated-mails')->assertExitCode(0);

        Mail::assertNothingSent();
    }

    /**
     * A bonus payout has its own email. Sending the standard one on top tells the
     * creator about the same money twice.
     */
    public function test_it_skips_bonus_payouts(): void
    {
        $creator = $this->creator();
        $this->record($creator, ['metadata' => ['bonus_type' => 'founder_qualification']]);

        $this->artisan('payout:send-initiated-mails')
            ->expectsOutputToContain('Sent: 0')
            ->assertExitCode(0);

        Mail::assertNothingSent();
    }

    public function test_it_only_covers_the_requested_date(): void
    {
        $creator = $this->creator();
        $old = $this->record($creator);
        $old->forceFill(['created_at' => now()->subDays(4)])->saveQuietly();

        $this->artisan('payout:send-initiated-mails')->assertExitCode(0);
        Mail::assertNothingSent();

        $this->artisan('payout:send-initiated-mails --date='.now()->subDays(4)->toDateString())
            ->assertExitCode(0);
        Mail::assertSent(PayoutInitiated::class, 1);
    }

    /**
     * Two payouts to one creator in a day means they were genuinely paid twice,
     * so they are told twice — the claim is per payout record, not per creator.
     */
    public function test_two_payouts_in_one_day_produce_two_emails(): void
    {
        $creator = $this->creator();
        $this->record($creator);
        $this->record($creator, ['amount_minor' => 2500]);

        $this->artisan('payout:send-initiated-mails')
            ->expectsOutputToContain('Sent: 2')
            ->assertExitCode(0);

        Mail::assertSent(PayoutInitiated::class, 2);
    }

    /**
     * A failed send must release its claim, or one transient SMTP blip means this
     * creator is never told about their payout by any later run.
     */
    public function test_a_failed_send_releases_the_claim_so_a_rerun_retries(): void
    {
        $creator = $this->creator();
        $this->record($creator);

        Mail::shouldReceive('to')->once()->andThrow(new \RuntimeException('smtp down'));

        $this->artisan('payout:send-initiated-mails')
            ->expectsOutputToContain('Failed: 1')
            ->assertExitCode(1);

        $this->assertSame(0, EngagementNotification::count(), 'The claim must not survive a failed send.');
    }

    public function test_max_caps_the_emails_sent(): void
    {
        $creator = $this->creator();
        $this->record($creator);
        $this->record($creator, ['amount_minor' => 2500]);

        $this->artisan('payout:send-initiated-mails --max=1')
            ->expectsOutputToContain('Sent: 1')
            ->assertExitCode(0);

        Mail::assertSent(PayoutInitiated::class, 1);
    }
}
