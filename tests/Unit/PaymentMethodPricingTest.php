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

    public function test_bank_profile_is_cheaper_for_supporter_same_for_creator(): void
    {
        $prices = PaymentMethodPricingService::dualPrices(100, 'GBP');

        $this->assertNotNull($prices['bank']);
        $this->assertLessThan(
            $prices['card']['total_supporter_pays'],
            $prices['bank']['total_supporter_pays']
        );
        $this->assertGreaterThan(0, $prices['saving']);

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
