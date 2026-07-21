<?php

namespace Tests\Unit;

use Tests\TestCase;

class PayByBankInstantFulfilmentTest extends TestCase
{
    public function test_instant_fulfilment_config_defaults_to_true(): void
    {
        $this->assertTrue(config('payments.instant_fulfilment'));
        $this->assertTrue(config('payments.enabled'));
    }

    public function test_bank_fee_profile_pricing_calculation(): void
    {
        $profile = config('payments.fee_profiles.bank');
        $this->assertEquals(0.8, $profile['stripe_rate']);
        $this->assertEquals(0.30, $profile['stripe_fixed_fee']);
        $this->assertEquals(13.0, $profile['platform_rate']);
        $this->assertEquals(2.0, $profile['compliance_rate']);
    }
}
