<?php

namespace Tests\Feature;

use App\Models\NotificationLog;
use App\Models\StripePaymentDetail;
use App\Models\User;
use App\Support\NotificationContext;
use App\Support\NotificationRecorder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class NotificationDeliveryLogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        NotificationContext::clear();
        config(['notification_logs.enabled' => true]);
    }

    protected function tearDown(): void
    {
        NotificationContext::clear();
        parent::tearDown();
    }

    /** Every email is recorded, whatever sent it — that is the whole point of hooking the mailer. */
    public function test_an_email_is_recorded_without_the_sender_doing_anything(): void
    {
        $user = User::factory()->create(['email' => 'buyer@example.test']);

        Mail::raw('Your purchase is ready', function ($message) use ($user) {
            $message->to($user->email)->subject('Your purchase');
        });

        $log = NotificationLog::where('channel', NotificationLog::CHANNEL_EMAIL)->first();

        $this->assertNotNull($log, 'The mailer event did not produce a delivery log row.');
        $this->assertSame('buyer@example.test', $log->recipient_email);
        $this->assertSame($user->id, $log->recipient_user_id);
        $this->assertSame('Your purchase', $log->subject);
        $this->assertSame(NotificationLog::STATUS_SENT, $log->status);
        $this->assertNotNull($log->sent_at);
    }

    /**
     * The context is what makes a receipt answerable as "for THIS purchase".
     * Without it the row exists but names no payment.
     */
    public function test_the_open_context_labels_the_message_with_its_payment(): void
    {
        $buyer = User::factory()->create(['email' => 'buyer@example.test']);
        $creator = User::factory()->create();

        NotificationContext::for([
            'context_type' => 'wish',
            'context_id' => '42',
            'stripe_session_id' => 'cs_test_123',
            'buyer_id' => $buyer->id,
            'creator_id' => $creator->id,
        ]);

        Mail::raw('Receipt', function ($message) use ($buyer) {
            $message->to($buyer->email)->subject('Receipt');
        });

        $log = NotificationLog::first();

        $this->assertSame('cs_test_123', $log->stripe_session_id);
        $this->assertSame('wish', $log->context_type);
        $this->assertSame('42', $log->context_id);
        $this->assertSame(NotificationLog::ROLE_BUYER, $log->role);
    }

    /** The creator's own mail on the same payment must be filed as the creator's. */
    public function test_the_creator_is_recorded_as_the_creator_not_the_buyer(): void
    {
        $buyer = User::factory()->create(['email' => 'buyer@example.test']);
        $creator = User::factory()->create(['email' => 'creator@example.test']);

        NotificationContext::for([
            'stripe_session_id' => 'cs_test_456',
            'buyer_id' => $buyer->id,
            'creator_id' => $creator->id,
        ]);

        Mail::raw('You got paid', function ($message) use ($creator) {
            $message->to($creator->email)->subject('You got paid');
        });

        $this->assertSame(
            NotificationLog::ROLE_CREATOR,
            NotificationLog::first()->role,
        );
    }

    /** A guest buyer has no account, and their receipt still has to be recorded. */
    public function test_a_guest_buyer_is_recorded_by_email_alone(): void
    {
        NotificationContext::for([
            'stripe_session_id' => 'cs_guest_1',
            'buyer_email' => 'guest@example.test',
        ]);

        Mail::raw('Receipt', function ($message) {
            $message->to('guest@example.test')->subject('Receipt');
        });

        $log = NotificationLog::first();

        $this->assertNull($log->recipient_user_id);
        $this->assertSame('guest@example.test', $log->recipient_email);
        $this->assertSame(NotificationLog::ROLE_BUYER, $log->role);
    }

    /**
     * A refusal is not a send and not a failure. Recording it as `sent` would be
     * the log telling support somebody was emailed when they were not.
     */
    public function test_a_consent_refusal_is_recorded_as_skipped_never_sent(): void
    {
        $user = User::factory()->create(['email' => 'quiet@example.test']);

        NotificationRecorder::push(
            'Title',
            'Body',
            $user->email,
            NotificationLog::STATUS_SKIPPED,
            'Push turned off by the recipient',
            $user->id,
        );

        $log = NotificationLog::first();

        $this->assertSame(NotificationLog::STATUS_SKIPPED, $log->status);
        $this->assertNull($log->sent_at, 'A skipped message must not carry a sent timestamp.');
        $this->assertStringContainsString('turned off', $log->reason);
    }

    /** The claim is what stops the redirect handler and the webhook both sending. */
    public function test_only_one_caller_can_claim_a_purchase_receipt(): void
    {
        $payment = StripePaymentDetail::create([
            'session_id' => 'cs_claim_1',
            'owner_id' => User::factory()->create()->id,
            'currency' => 'gbp',
        ]);

        $this->assertTrue(StripePaymentDetail::claimReceipt($payment->id));
        $this->assertFalse(
            StripePaymentDetail::claimReceipt($payment->id),
            'A second caller claimed the same receipt — both would have emailed the buyer.',
        );
    }

    /**
     * A failed dispatch must hand the claim back, or nobody ever sends that
     * receipt — the exact silence this work exists to remove.
     */
    public function test_releasing_a_claim_lets_the_next_attempt_send(): void
    {
        $payment = StripePaymentDetail::create([
            'session_id' => 'cs_claim_2',
            'owner_id' => User::factory()->create()->id,
            'currency' => 'gbp',
        ]);

        $this->assertTrue(StripePaymentDetail::claimReceipt($payment->id));
        StripePaymentDetail::releaseReceiptClaim($payment->id);
        $this->assertTrue(StripePaymentDetail::claimReceipt($payment->id));
    }

    /** Logging must never be why a message fails to go out. */
    public function test_a_send_still_happens_when_logging_is_switched_off(): void
    {
        config(['notification_logs.enabled' => false]);

        $user = User::factory()->create(['email' => 'nolog@example.test']);

        Mail::raw('Hello', function ($message) use ($user) {
            $message->to($user->email)->subject('Hello');
        });

        $this->assertSame(0, NotificationLog::count());
    }

    /** The context must not leak from one job into the next one a worker picks up. */
    public function test_clearing_the_context_removes_every_field(): void
    {
        NotificationContext::for(['stripe_session_id' => 'cs_leak', 'buyer_id' => 7]);
        $this->assertFalse(NotificationContext::isEmpty());

        NotificationContext::clear();

        $this->assertTrue(NotificationContext::isEmpty());
        $this->assertNull(NotificationContext::logColumns()['stripe_session_id']);
    }

    /**
     * 🚨 The load-bearing mechanism. Receipts are mailed from inside queued jobs
     * dispatched several hops from the webhook, so if the context did not travel
     * with the job every one of those messages would be logged against no
     * payment at all — and the admin screen could not answer the only question
     * it exists for.
     */
    public function test_the_payment_context_travels_with_a_queued_job(): void
    {
        $buyer = User::factory()->create(['email' => 'queued@example.test']);

        NotificationContext::for([
            'stripe_session_id' => 'cs_queued_1',
            'context_type' => 'wish',
            'buyer_id' => $buyer->id,
        ]);

        // The sync driver runs the job through the same dispatch/payload path a
        // real worker uses, so the snapshot has to survive it.
        dispatch(function () use ($buyer) {
            Mail::raw('Receipt', function ($message) use ($buyer) {
                $message->to($buyer->email)->subject('Receipt from a job');
            });
        });

        $log = NotificationLog::where('subject', 'Receipt from a job')->first();

        $this->assertNotNull($log);
        $this->assertSame(
            'cs_queued_1',
            $log->stripe_session_id,
            'The context did not reach the job — every queued receipt would be unattributable.',
        );
        $this->assertSame(NotificationLog::ROLE_BUYER, $log->role);
    }

    /** A scoped context restores what was open before it, including nothing. */
    public function test_a_scoped_context_is_restored_afterwards(): void
    {
        NotificationContext::for(['stripe_session_id' => 'cs_outer']);

        NotificationContext::scoped(['stripe_session_id' => 'cs_inner'], function () {
            $this->assertSame('cs_inner', NotificationContext::current()['stripe_session_id']);
        });

        $this->assertSame('cs_outer', NotificationContext::current()['stripe_session_id']);
    }
}
