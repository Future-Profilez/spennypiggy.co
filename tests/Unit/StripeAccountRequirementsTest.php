<?php

namespace Tests\Unit;

use App\StripeControl;
use PHPUnit\Framework\Attributes\Test;
use Stripe\Account;
use Tests\TestCase;

/**
 * The contract this panel exists to keep: **if Stripe wants something, the
 * creator sees it here.** Most creators never open the Stripe dashboard, so a
 * requirement that is not rendered on this panel is a requirement nobody acts
 * on — and the account quietly stops taking money.
 */
class StripeAccountRequirementsTest extends TestCase
{
    /**
     * @param  array<string, mixed>  $overrides
     */
    private function account(array $overrides = []): Account
    {
        return Account::constructFrom(array_replace_recursive([
            'id' => 'acct_test',
            'object' => 'account',
            'charges_enabled' => false,
            'payouts_enabled' => false,
            'details_submitted' => false,
            'capabilities' => ['card_payments' => 'inactive', 'transfers' => 'inactive'],
            'requirements' => [
                'disabled_reason' => null,
                'past_due' => [],
                'currently_due' => [],
                'eventually_due' => [],
                'pending_verification' => [],
                'errors' => [],
                'current_deadline' => null,
            ],
        ], $overrides));
    }

    #[Test]
    public function an_unfinished_onboarding_produces_exactly_one_card(): void
    {
        // The bug this replaced: past_due + currently_due + card_payments
        // inactive + transfers inactive each produced a card, so one root cause
        // rendered as four "ACTION REQUIRED" panels plus a fifth standalone
        // block — all linking to the same place.
        $cards = StripeControl::buildAccountRequirements($this->account([
            'requirements' => [
                'disabled_reason' => 'requirements.past_due',
                'currently_due' => ['individual.first_name', 'individual.address.city'],
            ],
        ]));

        $this->assertCount(1, $cards);
        $this->assertSame('onboarding_incomplete', $cards[0]['type']);
        $this->assertSame('/stripe/enable_card_payments', $cards[0]['action_url']);
        $this->assertSame(['First name', 'Town or city'], $cards[0]['fields_needed']);
    }

    #[Test]
    public function a_rejected_account_is_never_collapsed_into_finish_your_setup(): void
    {
        // Stripe can reject an account that never finished onboarding. Telling
        // that creator to "finish your Stripe setup" and handing them an
        // onboarding button sends them round a loop that cannot terminate, and
        // never mentions the one thing that could help — support.
        foreach (['rejected.fraud', 'rejected.listed', 'rejected.terms_of_service', 'listed', 'platform_paused'] as $reason) {
            $cards = StripeControl::buildAccountRequirements($this->account([
                'requirements' => [
                    'disabled_reason' => $reason,
                    'currently_due' => ['individual.first_name'],
                ],
            ]));

            $this->assertCount(1, $cards, "Expected a single card for {$reason}");
            $this->assertSame('account_rejected', $cards[0]['type'], "Wrong card for {$reason}");
            $this->assertNull($cards[0]['action_url'], "A rejected account must not link to onboarding ({$reason})");
            $this->assertTrue($cards[0]['contact_support']);
        }
    }

    #[Test]
    public function an_account_under_review_is_not_labelled_action_required(): void
    {
        // There is nothing for the creator to do. Shouting at them here is how
        // people learn to ignore the panel that matters.
        $cards = StripeControl::buildAccountRequirements($this->account([
            'requirements' => [
                'disabled_reason' => 'requirements.pending_verification',
                'pending_verification' => ['individual.verification.document'],
            ],
        ]));

        $this->assertCount(1, $cards);
        $this->assertSame('pending_verification', $cards[0]['type']);
        $this->assertSame('info', $cards[0]['severity']);
        $this->assertNull($cards[0]['action_url']);
    }

    #[Test]
    public function payouts_blocked_while_charges_work_is_its_own_card(): void
    {
        // Money is coming in and cannot be withdrawn. That is a different fact
        // from "you cannot sell", and the creator has to be told both.
        $cards = StripeControl::buildAccountRequirements($this->account([
            'charges_enabled' => true,
            'payouts_enabled' => false,
            'details_submitted' => true,
            'capabilities' => ['card_payments' => 'active', 'transfers' => 'inactive'],
            'requirements' => ['currently_due' => ['external_account']],
        ]));

        $types = array_column($cards, 'type');

        $this->assertContains('information_required_soon', $types);
        $this->assertContains('payouts_disabled', $types);
    }

    #[Test]
    public function stripe_rejection_reasons_are_surfaced_verbatim(): void
    {
        // requirements.errors is where Stripe says WHY it refused a document.
        // Nothing surfaced it before, so a creator could re-upload the same
        // unreadable passport forever.
        $cards = StripeControl::buildAccountRequirements($this->account([
            'charges_enabled' => true,
            'payouts_enabled' => true,
            'details_submitted' => true,
            'capabilities' => ['card_payments' => 'active', 'transfers' => 'active'],
            'requirements' => [
                'currently_due' => ['individual.verification.document'],
                'errors' => [
                    ['requirement' => 'individual.verification.document', 'code' => 'verification_document_not_readable', 'reason' => 'The image supplied is not readable.'],
                    ['requirement' => 'individual.verification.document', 'code' => 'verification_document_not_readable', 'reason' => 'The image supplied is not readable.'],
                ],
            ],
        ]));

        $errorCard = collect($cards)->firstWhere('type', 'requirement_errors');

        $this->assertNotNull($errorCard);
        $this->assertSame(['The image supplied is not readable.'], $errorCard['fields_needed']);
    }

    #[Test]
    public function the_stripe_deadline_reaches_the_creator(): void
    {
        // The date payments get switched off lived only in the Stripe dashboard,
        // which is exactly the place these creators do not look.
        $cards = StripeControl::buildAccountRequirements($this->account([
            'requirements' => [
                'currently_due' => ['individual.first_name'],
                'current_deadline' => 1786752000,
            ],
        ]));

        $this->assertNotNull($cards[0]['deadline']);
        $this->assertStringStartsWith('2026-08-15', $cards[0]['deadline']);
    }

    #[Test]
    public function a_healthy_account_produces_no_cards(): void
    {
        $cards = StripeControl::buildAccountRequirements($this->account([
            'charges_enabled' => true,
            'payouts_enabled' => true,
            'details_submitted' => true,
            'capabilities' => ['card_payments' => 'active', 'transfers' => 'active'],
        ]));

        $this->assertSame([], $cards);
    }

    #[Test]
    public function a_future_only_requirement_is_shown_but_not_as_urgent(): void
    {
        $cards = StripeControl::buildAccountRequirements($this->account([
            'charges_enabled' => true,
            'payouts_enabled' => true,
            'details_submitted' => true,
            'capabilities' => ['card_payments' => 'active', 'transfers' => 'active'],
            'requirements' => ['eventually_due' => ['individual.id_number']],
        ]));

        $this->assertCount(1, $cards);
        $this->assertSame('eventually_due', $cards[0]['type']);
        $this->assertSame('medium', $cards[0]['severity']);
        $this->assertSame(['National ID number'], $cards[0]['fields_needed']);
    }
}
