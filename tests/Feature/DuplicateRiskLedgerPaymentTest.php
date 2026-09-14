<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * A PaymentIntent must be matched to the checkout row it already has, never
 * given a second one.
 *
 * 🚨 THE FAULT THIS PINS. Every checkout controller writes its risk-ledger
 * Payment row with `'stripe_payment_intent_id' => $sessionCreate->payment_intent
 * ?? null` — and Stripe attaches no PaymentIntent to a Checkout Session until
 * the customer starts paying, so that value is ALWAYS null at the moment the row
 * is written. The row is keyed by SESSION id alone until
 * `checkout.session.completed` stamps the intent on.
 *
 * Stripe gives no ordering guarantee between that event and
 * `payment_intent.succeeded`. When the intent event won,
 * `handlePaymentIntentSucceeded` looked the row up by intent id, missed it, fell
 * through to an AMOUNT match — which cannot succeed here, because the checkout
 * row stores the creator's LISTED price while that branch computes gross minus
 * fees — and created a SECOND Payment row for the same intent.
 *
 * The duplicate carries no session id, so
 * `PayoutService::getAllFinancialTransactionsForPayment()` can never reach a
 * source model through it and values it at £0. It is therefore never paid,
 * `payout_run_id` stays null for ever, and every later payout run counts it as
 * an unpaid payment. Measured on production 14 Sep 2026: six such rows against
 * one creator, every penny of whose real money had already been paid out.
 *
 * ⚠️ THIS IS A SOURCE SCAN, AND DELIBERATELY SO. Reaching the branch needs a
 * live Stripe Checkout Session lookup on a connected account. What has to be
 * pinned is not the Stripe call but the ORDER: that the session match is
 * attempted before the code that creates a row. A new contributor "simplifying"
 * the two `if (! $payment)` blocks back into one restores the bug exactly, and
 * no route test would ever see it.
 */
class DuplicateRiskLedgerPaymentTest extends TestCase
{
    private const CONTROLLER = 'app/Http/Controllers/StripeWebhookController.php';

    private function source(): string
    {
        $path = base_path(self::CONTROLLER);

        $this->assertFileExists($path, self::CONTROLLER.' has moved; this guard needs its new path.');

        return (string) file_get_contents($path);
    }

    public function test_the_session_match_helper_still_exists(): void
    {
        $this->assertStringContainsString(
            'private function linkIntentToCheckoutPayment(',
            $this->source(),
            'linkIntentToCheckoutPayment() is what matches a PaymentIntent to the checkout row it '
                .'already has. Without it a racing payment_intent.succeeded writes a second, '
                .'permanently unpayable Payment row for the same intent.'
        );
    }

    public function test_the_helper_keys_on_the_checkout_session_not_the_amount(): void
    {
        $source = $this->source();

        $this->assertStringContainsString(
            'checkout->sessions->all(',
            $source,
            'The intent must be resolved to its Checkout Session. An amount match cannot work here: '
                .'the checkout row stores the listed price and this side computes gross minus fees.'
        );

        $this->assertStringContainsString(
            "Payment::where('stripe_session_id', \$sessionId)",
            $source,
            'The checkout row is keyed by session id until checkout.session.completed lands, so that '
                .'is what the lookup must use.'
        );
    }

    public function test_the_session_match_is_attempted_before_a_row_is_ever_created(): void
    {
        $source = $this->source();

        $matchAt = strpos($source, '$this->linkIntentToCheckoutPayment(');
        $createAt = strpos($source, "Log::info('Risk Ledger: Auto-created missing Payment record'");

        $this->assertNotFalse(
            $matchAt,
            'handlePaymentIntentSucceeded() no longer calls linkIntentToCheckoutPayment(). The '
                .'lookup by intent id alone misses the checkout row, and the fallback below it '
                .'creates a duplicate that can never be paid.'
        );

        $this->assertNotFalse($createAt, 'The auto-create branch has moved; this guard needs updating.');

        $this->assertLessThan(
            $createAt,
            $matchAt,
            'The session match must run BEFORE the auto-create branch. Reversed or removed, a '
                .'racing payment_intent.succeeded writes a second Payment row for an intent that '
                .'already has one.'
        );
    }

    public function test_the_helper_never_throws_out_of_a_webhook(): void
    {
        $source = $this->source();

        $start = strpos($source, 'private function linkIntentToCheckoutPayment(');
        $this->assertNotFalse($start, 'linkIntentToCheckoutPayment() is gone.');

        $end = strpos($source, 'private function handlePaymentIntentSucceeded(', $start);
        $this->assertNotFalse($end, 'handlePaymentIntentSucceeded() no longer follows the helper.');

        $body = substr($source, $start, $end - $start);

        $this->assertStringContainsString(
            'catch (\Throwable $e)',
            $body,
            'The helper runs inside a webhook and makes a Stripe call. A lookup failure must leave '
                .'the old behaviour in place, never fail the event and make Stripe retry it.'
        );
    }
}
