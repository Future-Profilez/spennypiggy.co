<?php

namespace Tests\Feature;

use App\Models\CreatorMetric;
use App\Models\Currency;
use App\Models\FastStartBonusPayout;
use App\Models\FinancialTransaction;
use App\Models\TipGoalsPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class ReconcileFastStartBonusPayoutsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Currency::create([
            'ISO' => 'GBP',
            'name' => 'Pound Sterling',
            'conversion_rate' => 1,
            'ISOdigits' => 2,
            'symbol' => '£'
        ]);
    }

    private function makeUser(array $attrs = []): User
    {
        return User::factory()->create(array_merge([
            'uuid' => (string) Str::uuid(),
            'default_currency' => 'GBP',
            'stripe_connected_at' => now()->subDays(40),
            'stripe_details_submitted' => 1,
            'account_id' => 'acct_' . Str::random(10),
        ], $attrs));
    }

    private function purchase(User $creator, User $supporter, int $daysAgo, float $net = 50.00, string $status = 'completed'): FinancialTransaction
    {
        $tip = TipGoalsPayment::create([
            'tip_goal_id' => 1, // dummy
            'user_id' => $supporter->id,
            'session_id' => 'cs_'.Str::random(8),
            'currency' => 'GBP',
            'amount' => $net,
            'tax' => 0,
            'status' => 'paid',
        ]);

        return FinancialTransaction::create([
            'user_id' => $creator->id,
            'supporter_id' => $supporter->id,
            'source_type' => TipGoalsPayment::class,
            'source_id' => $tip->id,
            'type' => 'income',
            'gross_amount' => $net,
            'platform_fee' => 0,
            'stripe_fee' => 0,
            'vat_amount' => 0,
            'net_amount' => $net,
            'currency' => 'GBP',
            'status' => $status,
            'transaction_date' => now()->subDays($daysAgo),
        ]);
    }

    public function test_reconciliation_calculates_and_applies_clawback_delta_idempotently(): void
    {
        $creator = $this->makeUser();
        $supporter = $this->makeUser();

        // Earned transactions: 3 purchases of £100 each = £300 earnings
        $tx1 = $this->purchase($creator, $supporter, 35, 100.00);
        $tx2 = $this->purchase($creator, $supporter, 34, 100.00);
        $tx3 = $this->purchase($creator, $supporter, 33, 100.00);

        // Pre-existing paid payout: paid bonus is 5% of £300 = £15 = 1500 minor units
        $payout = FastStartBonusPayout::create([
            'creator_uuid' => $creator->uuid,
            'stripe_account_id' => $creator->account_id,
            'window_start' => now()->subDays(40),
            'window_end' => now()->subDays(10),
            'eligible_at' => now()->subDays(3),
            'unsettled_count' => 0,
            'last_calculated_at' => now()->subDays(3),
            'earnings_minor' => 30000,
            'bonus_minor' => 1500,
            'currency' => 'GBP',
            'status' => 'paid',
            'paid_at' => now()->subDays(3),
        ]);

        // Run reconciliation when no refunds have happened
        $this->artisan('bonus:reconcile-fast-start')
            ->assertSuccessful();

        $payout->refresh();
        $this->assertEquals(30000, $payout->expected_earnings_minor);
        $this->assertEquals(1500, $payout->expected_bonus_minor);
        $this->assertEquals(0, $payout->clawback_minor);

        $metric = CreatorMetric::where('creator_id', $creator->uuid)->first();
        $this->assertNull($metric); // No negative balance record created since clawback is 0

        // 1. One transaction gets refunded: earnings drop to £200, expected bonus drops to £10 (1000 minor)
        // Clawback total should be 1500 - 1000 = 500 minor units
        $tx1->update(['status' => 'refunded']);

        $this->artisan('bonus:reconcile-fast-start')
            ->assertSuccessful();

        $payout->refresh();
        $this->assertEquals(20000, $payout->expected_earnings_minor);
        $this->assertEquals(1000, $payout->expected_bonus_minor);
        $this->assertEquals(500, $payout->clawback_minor);

        $metric = CreatorMetric::where('creator_id', $creator->uuid)->first();
        $this->assertNotNull($metric);
        $this->assertEquals(500, $metric->negative_balance_minor);

        // 2. Run reconciliation AGAIN (idempotency check)
        // No new refunds happened, clawback remains 500, delta should be 0.
        // Metric should still have negative_balance_minor = 500 (not 1000!)
        $this->artisan('bonus:reconcile-fast-start')
            ->assertSuccessful();

        $payout->refresh();
        $this->assertEquals(500, $payout->clawback_minor);

        $metric->refresh();
        $this->assertEquals(500, $metric->negative_balance_minor);

        // 3. Another transaction gets refunded: earnings drop to £100, expected bonus drops to £5 (500 minor)
        // Clawback total is now 1500 - 500 = 1000 minor.
        // Delta clawback should be 1000 - 500 = 500 minor.
        // Metric should increase by 500 to a total of 1000 minor.
        $tx2->update(['status' => 'refunded']);

        $this->artisan('bonus:reconcile-fast-start')
            ->assertSuccessful();

        $payout->refresh();
        $this->assertEquals(1000, $payout->clawback_minor);

        $metric->refresh();
        $this->assertEquals(1000, $metric->negative_balance_minor);

        // 4. Run reconciliation AGAIN (idempotency check 2)
        $this->artisan('bonus:reconcile-fast-start')
            ->assertSuccessful();

        $metric->refresh();
        $this->assertEquals(1000, $metric->negative_balance_minor);
    }
}
