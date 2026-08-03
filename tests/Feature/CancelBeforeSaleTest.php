<?php

namespace Tests\Feature;

use App\Models\MonthlyCharge;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CancelBeforeSaleTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $charge): User
    {
        $user = User::factory()->create(['role' => 1]);
        MonthlyCharge::create(array_merge([
            'user_id' => $user->id,
            'amount' => 8.99,
            'currency' => 'GBP',
        ], $charge));

        return $user->fresh();
    }

    public function test_card_saved_before_a_sale_can_still_be_paid(): void
    {
        $u = $this->creator(['status' => 'trialing', 'stripe_payment_method' => 'pm_x']);
        $this->assertContains($u->subscription_status, [1, 2], 'free period must remain sellable');
    }

    public function test_cancelling_before_a_sale_stops_payments(): void
    {
        $u = $this->creator([
            'status' => 'canceled',
            'stripe_payment_method' => 'pm_x',
            'cancelled_at' => now(),
        ]);
        $this->assertSame(0, $u->subscription_status, 'a cancelled creator must not be payable');
    }
}
