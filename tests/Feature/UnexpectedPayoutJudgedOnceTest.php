<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * 🚨 ONE UNEXPECTED PAYOUT IS JUDGED ONCE.
 *
 * `payout.created` is commented out of `StripeWebhookController`'s dispatch, so
 * the risk detector runs on `payout.paid` AND `payout.in_transit` — and a payout
 * passes through BOTH, days apart (a standard GBP payout sits `in_transit` for
 * the whole banking wait). Live on 15 Sep 2026: JAVASCRIPT-REACT-CB/CC fired on
 * the `in_transit` event for `po_1UFFRQE9z1vKiTO0aAIhAOJ5`; the `paid` event had
 * not yet arrived.
 *
 * 🚨 THE SECOND FIRE IS THE EXPENSIVE ONE. `SuspensionService::suspend()` is
 * idempotent only while the account is STILL suspended, so an admin who
 * investigates the first alert, decides the creator did nothing wrong and lifts
 * the suspension is silently overruled days later when `paid` lands and suspends
 * them again — for the payout that admin has already judged. Same rule as a
 * resolved user flag, which a recurrence never reopens.
 *
 * ⚠️ A SOURCE SCAN, deliberately. Reaching this branch needs a signed Connect
 * webhook for a payout on a live connected account with no PayoutRecord and no
 * platform metadata; what has to be pinned is that the claim is taken, and taken
 * BEFORE anything acts on it. Comments are blanked first — the docblock quotes
 * every string being asserted on.
 */
class UnexpectedPayoutJudgedOnceTest extends TestCase
{
    private function code(): string
    {
        $source = (string) file_get_contents(
            app_path('Http/Controllers/StripeWebhookController.php')
        );

        $code = preg_replace('#/\*.*?\*/#s', '', $source);

        return (string) preg_replace('#//[^\n]*#', '', (string) $code);
    }

    /** 🚨 THE FIX. Without the claim the same payout suspends twice. */
    public function test_an_unexpected_payout_is_claimed_before_it_is_judged(): void
    {
        $code = $this->code();

        $this->assertStringContainsString(
            "Cache::add('stripe_risk:payout_judged:'",
            $code,
            'The unexpected-payout branch must claim the payout id before acting. Without it '
            .'payout.in_transit and payout.paid both judge the same payout, and the second one '
            .'re-suspends a creator an admin may already have cleared.'
        );

        $claim = strpos($code, "Cache::add('stripe_risk:payout_judged:'");
        $suspend = strpos($code, 'payment_risk');

        $this->assertNotFalse($claim);
        $this->assertNotFalse($suspend);
        $this->assertLessThan(
            $suspend,
            $claim,
            'The claim must be taken BEFORE the suspension, or the duplicate event suspends '
            .'the creator again before the claim can refuse it.'
        );
    }

    /**
     * ⚠️ `Cache::add`, never `Cache::has()` then `Cache::put()`.
     *
     * Two webhook workers can carry the same payout at once (Stripe retries, and
     * in_transit/paid can overlap). A has+put pair lets both pass the check and
     * both suspend — the exact race `ensureManualPayoutSchedule` documents.
     */
    public function test_the_claim_is_atomic(): void
    {
        $code = $this->code();

        $this->assertStringNotContainsString(
            "Cache::has('stripe_risk:payout_judged:'",
            $code,
            'The claim must be Cache::add — a has()+put() pair is not atomic and lets two '
            .'concurrent webhook workers both judge the same payout.'
        );
    }

    /**
     * ⚠️ THE CONTROL — claiming must not become silence.
     *
     * The whole point of this branch is that somebody is told a payout left a
     * connected account without the platform asking for it. Suppressing the
     * duplicate must never suppress the first alert.
     */
    public function test_the_first_sighting_is_still_reported_at_critical(): void
    {
        $code = $this->code();

        // ⚠️ Deliberately wording-independent: this is a CONTROL, so it must stay
        // green against the pre-fix code too. Tying it to the new sentence would
        // make it a second copy of the message test rather than a control.
        $this->assertMatchesRegularExpression(
            '/Log::critical\("Stripe Risk: Unexpected payout /',
            $code,
            'The first sighting of an unexpected payout must still be reported at critical. '
            .'Claiming the payout must suppress the DUPLICATE, never the alert itself.'
        );
    }

    /**
     * ⚠️ The message must name the event that actually arrived. `payout.created`
     * is not dispatched, so "Unexpected payout created" described a webhook
     * nobody handles — and sent anybody reading the alert looking for it.
     */
    public function test_the_alert_names_the_event_it_actually_saw(): void
    {
        $code = $this->code();

        $this->assertStringContainsString(
            'seen on {$eventType}',
            $code,
            'The alert must name the event it fired on. payout.created is commented out of '
            .'the dispatch, so naming it in the message is false.'
        );
    }
}
