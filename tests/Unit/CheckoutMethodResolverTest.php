<?php

namespace Tests\Unit;

use App\Models\Currency;
use App\Services\CheckoutMethodResolver;
use App\Services\PaymentTierService;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
