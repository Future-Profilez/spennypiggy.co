<?php

namespace Tests\Feature;

use App\Models\BlockedPayment;
use App\Models\User;
use App\Services\CreatorActivityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The creator's "Payment impact" card must count EVERY refusal.
 *
 * It read `blocked_payments` only, which no checkout gate writes — so a creator
 * losing sales was told none had been blocked while the dashboard widget beside
 * it counted them off the other table.
 */
class BlockedPaymentCardTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        return User::factory()->create(['role' => 1]);
    }

    public function test_it_counts_rows_from_the_gate_table(): void
    {
        $creator = $this->creator();

        DB::table('blocked_payment_attempts')->insert([
            'creator_id' => $creator->id,
            'amount' => 12.50,
            'currency' => 'GBP',
            'reason' => 'no_subscription',
            'created_at' => now()->subDay(),
        ]);

        $data = app(CreatorActivityService::class)->getRecentBlockedPayments($creator, 30);

        $this->assertSame(1, $data['count']);
        $this->assertSame('Your subscription is not active', $data['recent_attempts'][0]['reason']);
        $this->assertSame('GBP 12.50', $data['recent_attempts'][0]['amount']);
    }

    public function test_it_also_counts_risk_engine_rows_without_leaking_the_risk_code(): void
    {
        $creator = $this->creator();

        BlockedPayment::logBlockedPayment([
            'creator_id' => $creator->id,
            'amount' => 40,
            'currency' => 'GBP',
            'payment_type' => 'wish',
            'blocked_reason' => 'DAILY_LIMIT_EXCEEDED',
        ]);

        $data = app(CreatorActivityService::class)->getRecentBlockedPayments($creator, 30);

        $this->assertSame(1, $data['count']);
        $this->assertSame('Held by payment screening', $data['recent_attempts'][0]['reason']);
        $this->assertStringNotContainsString('DAILY_LIMIT', json_encode($data));
    }

    public function test_money_is_never_summed_across_currencies(): void
    {
        $creator = $this->creator();

        DB::table('blocked_payment_attempts')->insert([
            ['creator_id' => $creator->id, 'amount' => 10, 'currency' => 'GBP', 'reason' => 'no_subscription', 'created_at' => now()],
            ['creator_id' => $creator->id, 'amount' => 3000, 'currency' => 'JPY', 'reason' => 'stripe_disabled', 'created_at' => now()],
        ]);

        $data = app(CreatorActivityService::class)->getRecentBlockedPayments($creator, 30);

        $this->assertCount(2, $data['totals']);
        $currencies = array_column($data['totals'], 'currency');
        $this->assertContains('GBP', $currencies);
        $this->assertContains('JPY', $currencies);
        // A fractional yen is meaningless.
        $this->assertContains('JPY 3,000', array_column($data['recent_attempts'], 'amount'));
    }

    public function test_a_row_with_no_currency_counts_but_joins_no_total(): void
    {
        $creator = $this->creator();

        DB::table('blocked_payment_attempts')->insert([
            'creator_id' => $creator->id,
            'amount' => null,
            'currency' => null,
            'reason' => null,
            'created_at' => now(),
        ]);

        $data = app(CreatorActivityService::class)->getRecentBlockedPayments($creator, 30);

        $this->assertSame(1, $data['count']);
        $this->assertSame([], $data['totals']);
        $this->assertNull($data['recent_attempts'][0]['amount']);
        $this->assertSame('Reason not recorded', $data['recent_attempts'][0]['reason']);
    }

    public function test_rows_outside_the_window_are_excluded(): void
    {
        $creator = $this->creator();

        DB::table('blocked_payment_attempts')->insert([
            'creator_id' => $creator->id,
            'amount' => 10,
            'currency' => 'GBP',
            'reason' => 'no_subscription',
            'created_at' => now()->subDays(45),
        ]);

        $data = app(CreatorActivityService::class)->getRecentBlockedPayments($creator, 30);

        $this->assertSame(0, $data['count']);
    }
}
