<?php

namespace Tests\Feature;

use App\Models\FinancialTransaction;
use App\Models\User;
use App\Support\TransactionEconomics;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * §15 transaction economics.
 *
 * Two things are pinned here and neither is arithmetic for its own sake:
 *
 *  1. **SP gross fee revenue is `platform_fee` ALONE.** `compliance_fee` and
 *     `admin_fee` are the breakdown OF the application fee, not additions to
 *     it, and every reader who has only seen the column names adds all three.
 *     On a legacy row that overstates platform revenue by the compliance fee
 *     plus the old £1, on every transaction the platform has ever taken.
 *  2. **A net contribution computed from the ESTIMATE must say so.** Until a
 *     charge has been read back off its Stripe balance transaction the margin
 *     is a guess, and a guess that renders identically to a measurement is how
 *     it ends up in a report.
 */
class TransactionEconomicsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A legacy-shaped income row.
     *
     * ⚠️ Written with the query builder, not `create()` — `processor_cost` is
     * deliberately not fillable, and a fixture that mass-assigns it would pass
     * against a model that had lost that protection.
     */
    private ?int $creatorId = null;

    private ?int $supporterId = null;

    private function ledgerRow(array $overrides = []): FinancialTransaction
    {
        // Real rows: `financial_transactions` carries foreign keys to `users`.
        $this->creatorId ??= User::factory()->create(['role' => 1])->id;
        $this->supporterId ??= User::factory()->create(['role' => 0])->id;

        $id = DB::table('financial_transactions')->insertGetId(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $this->creatorId,
            'supporter_id' => $this->supporterId,
            'source_type' => 'App\\Models\\ShopPayment',
            'source_id' => 1,
            'type' => 'income',
            'gross_amount' => 130.55,
            'platform_fee' => 26.48,   // the application fee — compliance + admin already inside
            'compliance_fee' => 2.61,
            'admin_fee' => 1.00,
            'stripe_fee' => 4.07,      // the ESTIMATE the price was grossed up from
            'vat_amount' => 0.00,
            'net_amount' => 100.00,
            'reserve_amount' => 0.00,
            'reserve_status' => 'none',
            'currency' => 'GBP',
            'fee_profile' => 'card',
            'compliance_fee_rate' => 2,
            'refunded_amount' => 0.00,
            'status' => 'completed',
            'transaction_date' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));

        return FinancialTransaction::findOrFail($id);
    }

    public function test_the_listed_amount_is_the_creators_net_plus_vat(): void
    {
        $e = TransactionEconomics::for($this->ledgerRow([
            'net_amount' => 100.00,
            'vat_amount' => 20.00,
        ]));

        // The price the creator typed, not the figure they are paid.
        $this->assertSame(120.00, $e->listedAmount());
        $this->assertSame(100.00, $e->payoutAmount());
    }

    public function test_the_supporter_fee_is_what_was_paid_over_the_listed_price(): void
    {
        $e = TransactionEconomics::for($this->ledgerRow());

        $this->assertSame(130.55, $e->checkoutTotal());
        $this->assertSame(30.55, $e->supporterFee());
        $this->assertEqualsWithDelta(30.55, $e->supporterRate(), 0.01);
    }

    /**
     * 🚨 The double-count guard. Verified red against
     * `platform_fee + compliance_fee + admin_fee`, which reads 30.09 here.
     */
    public function test_gross_fee_revenue_is_the_application_fee_and_nothing_is_added_to_it(): void
    {
        $row = $this->ledgerRow();

        $this->assertSame(26.48, TransactionEconomics::for($row)->grossFeeRevenue());

        $this->assertNotEquals(
            (float) $row->platform_fee + (float) $row->compliance_fee + (float) $row->admin_fee,
            TransactionEconomics::for($row)->grossFeeRevenue(),
            'compliance and admin are the breakdown OF the application fee, never additions to it',
        );
    }

    public function test_an_unmeasured_processor_cost_is_null_and_never_zero(): void
    {
        $e = TransactionEconomics::for($this->ledgerRow());

        // Zero would say "processing was free" on every row nobody has checked.
        $this->assertNull($e->processorCost());
        $this->assertNull($e->processorCostSource());
        $this->assertFalse($e->processorCostIsMeasured());
    }

    /** 🚨 Verified red against a `netContribution()` that did not flag the fallback. */
    public function test_a_net_contribution_built_on_the_estimate_declares_itself(): void
    {
        $e = TransactionEconomics::for($this->ledgerRow());

        $this->assertSame(22.41, $e->netContribution()); // 26.48 − 4.07 estimate
        $this->assertTrue($e->netContributionIsEstimated());
        $this->assertTrue($e->toArray()['net_contribution_is_estimated']);
    }

    public function test_a_measured_cost_is_used_and_the_figure_stops_being_an_estimate(): void
    {
        $row = $this->ledgerRow();

        DB::table('financial_transactions')->where('id', $row->id)->update([
            'processor_cost' => 5.11,
            'processor_cost_source' => 'balance_transaction',
            'processor_cost_recorded_at' => now(),
        ]);

        $e = TransactionEconomics::for($row->fresh());

        $this->assertSame(5.11, $e->processorCost());
        $this->assertSame('balance_transaction', $e->processorCostSource());
        $this->assertSame(21.37, $e->netContribution()); // 26.48 − 5.11 measured
        $this->assertFalse($e->netContributionIsEstimated());
    }

    /**
     * Below break-even Stripe's fixed component exceeds the whole fee and the
     * platform genuinely loses money. Flooring it would hide the one number
     * `FeeModel::minimumSellable()` exists to argue about.
     */
    public function test_a_loss_making_sale_reports_a_negative_contribution(): void
    {
        $row = $this->ledgerRow(['platform_fee' => 0.12, 'stripe_fee' => 0.47]);

        $this->assertSame(-0.35, TransactionEconomics::for($row)->netContribution());
    }

    /** The model is inferred, and every surface has to be told that it is. */
    public function test_the_fee_model_is_inferred_and_says_so(): void
    {
        $e = TransactionEconomics::for($this->ledgerRow());

        $this->assertSame(TransactionEconomics::LEGACY, $e->feeModel());
        $this->assertFalse($e->feeModelIsRecorded());
        $this->assertFalse($e->toArray()['fee_model_is_recorded']);
    }

    /** 🚨 Verified red against `processor_cost` added to `$fillable`. */
    public function test_a_processor_cost_cannot_be_mass_assigned(): void
    {
        $row = $this->ledgerRow();

        $row->fill(['processor_cost' => 99.99, 'processor_cost_source' => 'made_up'])->save();

        $this->assertNull($row->fresh()->processor_cost);
        $this->assertNull($row->fresh()->processor_cost_source);
    }

    public function test_a_zero_decimal_currency_is_formatted_without_pennies(): void
    {
        $e = TransactionEconomics::for($this->ledgerRow(['currency' => 'JPY']));

        $this->assertSame('26', $e->format(26.48));
        $this->assertNull($e->format(null));
    }

    public function test_a_full_refund_is_recognised_against_the_gross(): void
    {
        $this->assertTrue(
            TransactionEconomics::for($this->ledgerRow(['refunded_amount' => 130.55]))->isFullyRefunded()
        );
        $this->assertFalse(
            TransactionEconomics::for($this->ledgerRow(['refunded_amount' => 10.00]))->isFullyRefunded()
        );
    }

    /**
     * The §15 payload carries every figure WITH its provenance. A caller that
     * drops the flags publishes a guess as a measurement, so their presence is
     * pinned rather than left to a reviewer to notice.
     */
    public function test_the_payload_carries_provenance_for_every_estimated_figure(): void
    {
        $payload = TransactionEconomics::for($this->ledgerRow())->toArray();

        foreach ([
            'listed_amount', 'payout_amount', 'checkout_total', 'supporter_fee',
            'gross_fee_revenue', 'processor_cost', 'processor_cost_estimate',
            'net_contribution', 'net_contribution_is_estimated',
            'fee_model', 'fee_model_is_recorded', 'payment_rail',
            'refunded_amount', 'reserve_amount', 'currency',
        ] as $key) {
            $this->assertArrayHasKey($key, $payload, "§15 payload lost `{$key}`");
        }
    }
}
