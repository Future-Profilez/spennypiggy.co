<?php

namespace Tests\Feature;

use App\Helpers;
use App\Services\Pricing\FeeModel;
use App\Services\Pricing\PricingResolver;
use Tests\TestCase;

/**
 * 🚨 A RECOMPUTE MUST RE-COST A CHARGE ON THE MODEL THAT PRICED IT.
 *
 * `finance:sync-transactions` runs every 30 minutes and rewrites the fee columns on
 * existing ledger rows from a freshly computed breakdown, passing
 * `Helpers::storedFeeRates($payment)` as the override. That array carried no
 * `fee_model`, so `calculateStripeDirectChargeFlow`'s `?? MODEL_LEGACY` default fired
 * on EVERY recompute — and a live all-in charge of £112.01 was restated as £113.13,
 * repeatedly, silently, on the screens the platform reports its own margin from.
 *
 * ⚠️ THE DEFAULT IS CORRECT AND MUST STAY. Every row written before 11 Sep 2026
 * genuinely is legacy, and a recompute that guessed all-in would understate the fees
 * on the entire back catalogue. The fault was that a new all-in row was
 * indistinguishable from an old legacy one — not that the default was wrong.
 *
 * 🚨 A TEST THAT ONLY CHECKS A FRESH CHARGE PASSES AGAINST THIS BUG. The fault lives
 * exclusively on the re-cost path, so every case here goes charge → stored row →
 * recompute, the way the sync command does.
 */
class LedgerRecostModelTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'payments.model' => FeeModel::MODEL_ALL_IN,
            'payments.all_in.card' => 12,
            'payments.all_in.bank' => 9,
            'payments.fixed_fee.enabled' => false,
            'payments.fixed_fee.amount_gbp' => 0,
        ]);

        PricingResolver::forget();
    }

    /**
     * The row a charge writes, read back the way every recompute path reads it.
     *
     * ⚠️ A PLAIN OBJECT ON PURPOSE. `storedFeeRates()` is handed payment models, ledger
     * models and plain objects by its twenty call sites, and its own docblock says every
     * read must be `?? null` for exactly that reason.
     */
    private function storedRowFor(array $breakdown, string $profile = 'card', ?float $recordedGross = null): object
    {
        return (object) [
            'platform_fee_rate' => $breakdown['platform_fee_rate'] ?? null,
            'compliance_fee_rate' => $breakdown['compliance_fee_rate'] ?? null,
            'stripe_fee_rate' => $breakdown['stripe_fee_rate'] ?? null,
            'stripe_fixed_fee' => $breakdown['stripe_fixed_fee'] ?? null,
            'fee_profile' => $profile,
            'fee_source' => $breakdown['fee_source'] ?? null,
            'fee_override_id' => $breakdown['fee_override_id'] ?? null,
            'total_paid' => $recordedGross,
        ];
    }

    /** charge → store → recompute, exactly as `finance:sync-transactions` does. */
    private function recost(float $listed, array $charge, string $profile = 'card', ?float $recordedGross = null): array
    {
        return Helpers::calculateStripeDirectChargeFlow(
            $listed,
            'GBP',
            0,
            $profile,
            null,
            Helpers::storedFeeRates($this->storedRowFor($charge, $profile, $recordedGross))
        );
    }

    /* -----------------------------------------------------------------
     | The reported bug
     | ----------------------------------------------------------------- */

    public function test_an_all_in_charge_is_not_restated_as_legacy_when_it_is_re_cost(): void
    {
        $charge = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');

        $this->assertSame(FeeModel::MODEL_ALL_IN, $charge['fee_model']);
        $this->assertEqualsWithDelta(112.01, $charge['total_supporter_pays'], 0.02);

        $recost = $this->recost(100, $charge);

        $this->assertSame(
            FeeModel::MODEL_ALL_IN,
            $recost['fee_model'],
            'the recompute re-cost an all-in charge as legacy'
        );
        $this->assertEqualsWithDelta(
            $charge['total_supporter_pays'],
            $recost['total_supporter_pays'],
            0.005,
            'the recompute restated what the supporter was charged'
        );
    }

    public function test_the_fees_the_recompute_writes_back_match_the_ones_charged(): void
    {
        // The sync rewrites `platform_fee` and `stripe_fee` on the ledger row from the
        // recomputed breakdown — so a drift here IS the platform's reported margin
        // moving for a sale that already happened.
        $charge = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');
        $recost = $this->recost(100, $charge);

        foreach (['platform_fee', 'stripe_fee', 'net_to_creator', 'compliance_fee', 'admin_fee'] as $key) {
            $this->assertEqualsWithDelta(
                (float) $charge[$key],
                (float) $recost[$key],
                0.005,
                "{$key} moved on recompute"
            );
        }
    }

    public function test_it_holds_across_the_price_range_and_both_rails(): void
    {
        foreach ([4.99, 9.99, 49.99, 100, 1000, 10000] as $listed) {
            foreach (['card', 'bank'] as $rail) {
                $charge = Helpers::calculateStripeDirectChargeFlow($listed, 'GBP', 0, $rail);
                $recost = $this->recost($listed, $charge, $rail);

                $this->assertSame(FeeModel::MODEL_ALL_IN, $recost['fee_model'], "£{$listed} on {$rail}");
                $this->assertEqualsWithDelta(
                    $charge['total_supporter_pays'],
                    $recost['total_supporter_pays'],
                    0.005,
                    "£{$listed} on {$rail}"
                );
            }
        }
    }

    /* -----------------------------------------------------------------
     | The controls — the default must still hold for real legacy rows
     | ----------------------------------------------------------------- */

    public function test_a_legacy_charge_is_still_re_cost_as_legacy(): void
    {
        config(['payments.model' => FeeModel::MODEL_LEGACY]);

        $charge = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');
        $this->assertSame(FeeModel::MODEL_LEGACY, $charge['fee_model']);

        $recost = $this->recost(100, $charge);

        $this->assertSame(FeeModel::MODEL_LEGACY, $recost['fee_model']);
        $this->assertEqualsWithDelta($charge['total_supporter_pays'], $recost['total_supporter_pays'], 0.005);
    }

    public function test_a_row_that_predates_the_fee_rate_columns_is_re_cost_as_legacy(): void
    {
        /*
         * 🚨 NULL MEANS "NOT RECORDED", NEVER "ALL-IN". Every row written before August
         * 2026 carries nulls in these columns and was priced with the stacked markup;
         * reading a null compliance rate as all-in would understate the fees on the
         * whole back catalogue at once.
         */
        $bare = (object) [
            'platform_fee_rate' => null,
            'compliance_fee_rate' => null,
            'stripe_fee_rate' => null,
            'stripe_fixed_fee' => null,
            'fee_profile' => 'card',
        ];

        $recost = Helpers::calculateStripeDirectChargeFlow(
            100, 'GBP', 0, 'card', null, Helpers::storedFeeRates($bare)
        );

        $this->assertSame(FeeModel::MODEL_LEGACY, $recost['fee_model']);
        $this->assertGreaterThan(125, $recost['total_supporter_pays']);
    }

    public function test_a_row_with_no_stored_rates_at_all_is_re_cost_as_legacy(): void
    {
        // `storedFeeRates(null)` answers null, i.e. no override — the live model then
        // applies, which is correct for a charge being priced rather than re-cost.
        $this->assertNull(Helpers::storedFeeRates(null));
    }

    /* -----------------------------------------------------------------
     | The gap this feature would otherwise open
     | ----------------------------------------------------------------- */

    public function test_a_rate_change_does_not_restate_a_sale_made_at_the_old_rate(): void
    {
        /*
         * 🚨 THE SECOND HALF OF THE SAME FAULT, AND PUBLISHABLE PRICING IS WHAT MAKES IT
         * LIVE. Knowing the charge was all-in is not enough — the recompute also has to
         * know WHICH all-in rate it was charged at, or the next sync restates every
         * historic sale at today's percentage.
         *
         * ⚠️ There is no frozen supporter-rate column to read (see the note in
         * `storedFeeRates`), so the row's own RECORDED GROSS is what pins it.
         */
        $charge = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');
        $recordedGross = (float) $charge['total_supporter_pays'];

        // The platform raises its rate the following week.
        config(['payments.all_in.card' => 18]);
        PricingResolver::forget();

        $recost = $this->recost(100, $charge, 'card', $recordedGross);

        $this->assertEqualsWithDelta(
            $recordedGross,
            $recost['total_supporter_pays'],
            0.005,
            'a past sale was re-cost at the new rate'
        );
        $this->assertEqualsWithDelta(12.0, (float) $recost['supporter_rate'], 0.02);
    }

    public function test_a_nonsense_recorded_gross_is_ignored_rather_than_trusted(): void
    {
        /*
         * ⚠️ `total_paid` is not written by every payment table and is not validated
         * anywhere. A value below the listed price, or one implying an absurd fee, is a
         * data fault — falling back to the configured rate is recoverable, pricing a
         * ledger row off a corrupt column is not.
         */
        $charge = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');

        foreach ([0.0, -5.0, 40.0, 100_000.0] as $nonsense) {
            $recost = $this->recost(100, $charge, 'card', $nonsense);

            $this->assertEqualsWithDelta(
                112.01,
                $recost['total_supporter_pays'],
                0.02,
                "a recorded gross of {$nonsense} was trusted"
            );
        }
    }

    public function test_a_recorded_gross_never_overrides_a_legacy_row(): void
    {
        // The recorded total only pins the ALL-IN path. The legacy path solves its own
        // gross-up from the frozen rates and must keep doing so.
        config(['payments.model' => FeeModel::MODEL_LEGACY]);

        $charge = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');
        $recost = $this->recost(100, $charge, 'card', 999.0);

        $this->assertSame(FeeModel::MODEL_LEGACY, $recost['fee_model']);
        $this->assertEqualsWithDelta($charge['total_supporter_pays'], $recost['total_supporter_pays'], 0.005);
    }
}
