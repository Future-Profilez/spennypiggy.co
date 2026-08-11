<?php

namespace Tests\Feature;

use App\Models\Currency;
use App\Models\FinancialTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The two ledger properties admin reporting now depends on:
 * the FX rate is frozen at charge time, and the fee split preserves the total.
 */
class LedgerFxAndFeeSplitTest extends TestCase
{
    use RefreshDatabase;

    private User $creator;

    protected function setUp(): void
    {
        parent::setUp();

        FinancialTransaction::clearLedgerFxCache();

        // ⚠️ Not insertOrIgnore — `currencies` has NOT NULL columns with no default,
        // so a partial row is skipped SILENTLY and every rate lookup then returns
        // null, which reads exactly like the freeze being broken.
        foreach ([['GBP', 1, '£'], ['USD', 2, '$']] as [$iso, $rate, $symbol]) {
            Currency::updateOrCreate(
                ['ISO' => $iso],
                [
                    'conversion_rate' => $rate,
                    'ISOdigits' => 2,
                    'name' => $iso,
                    'symbol' => $symbol,
                    'symbolNative' => $symbol,
                ]
            );
        }

        // `financial_transactions.user_id` carries a real foreign key here.
        $this->creator = User::factory()->create(['role' => 1]);
    }

    private function tx(array $attrs = []): FinancialTransaction
    {
        return FinancialTransaction::create(array_merge([
            'user_id' => $this->creator->id,
            'type' => 'income',
            'status' => 'completed',
            'currency' => 'GBP',
            'gross_amount' => 100,
            'platform_fee' => 20,
            'net_amount' => 80,
            'fee_profile' => 'card',
            'transaction_date' => now(),
        ], $attrs));
    }

    public function test_the_gbp_rate_is_stamped_on_creation(): void
    {
        $tx = $this->tx(['currency' => 'USD', 'gross_amount' => 100])->fresh();

        $this->assertEquals(2.0, (float) $tx->gbp_rate);
        $this->assertEquals(50.0, (float) $tx->gbp_amount);
    }

    public function test_the_rate_is_never_rewritten_once_frozen(): void
    {
        $tx = $this->tx(['currency' => 'USD', 'gross_amount' => 100]);

        Currency::where('ISO', 'USD')->update(['conversion_rate' => 8]);
        FinancialTransaction::clearLedgerFxCache();

        // A resync legitimately corrects the gross. It must NOT re-cost the row.
        $tx->update(['gross_amount' => 200]);
        $tx->refresh();

        $this->assertEquals(2.0, (float) $tx->gbp_rate, 'the original rate must survive a later save');
        $this->assertEquals(100.0, (float) $tx->gbp_amount, 'the amount follows gross, at the ORIGINAL rate');
    }

    public function test_an_unknown_currency_is_left_unconverted_rather_than_assumed_one_to_one(): void
    {
        // Treating 1,000 of an unknown currency as £1,000 inflates revenue silently.
        // A NULL the reports can count and name is the honest answer.
        $tx = $this->tx(['currency' => 'ZZZ', 'gross_amount' => 1000])->fresh();

        $this->assertNull($tx->gbp_rate);
        $this->assertNull($tx->gbp_amount);
    }

    public function test_the_fee_split_backfill_preserves_the_application_fee_exactly(): void
    {
        // A legacy row: the combined fee only, no breakdown.
        $tx = $this->tx(['gross_amount' => 1000, 'platform_fee' => 191]);
        FinancialTransaction::whereKey($tx->id)->update(['compliance_fee' => null, 'admin_fee' => null]);

        $this->artisan('finance:split-fees')->assertSuccessful();

        $tx->refresh();

        $this->assertEquals(191.0, (float) $tx->platform_fee, 'the charged fee must never be rewritten');
        $this->assertEquals(
            191.0,
            round((float) $tx->platform_fee, 2),
            'platform_fee stays the total; the parts are carved out of it'
        );
        $this->assertGreaterThan(0, (float) $tx->compliance_fee);
        $this->assertGreaterThan(0, (float) $tx->admin_fee);
        $this->assertLessThanOrEqual(
            (float) $tx->platform_fee,
            (float) $tx->compliance_fee + (float) $tx->admin_fee,
            "the platform's own cut can never go negative"
        );
    }

    public function test_the_fee_split_is_idempotent(): void
    {
        $tx = $this->tx(['gross_amount' => 1000, 'platform_fee' => 191]);
        FinancialTransaction::whereKey($tx->id)->update(['compliance_fee' => null, 'admin_fee' => null]);

        $this->artisan('finance:split-fees')->assertSuccessful();
        $first = $tx->fresh()->compliance_fee;

        $this->artisan('finance:split-fees')->assertSuccessful();

        $this->assertEquals($first, $tx->fresh()->compliance_fee, 'a second run must change nothing');
    }

    public function test_the_fee_split_dry_run_writes_nothing(): void
    {
        $tx = $this->tx(['platform_fee' => 191]);
        FinancialTransaction::whereKey($tx->id)->update(['compliance_fee' => null]);

        $this->artisan('finance:split-fees --dry-run')->assertSuccessful();

        $this->assertNull($tx->fresh()->compliance_fee);
    }

    public function test_the_gbp_backfill_fills_rows_that_predate_the_column(): void
    {
        $tx = $this->tx(['currency' => 'USD', 'gross_amount' => 100]);
        FinancialTransaction::whereKey($tx->id)->update(['gbp_rate' => null, 'gbp_amount' => null]);

        $this->artisan('finance:backfill-gbp')->assertSuccessful();

        $tx->refresh();
        $this->assertEquals(2.0, (float) $tx->gbp_rate);
        $this->assertEquals(50.0, (float) $tx->gbp_amount);
    }

    public function test_the_gbp_backfill_dry_run_writes_nothing(): void
    {
        $tx = $this->tx();
        FinancialTransaction::whereKey($tx->id)->update(['gbp_rate' => null, 'gbp_amount' => null]);

        $this->artisan('finance:backfill-gbp --dry-run')->assertSuccessful();

        $this->assertNull($tx->fresh()->gbp_rate);
    }

    public function test_a_zero_fee_row_is_marked_rather_than_re_examined_every_run(): void
    {
        $tx = $this->tx(['platform_fee' => 0]);
        FinancialTransaction::whereKey($tx->id)->update(['compliance_fee' => null, 'admin_fee' => null]);

        $this->artisan('finance:split-fees')->assertSuccessful();

        $this->assertEquals(0.0, (float) $tx->fresh()->compliance_fee);
    }
}
