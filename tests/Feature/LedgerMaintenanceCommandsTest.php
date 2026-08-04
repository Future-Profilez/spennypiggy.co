<?php

namespace Tests\Feature;

use App\Helpers;
use App\Models\Currency;
use App\Models\FinancialTransaction;
use App\Models\Shop;
use App\Models\ShopPayment;
use App\Models\TipGoalsPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LedgerMaintenanceCommandsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Helpers::clearCurrencyCache();
        Currency::create(['ISO' => 'GBP', 'name' => 'Pound Sterling', 'conversion_rate' => 1, 'ISOdigits' => 2, 'symbol' => '£']);
    }

    private function brokenRow(User $creator): FinancialTransaction
    {
        // Exactly what the orphan-checkout recovery path used to write: the supporter
        // charge built from the metadata's `tax` key with no Stripe fee at all, so the
        // recorded charge is BELOW what the creator earned.
        return FinancialTransaction::create([
            'user_id' => $creator->id,
            'source_type' => TipGoalsPayment::class,
            'source_id' => 1,
            'type' => 'income',
            'gross_amount' => 90.00,
            'platform_fee' => 0.00,
            'stripe_fee' => 0.00,
            'vat_amount' => 0.00,
            'net_amount' => 100.00,
            'currency' => 'GBP',
            'status' => 'completed',
            'description' => 'legacy row',
            'transaction_date' => now(),
        ]);
    }

    public function test_backfill_repairs_a_charge_recorded_below_the_creator_earning(): void
    {
        $creator = User::factory()->create(['default_currency' => 'GBP', 'role' => 1]);
        $ft = $this->brokenRow($creator);

        $this->artisan('finance:backfill-ledger-gross')->assertSuccessful();

        $ft->refresh();

        $this->assertGreaterThan(100.00, (float) $ft->gross_amount, 'The supporter must be recorded paying at least the creator gross.');
        $this->assertGreaterThan(0, (float) $ft->stripe_fee, 'The Stripe fee was hardcoded to zero and must now be real.');
        $this->assertGreaterThan(0, (float) $ft->platform_fee);
    }

    public function test_backfill_dry_run_writes_nothing(): void
    {
        $creator = User::factory()->create(['default_currency' => 'GBP', 'role' => 1]);
        $ft = $this->brokenRow($creator);

        $this->artisan('finance:backfill-ledger-gross --dry-run')->assertSuccessful();

        $this->assertSame('90.00', $ft->refresh()->gross_amount);
    }

    /** A correct row must not be rewritten on every run. */
    public function test_backfill_leaves_a_correct_row_alone(): void
    {
        $creator = User::factory()->create(['default_currency' => 'GBP', 'role' => 1]);

        $ft = FinancialTransaction::create([
            'user_id' => $creator->id,
            'source_type' => TipGoalsPayment::class,
            'source_id' => 2,
            'type' => 'income',
            'gross_amount' => 121.00,
            'platform_fee' => 19.00,
            'stripe_fee' => 2.00,
            'vat_amount' => 0.00,
            'net_amount' => 100.00,
            'currency' => 'GBP',
            'status' => 'completed',
            'description' => 'correct row',
            'transaction_date' => now(),
        ]);

        $before = $ft->updated_at;

        $this->artisan('finance:backfill-ledger-gross')->assertSuccessful();

        $this->assertSame('121.00', $ft->refresh()->gross_amount);
        $this->assertEquals($before, $ft->updated_at);
    }

    /** Never touch the payout-driving columns. */
    public function test_backfill_does_not_change_the_creator_net_or_reserve(): void
    {
        $creator = User::factory()->create(['default_currency' => 'GBP', 'role' => 1]);
        $ft = $this->brokenRow($creator);
        $ft->forceFill(['reserve_amount' => 15.00, 'reserve_status' => 'held'])->save();

        $this->artisan('finance:backfill-ledger-gross')->assertSuccessful();

        $ft->refresh();
        $this->assertSame('100.00', $ft->net_amount);
        $this->assertEquals(15.00, (float) $ft->reserve_amount);
        $this->assertSame('held', $ft->reserve_status);
    }

    public function test_audit_is_clean_when_every_payment_has_a_ledger_row(): void
    {
        $this->artisan('finance:audit-ledger')->assertSuccessful();
    }

    /**
     * A settled payment with no ledger row is money the creator is not shown and the
     * payout run will never pay — and nothing about it errors. This is the only thing
     * that surfaces it.
     */
    public function test_audit_reports_a_settled_payment_with_no_ledger_row(): void
    {
        $creator = User::factory()->create(['default_currency' => 'GBP', 'role' => 1]);
        $shop = Shop::factory()->create(['user_id' => $creator->id, 'type' => 'digital']);

        ShopPayment::create([
            'uuid' => (string) Str::uuid(),
            'session_id' => 'cs_'.Str::random(20),
            'shop_id' => $shop->id,
            'amount' => 100,
            'total_paid' => 120,
            'currency' => 'GBP',
            'payment_status' => 'paid',
        ]);

        $this->artisan('finance:audit-ledger')->assertFailed();
    }

    /** An unpaid basket is not a missing ledger row. */
    public function test_audit_ignores_a_payment_that_never_settled(): void
    {
        $creator = User::factory()->create(['default_currency' => 'GBP', 'role' => 1]);
        $shop = Shop::factory()->create(['user_id' => $creator->id, 'type' => 'digital']);

        ShopPayment::create([
            'uuid' => (string) Str::uuid(),
            'session_id' => 'cs_'.Str::random(20),
            'shop_id' => $shop->id,
            'amount' => 100,
            'currency' => 'GBP',
            'payment_status' => 'pending',
        ]);

        $this->artisan('finance:audit-ledger')->assertSuccessful();
    }

    public function test_audit_reports_an_impossible_amount(): void
    {
        $creator = User::factory()->create(['default_currency' => 'GBP', 'role' => 1]);
        $this->brokenRow($creator);

        $this->artisan('finance:audit-ledger')->assertFailed();
    }
}
