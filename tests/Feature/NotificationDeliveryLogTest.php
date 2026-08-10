<?php

namespace Tests\Feature;

use App\Listeners\LogOutboundMail;
use App\Models\NotificationLog;
use App\Models\StripePaymentDetail;
use App\Models\User;
use App\Support\NotificationContext;
use App\Support\NotificationRecorder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
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

    /**
     * A transport that throws never reaches MessageSent, so the row would sit at
     * `queued` until the prune command settled it an hour later — an hour in
     * which a receipt nobody received reads as "still on its way".
     *
     * Driven end to end through a transport that refuses, so this exercises the
     * real wiring: the sending hook writes the row, the send throws, the job
     * dies, and the job-failure listener settles it.
     */
    public function test_a_failed_send_inside_a_job_is_recorded_as_failed_immediately(): void
    {
        $this->useFailingMailTransport();

        $user = User::factory()->create(['email' => 'boom@example.test']);

        try {
            dispatch(function () use ($user) {
                Mail::raw('Receipt', function ($message) use ($user) {
                    $message->to($user->email)->subject('Receipt that will not send');
                });
            });
        } catch (\Throwable $e) {
            // The sync driver rethrows after raising JobExceptionOccurred, which
            // is the listener that settles the row.
        }

        $log = NotificationLog::where('subject', 'Receipt that will not send')->first();

        $this->assertNotNull($log, 'The sending hook never wrote a row.');
        $this->assertSame(
            NotificationLog::STATUS_FAILED,
            $log->status,
            'A send that threw was left looking like it was still on its way.',
        );
        $this->assertStringContainsString('SMTP refused', (string) $log->reason);
        $this->assertNull($log->sent_at, 'A failed message must not carry a sent timestamp.');
    }

    /** Point the mailer at a transport that always throws. */
    private function useFailingMailTransport(): void
    {
        $this->app['mail.manager']->extend('spenny-failing', function () {
            return new class extends AbstractTransport
            {
                protected function doSend(SentMessage $message): void
                {
                    throw new \RuntimeException('SMTP refused');
                }

                public function __toString(): string
                {
                    return 'spenny-failing://';
                }
            };
        });

        config([
            'mail.mailers.spenny-failing' => ['transport' => 'spenny-failing'],
            'mail.default' => 'spenny-failing',
        ]);
    }

    /** A confirmed send must not be re-settled as failed by a later job failure. */
    public function test_settling_never_downgrades_a_message_already_sent(): void
    {
        $row = NotificationLog::record([
            'channel' => NotificationLog::CHANNEL_EMAIL,
            'status' => NotificationLog::STATUS_SENT,
            'recipient_email' => 'ok@example.test',
            'sent_at' => now(),
        ]);

        $reflection = new \ReflectionClass(LogOutboundMail::class);
        $pending = $reflection->getProperty('pending');
        $pending->setAccessible(true);
        $pending->setValue(null, [$row->id => true]);

        LogOutboundMail::settlePending('unrelated later failure');

        $this->assertSame(NotificationLog::STATUS_SENT, $row->fresh()->status);
    }

    /**
     * What the message said, so an admin can answer "what did we send them?"
     * without asking the recipient to forward it.
     */
    public function test_the_message_body_is_stored_as_a_plain_text_preview(): void
    {
        Mail::html('<p>Hello Jane</p><p>Your download is ready.</p>', function ($message) {
            $message->to('reader@example.test')->subject('Your download');
        });

        $log = NotificationLog::first();

        $this->assertStringContainsString('Hello Jane', $log->body_preview);
        $this->assertStringContainsString('Your download is ready.', $log->body_preview);
        $this->assertStringNotContainsString('<p>', $log->body_preview, 'HTML was stored verbatim.');
    }

    /**
     * 🚨 Regression: alert/receipt templates are heavily-indented, multi-line
     * Blade markup (nested divs/spans/tables), and stripping tags naively left
     * every block on its own line surrounded by BLANK lines padded with the
     * original indentation whitespace — "LOCAL", then a large gap, then "Fraud
     * digest", then another gap — because a bare `\n{3,}` collapse only matches
     * literal newlines in a row, not newline-space-newline. Found live on the
     * admin Notification Logs screen.
     */
    public function test_heavily_indented_html_does_not_fragment_into_isolated_lines(): void
    {
        Mail::html(
            "<div>\n".
            "        <span style=\"padding:4px\">LOCAL</span>\n".
            "    </div>\n".
            "\n".
            "    <h1>\n".
            "        Fraud digest\n".
            "    </h1>\n".
            "\n".
            "    <p>\n".
            "        An unanswered dispute is lost automatically at its evidence deadline.\n".
            "    </p>\n",
            function ($message) {
                $message->to('reader@example.test')->subject('Fraud digest');
            }
        );

        $preview = NotificationLog::first()->body_preview;

        $this->assertStringNotContainsString("\n\n\n", $preview, 'Blank-line runs were not collapsed.');
        $this->assertMatchesRegularExpression(
            '/LOCAL\s*\n\s*Fraud digest/',
            $preview,
            'Adjacent short blocks should be at most one blank line apart, not several.',
        );
        $this->assertStringContainsString(
            'An unanswered dispute is lost automatically at its evidence deadline.',
            $preview,
        );
    }

    /** A long body is truncated — the log is a record, not a mail archive. */
    public function test_a_long_body_is_truncated(): void
    {
        config(['notification_logs.body_limit' => 200]);

        Mail::raw(str_repeat('word ', 500), function ($message) {
            $message->to('reader@example.test')->subject('Long one');
        });

        $preview = NotificationLog::first()->body_preview;

        $this->assertLessThan(400, mb_strlen($preview));
        $this->assertStringContainsString('truncated', $preview);
    }

    /**
     * ⚠️ Campaign bodies are identical for every recipient and already stored
     * once on the campaign row, so repeating one across tens of thousands of log
     * rows is waste. Off by default.
     */
    public function test_a_campaign_body_is_not_repeated_on_every_recipient(): void
    {
        NotificationContext::for(['campaign_id' => 3]);

        Mail::raw('This month on Spenny Piggy', function ($message) {
            $message->to('subscriber@example.test')->subject('Newsletter');
        });

        $log = NotificationLog::first();

        $this->assertNotNull($log, 'The campaign send was not logged at all.');
        $this->assertNull($log->body_preview);
        $this->assertSame('Newsletter', $log->subject, 'The subject is still recorded.');
    }

    /** The whole body capture can be switched off without affecting sending. */
    public function test_body_capture_can_be_switched_off(): void
    {
        config(['notification_logs.store_body' => false]);

        Mail::raw('Secret contents', function ($message) {
            $message->to('reader@example.test')->subject('Quiet');
        });

        $log = NotificationLog::first();

        $this->assertNotNull($log);
        $this->assertNull($log->body_preview);
    }

    /**
     * 🚨 When the claim column does not exist the two callers must NOT behave
     * the same way. Failing open for both sends the buyer two receipts; failing
     * closed for both sends none. The fallback restores the pre-claim split:
     * the redirect handler sends, the webhook stands down.
     */
    public function test_the_claim_falls_back_to_the_pre_claim_split_when_unsupported(): void
    {
        $payment = StripePaymentDetail::create([
            'session_id' => 'cs_claim_fallback',
            'owner_id' => User::factory()->create()->id,
            'currency' => 'gbp',
        ]);

        // Force the "column missing" branch without touching the schema.
        $reflection = new \ReflectionClass(StripePaymentDetail::class);
        $supported = $reflection->getProperty('receiptClaimSupported');
        $supported->setAccessible(true);
        $supported->setValue(null, false);

        try {
            $this->assertTrue(
                StripePaymentDetail::claimReceipt($payment->id, failOpen: true),
                'The redirect handler must still send — that was its behaviour before the claim existed.',
            );
            $this->assertFalse(
                StripePaymentDetail::claimReceipt($payment->id, failOpen: false),
                'The webhook must stand down, or the buyer receives the receipt twice.',
            );
        } finally {
            $supported->setValue(null, null);
        }
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
