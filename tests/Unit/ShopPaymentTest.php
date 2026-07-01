<?php

namespace Tests\Unit;

use App\Models\ShopPayment;
use Tests\TestCase;

class ShopPaymentTest extends TestCase
{
    public function test_it_prefers_total_paid_when_present(): void
    {
        $payment = new ShopPayment([
            'amount' => 10,
            'shipping_amount' => 2,
            'vat_tax_amount' => 1,
            'tax_amount' => 0.5,
            'total_paid' => 13.5,
        ]);

        $this->assertSame(13.5, $payment->getResolvedTotalPaidAmount());
    }

    public function test_it_falls_back_to_item_plus_shipping_and_taxes_when_total_paid_is_missing(): void
    {
        $payment = new ShopPayment([
            'amount' => 10,
            'shipping_amount' => 2,
            'vat_tax_amount' => 1,
            'tax_amount' => 0.5,
        ]);

        $this->assertSame(13.5, $payment->getResolvedTotalPaidAmount());
    }
}
