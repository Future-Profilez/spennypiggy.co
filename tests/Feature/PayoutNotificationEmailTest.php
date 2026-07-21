<?php

namespace Tests\Feature;

use App\Mail\PayoutCompleted;
use App\Mail\PayoutInitiated;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Standard weekly payouts previously only pushed a notification when the money
 * was sent, and said nothing at all about whether it arrived. These cover the
 * emails that close that gap.
 *
 * Payout mail is transactional: a creator cannot opt out of being told their
 * money moved, so none of it checks marketing consent.
 */
class PayoutNotificationEmailTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        return User::factory()->create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Jamie Rivers',
            'account_id' => 'acct_test_123',
        ]);
    }

    public function test_initiated_email_renders_amount_date_and_reference(): void
    {
        $mailable = new PayoutInitiated(
            creator: $this->creator(),
            amount: 1234.50,
            currency: 'gbp',
            sentAt: '20 Jul 2026',
            destination: 'Connected account acct_test_123',
            reference: 'po_test_abc',
        );

        $mailable->assertSeeInHtml('1,234.50');
        $mailable->assertSeeInHtml('GBP');
        $mailable->assertSeeInHtml('20 Jul 2026');
        $mailable->assertSeeInHtml('po_test_abc');
        $mailable->assertHasSubject('Your payout is on the way');
    }

    public function test_initiated_email_renders_without_optional_details(): void
    {
        $mailable = new PayoutInitiated(
            creator: $this->creator(),
            amount: 10.00,
            currency: 'usd',
            sentAt: '20 Jul 2026',
        );

        $mailable->assertSeeInHtml('USD');
        $mailable->assertSeeInHtml('10.00');
    }

    public function test_completed_email_reads_as_success_when_paid(): void
    {
        $mailable = new PayoutCompleted(
            creator: $this->creator(),
            amount: 500.00,
            currency: 'GBP',
            status: 'paid',
            arrivalDate: '22 Jul 2026',
            reference: 'po_test_abc',
        );

        $mailable->assertHasSubject('Your payout has arrived');
        $mailable->assertSeeInHtml('22 Jul 2026');
        $mailable->assertSeeInHtml('500.00');
    }

    public function test_failed_email_explains_the_retry_and_shows_the_reason(): void
    {
        $mailable = new PayoutCompleted(
            creator: $this->creator(),
            amount: 500.00,
            currency: 'GBP',
            status: 'failed',
            failureMessage: 'Account closed',
        );

        $mailable->assertHasSubject('There was a problem with your payout');
        $mailable->assertSeeInHtml('Account closed');
        // The creator must be told it retries automatically, so they don't panic
        // or open a support ticket for something the system already handles.
        $mailable->assertSeeInHtml('retried in the next payout run');
    }
}
