<?php

namespace Tests\Unit;

use App\Models\Currency;
use App\Models\Dispute;
use App\Services\CheckoutMethodResolver;
use App\Services\PaymentTierService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Guards the buy-time enforcement: a client can pick a method, never a price,
 * and the progressive tiers must hold regardless of what the client sends.
 */
class CheckoutMethodResolverTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Tier resolution converts non-GBP amounts via the currencies table.
        Currency::create(['ISO' => 'GBP', 'name' => 'Pound Sterling', 'conversion_rate' => 1, 'ISOdigits' => 2, 'symbol' => '£']);
        Currency::create(['ISO' => 'USD', 'name' => 'US Dollar', 'conversion_rate' => 1.25, 'ISOdigits' => 2, 'symbol' => '$']);
        Currency::create(['ISO' => 'INR', 'name' => 'Indian Rupee', 'conversion_rate' => 105, 'ISOdigits' => 2, 'symbol' => '₹']);

        config([
            'payments.enabled' => true,
            'payments.method_flags' => [
                'pay_by_bank' => true,
                'sepa_debit' => true,
                'us_bank_account' => true,
            ],
        ]);
    }

    public function test_card_is_the_default_profile(): void
    {
        $r = CheckoutMethodResolver::resolve('card', 'both', 50, 'GBP', null, null, 'acct_x');

        $this->assertTrue($r['ok']);
        $this->assertSame('card', $r['fee_profile']);
        $this->assertSame(['card'], $r['payment_method_types']);
        $this->assertFalse($r['force_3ds']);
    }

    public function test_missing_connected_account_refuses_closed(): void
    {
        // Listings created before creators were gated on account_id still exist;
        // a null account here must be a readable refusal, not a TypeError 500.
        $r = CheckoutMethodResolver::resolve('card', 'both', 50, 'GBP', null, null, null);

        $this->assertFalse($r['ok']);
        $this->assertSame('creator_not_connected', $r['code']);
    }

    public function test_unknown_requested_method_falls_back_to_card(): void
    {
        // A client sending anything other than 'bank' must never get bank pricing.
        $r = CheckoutMethodResolver::resolve('free', 'both', 50, 'GBP', null, null, 'acct_x');

        $this->assertSame('card', $r['fee_profile']);
    }

    public function test_card_only_listing_refuses_bank(): void
    {
        $r = CheckoutMethodResolver::resolve('bank', 'card', 50, 'GBP', null, null, 'acct_x');

        $this->assertFalse($r['ok']);
        $this->assertSame('bank_not_accepted', $r['code']);
    }

    public function test_bank_refused_when_currency_has_no_bank_rail(): void
    {
        $r = CheckoutMethodResolver::resolve('bank', 'both', 50, 'INR', null, null, 'acct_x');

        $this->assertFalse($r['ok']);
        $this->assertSame('bank_unavailable', $r['code']);
    }

    public function test_bank_disabled_globally_refuses_bank(): void
    {
        config(['payments.enabled' => false]);

        $r = CheckoutMethodResolver::resolve('bank', 'both', 50, 'GBP', null, null, 'acct_x');

        $this->assertFalse($r['ok']);
        $this->assertSame('bank_unavailable', $r['code']);
    }

    public function test_card_above_card_max_is_forced_to_3ds(): void
    {
        // Tier 3: bank required; card only continues with forced 3DS.
        $r = CheckoutMethodResolver::resolve('card', 'both', 1500, 'GBP', null, null, 'acct_x');

        $this->assertTrue($r['ok']);
        $this->assertSame('card', $r['fee_profile']);
        $this->assertTrue($r['force_3ds'], 'card above the £1k tier must force 3DS');
        $this->assertSame(PaymentTierService::TIER_BANK_REQUIRED, $r['rules']['tier']);
    }

    public function test_bank_fails_closed_when_creator_capability_cannot_be_confirmed(): void
    {
        // No verifiable connected account: the capability lookup must NOT assume
        // bank is available (that would build a session Stripe rejects). The
        // supporter is pointed back to card instead.
        $r = CheckoutMethodResolver::resolve('bank', 'both', 50, 'GBP', null, null, 'acct_does_not_exist');

        $this->assertFalse($r['ok']);
        $this->assertSame('bank_capability_missing', $r['code']);
        $this->assertStringContainsString('card', strtolower($r['message']));
    }

    public function test_tier_rules_do_not_force_3ds_on_the_bank_path(): void
    {
        // force_3ds is a card-only control; the tier layer never sets it for bank.
        $rules = PaymentTierService::resolve(1500, 'GBP', null, null);

        $this->assertSame(PaymentTierService::TIER_BANK_REQUIRED, $rules['tier']);
        $this->assertTrue($rules['bank_available']);
        $this->assertTrue($rules['bank_recommended']);
    }

    /**
     * ⚠️ `disputes` has `created_at` but NO `updated_at`, a string uuid primary
     * key with no model hook to fill it, and a non-nullable `amount`. A plain
     * `Dispute::create()` therefore dies on the missing column before the test
     * ever reaches its assertion.
     */
    private function disputeFrom(string $email, string $status = 'needs_response'): void
    {
        $dispute = new Dispute;
        $dispute->timestamps = false;
        $dispute->forceFill([
            'id' => (string) Str::uuid(),
            'stripe_dispute_id' => 'du_'.Str::random(16),
            'amount' => 150000,
            'currency' => 'gbp',
            'customer_email' => $email,
            'status' => $status,
        ])->save();
    }

    /*
    |--------------------------------------------------------------------------
    | Above the card ceiling — client decision, 11 Aug 2026
    |--------------------------------------------------------------------------
    | Card is not blocked outright. The buyer risk screen runs at this tier too
    | (it previously did not, so the largest payments were the only ones taking
    | card unscreened), and a buyer who fails it is routed to Pay by Bank.
    */

    public function test_a_clean_buyer_still_pays_by_card_above_the_ceiling(): void
    {
        $r = CheckoutMethodResolver::resolve('card', 'both', 1500, 'GBP', null, 'clean@example.com', 'acct_x');

        $this->assertTrue($r['ok'], 'a buyer with no risk signal must not be refused');
        $this->assertTrue($r['force_3ds']);
        $this->assertTrue($r['rules']['card_allowed']);
    }

    public function test_a_disputing_buyer_is_routed_to_bank_above_the_ceiling(): void
    {
        $this->disputeFrom('Chargeback@Example.com');

        // Matched case-insensitively: the address typed at checkout and the one
        // Stripe recorded on the dispute are the same address whatever the case.
        $r = CheckoutMethodResolver::resolve('card', 'both', 1500, 'GBP', null, 'chargeback@example.com', 'acct_x');

        $this->assertFalse($r['ok']);
        $this->assertSame('card_risk_declined', $r['code']);

        // The tier layer is what decided it, and it flags bank as the way
        // through — that flag is how the checkout screen knows to point there
        // rather than just showing a dead end.
        $rules = PaymentTierService::resolve(1500, 'GBP', null, 'chargeback@example.com');
        $this->assertFalse($rules['card_allowed']);
        $this->assertTrue($rules['prompt_bank']);
    }

    public function test_the_refusal_uses_the_signed_off_copy_and_names_no_amount(): void
    {
        $this->disputeFrom('x@example.com');

        $r = CheckoutMethodResolver::resolve('card', 'both', 1500, 'GBP', null, 'x@example.com', 'acct_x');

        $this->assertStringContainsString(
            "This payment can't be completed by card. Please pay securely using Pay by Bank.",
            $r['message'],
            'the client signed off this sentence verbatim'
        );

        // Rule 1 of the messaging brief: never print the threshold. A refusal
        // that says "over £1,000" tells a card tester exactly where to sit.
        $this->assertDoesNotMatchRegularExpression('/\d/', $r['message']);

        // The full state travels alongside, so a surface that can draw the card
        // does not have to re-derive it from the sentence.
        $this->assertSame('CARD_UNAVAILABLE_USE_BANK', $r['ui']['key']);
    }

    public function test_a_risky_buyer_keeps_card_when_the_currency_has_no_bank_rail(): void
    {
        // INR has no bank method. Refusing card here would leave the buyer no
        // way to pay at all, so the sale continues with 3DS instead — client
        // decision, 11 Aug 2026.
        $this->disputeFrom('inr@example.com');

        $r = CheckoutMethodResolver::resolve('card', 'both', 200000, 'INR', null, 'inr@example.com', 'acct_x');

        $this->assertTrue($r['ok'], 'no bank rail means card must remain available');
        $this->assertTrue($r['force_3ds']);
        $this->assertFalse($r['rules']['bank_available']);
    }

    public function test_a_settled_dispute_does_not_route_the_buyer_to_bank(): void
    {
        // A dispute the creator won is not a live signal against this buyer.
        $this->disputeFrom('won@example.com', 'won');

        $r = CheckoutMethodResolver::resolve('card', 'both', 1500, 'GBP', null, 'won@example.com', 'acct_x');

        $this->assertTrue($r['ok']);
    }
}
