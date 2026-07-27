<?php

namespace Tests\Feature;

use App\Helpers;
use App\Models\Currency;
use App\Models\FinancialTransaction;
use App\Models\ShopPayment;
use App\Models\TipGoalsPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EarningsCurrencyConsistencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_earnings_endpoint_converts_to_display_currency_cookie(): void
    {
        Helpers::clearCurrencyCache();

        Currency::create(['ISO' => 'GBP', 'name' => 'Pound Sterling', 'conversion_rate' => 1, 'ISOdigits' => 2, 'symbol' => '£']);
        Currency::create(['ISO' => 'USD', 'name' => 'US Dollar', 'conversion_rate' => 1.25, 'ISOdigits' => 2, 'symbol' => '$']);
        Currency::create(['ISO' => 'EUR', 'name' => 'Euro', 'conversion_rate' => 1.15, 'ISOdigits' => 2, 'symbol' => '€']);

        $user = User::factory()->create(['default_currency' => 'EUR']);

        FinancialTransaction::create([
            'user_id' => $user->id,
            'supporter_id' => null,
            'source_type' => TipGoalsPayment::class,
            'source_id' => 1,
            'type' => 'income',
            'gross_amount' => 10.00,
            'platform_fee' => 1.00,
            'stripe_fee' => 0.50,
            'vat_amount' => 0.00,
            'net_amount' => 8.50,
            'currency' => 'GBP',
            'status' => 'completed',
            'description' => 'tip',
            'transaction_date' => now(),
        ]);

        FinancialTransaction::create([
            'user_id' => $user->id,
            'supporter_id' => null,
            'source_type' => ShopPayment::class,
            'source_id' => 2,
            'type' => 'income',
            'gross_amount' => 20.00,
            'platform_fee' => 2.00,
            'stripe_fee' => 1.00,
            'vat_amount' => 0.00,
            'net_amount' => 17.00,
            'currency' => 'USD',
            'status' => 'completed',
            'description' => 'shop',
            'transaction_date' => now(),
        ]);

        $resp = $this->actingAs($user)->getJson('/earnings/all-data/all');

        $resp->assertOk();

        $json = $resp->json();
        $this->assertSame('eur', $json['currency']);

        $expected = round(
            Helpers::priceFormat('GBP', 8.50, 'EUR') +
            Helpers::priceFormat('USD', 17.00, 'EUR'),
            2
        );

        $this->assertEquals($expected, $json['total']);
    }
}
