<?php

namespace Tests\Unit;

use App\Helpers;
use App\Services\PaymentMethodPricingService;
use App\Services\PaymentTierService;
use Tests\TestCase;

class PaymentMethodPricingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'payments.enabled' => true,
            'payments.method_flags' => [
                'pay_by_bank' => true,
                'sepa_debit' => true,
                'us_bank_account' => true,
            ],
        ]);
    }

    public function test_card_profile_is_default_and_unchanged(): void
    {
        $legacy = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0);
        $explicit = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');

        $this->assertSame('card', $legacy['fee_profile']);
        $this->assertSame($legacy['total_supporter_pays'], $explicit['total_supporter_pays']);
        $this->assertSame($legacy['application_fee'], $explicit['application_fee']);
    }

    public function test_unknown_profile_falls_back_to_card(): void
    {
        $breakdown = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'crypto');
        $this->assertSame('card', $breakdown['fee_profile']);
    }

    /**
     * 🚨 THIS TEST USED TO ASSERT BANK WAS CHEAPER, AND THAT IS NOW THE BUG.
     * It was `test_bank_profile_is_cheaper_for_supporter_same_for_creator` and
     * required `saving > 0` — true under the legacy markup model, where bank ran
     * at a lower rate. Client decision D2 (11 Sep 2026) set BOTH rails to the
     * same all-in 12% and said in as many words not to build a "one rail is
     * cheaper" proposition, so the old assertion pinned a commercial position
     * the client had already withdrawn.
     *
     * ⚠️ What is asserted instead is the pair of things that are still true and
     * still load-bearing: the creator receives their listed price on EITHER
     * rail, and the supporter is quoted the SAME total on both. The second is
     * what makes the rails interchangeable to a buyer — if they ever diverge,
     * `PaymentMethodSelector`'s struck-through price and "Save £X" sticker have
     * to come back, and the copy rule with them.
     *
     * ⚠️ `saving` is still COMPUTED and is deliberately still checked — at one
     * rate it must be exactly 0. It is not drawn anywhere any more; a non-zero
     * here means the rates have drifted apart and nothing on screen would say so.
     */
    public function test_both_rails_quote_the_same_total_and_pay_the_creator_in_full(): void
    {
        $prices = PaymentMethodPricingService::dualPrices(100, 'GBP');

        $this->assertNotNull($prices['bank']);

        $this->assertSame(
            (float) $prices['card']['total_supporter_pays'],
            (float) $prices['bank']['total_supporter_pays'],
            'Card and bank must quote one price under the all-in model (D2).'
        );
        $this->assertSame(0.0, (float) $prices['saving']);

        // Creator receives the listed price on both paths.
        $this->assertSame(100.0, (float) $prices['card']['listed_price']);
        $this->assertSame(100.0, (float) $prices['bank']['listed_price']);
    }

    public function test_bank_methods_resolved_per_currency(): void
    {
        $this->assertSame(['pay_by_bank'], PaymentMethodPricingService::bankMethodsForCurrency('GBP'));
        $this->assertSame(['pay_by_bank', 'sepa_debit'], PaymentMethodPricingService::bankMethodsForCurrency('EUR'));
        $this->assertSame(['us_bank_account'], PaymentMethodPricingService::bankMethodsForCurrency('USD'));
        $this->assertSame([], PaymentMethodPricingService::bankMethodsForCurrency('INR'));
    }

    public function test_bank_methods_empty_when_disabled(): void
    {
        config(['payments.enabled' => false]);
        $this->assertSame([], PaymentMethodPricingService::bankMethodsForCurrency('GBP'));
    }

    public function test_delayed_settlement_flags(): void
    {
        $this->assertFalse(PaymentMethodPricingService::hasDelayedSettlement('GBP'));
        $this->assertTrue(PaymentMethodPricingService::hasDelayedSettlement('EUR'));
        $this->assertTrue(PaymentMethodPricingService::hasDelayedSettlement('USD'));
    }

    public function test_tier_boundaries_gbp(): void
    {
        $this->assertSame(PaymentTierService::TIER_OPEN, PaymentTierService::tierFor(250, 'GBP'));
        $this->assertSame(PaymentTierService::TIER_RECOMMEND_BANK, PaymentTierService::tierFor(250.01, 'GBP'));
        $this->assertSame(PaymentTierService::TIER_RECOMMEND_BANK, PaymentTierService::tierFor(1000, 'GBP'));
        $this->assertSame(PaymentTierService::TIER_BANK_REQUIRED, PaymentTierService::tierFor(1000.01, 'GBP'));
    }
}
