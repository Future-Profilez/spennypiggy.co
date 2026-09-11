<?php

namespace Tests\Feature;

use App\Helpers;
use App\Models\User;
use App\Services\Pricing\CreatorFeeResolver;
use App\Services\Pricing\FeeModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The all-in supporter fee (11 Sep 2026, client direction).
 *
 * The supporter pays the listed price plus ONE advertised percentage, and Stripe's cost
 * comes OUT of that percentage rather than on top of it. The creator still receives
 * 100% of what they listed — that half did not change and these tests pin it hardest.
 */
class AllInFeeModelTest extends TestCase
{
    use RefreshDatabase;

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
    }

    /* -----------------------------------------------------------------
     | The promise
     | ----------------------------------------------------------------- */

    public function test_the_creator_always_receives_at_least_the_listed_price(): void
    {
        // 🚨 The single promise the whole pricing model is built on. Swept across the
        // real price range rather than spot-checked, because the failure this guards
        // against is a rounding penny at one price, not a wrong formula everywhere.
        foreach ([4.99, 5, 7.50, 9.99, 10, 12.34, 49.99, 100, 249.99, 500, 1000, 10000] as $listed) {
            foreach (['card', 'bank'] as $rail) {
                $r = Helpers::calculateStripeDirectChargeFlow($listed, 'GBP', 0, $rail);

                $this->assertGreaterThanOrEqual(
                    $listed,
                    $r['net_to_creator'],
                    "Creator short at £{$listed} on {$rail}"
                );
            }
        }
    }

    public function test_the_supporter_pays_the_listed_price_plus_the_advertised_rate(): void
    {
        $r = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');

        // ⚠️ CEIL, so a penny over is correct and a penny under is not. The rounding
        // always favours the creator.
        $this->assertGreaterThanOrEqual(112.00, $r['total_supporter_pays']);
        $this->assertLessThan(112.02, $r['total_supporter_pays']);
    }

    public function test_stripe_comes_out_of_the_fee_not_on_top_of_it(): void
    {
        // 🚨 THE WHOLE CHANGE, IN ONE ASSERTION. Under the legacy model the supporter
        // paid the platform's cut AND Stripe's; under all-in the advertised percentage
        // is the ceiling and Stripe is paid from inside it.
        $r = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');

        $this->assertEqualsWithDelta(
            $r['total_supporter_pays'] - $r['listed_price'],
            $r['stripe_fee'] + $r['platform_fee'],
            0.02,
            'The supporter fee must be exactly Stripe plus the platform take'
        );
    }

    public function test_there_is_no_pound_administration_fee(): void
    {
        // Client §2: "No separate £1 fee at launch."
        $r = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');

        $this->assertSame(0.0, (float) $r['admin_fee']);
    }

    public function test_there_is_no_second_fee_line(): void
    {
        // "All-in" means one number. A compliance line beside it is the thing the
        // client's plan removes.
        $r = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');

        $this->assertSame(0.0, (float) $r['compliance_fee']);
        $this->assertSame(0.0, (float) $r['compliance_fee_rate']);
    }

    /* -----------------------------------------------------------------
     | Rails
     | ----------------------------------------------------------------- */

    public function test_bank_is_cheaper_for_the_supporter_than_card(): void
    {
        // D2: a bank payment carries no card interchange, so it genuinely costs less —
        // and a supporter needs a reason to choose it.
        $card = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');
        $bank = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'bank');

        $this->assertLessThan($card['total_supporter_pays'], $bank['total_supporter_pays']);
    }

    /* -----------------------------------------------------------------
     | The floor
     | ----------------------------------------------------------------- */

    public function test_the_break_even_price_is_computed_not_asserted(): void
    {
        /*
         * 🚨 THE NUMBER THAT DECIDES WHETHER A HEADLINE RATE IS VIABLE. Stripe's fixed
         * component does not shrink with the sale, so below some price the percentage
         * cannot pay for itself. At 12% that is well under the platform's £4.99 floor;
         * at 9% it is ABOVE it, which is why the two are not interchangeable.
         */
        config(['payments.all_in.card' => 12]);
        $at12 = FeeModel::minimumSellable('card', 'GBP');

        config(['payments.all_in.card' => 9]);
        $at9 = FeeModel::minimumSellable('card', 'GBP');

        $this->assertLessThan(Helpers::MIN_PRICE_GBP, $at12, '12% must cover the minimum listing');
        $this->assertGreaterThan(Helpers::MIN_PRICE_GBP, $at9, '9% must be reported as NOT covering it');
    }

    public function test_the_minimum_priced_sale_still_leaves_the_platform_whole_at_the_configured_rate(): void
    {
        $r = Helpers::calculateStripeDirectChargeFlow(Helpers::MIN_PRICE_GBP, 'GBP', 0, 'card');

        $this->assertGreaterThanOrEqual(0, $r['platform_fee']);
        $this->assertGreaterThanOrEqual(Helpers::MIN_PRICE_GBP, $r['net_to_creator']);
    }

    public function test_the_configured_rate_covers_the_platforms_own_minimum_price(): void
    {
        /*
         * 🚨 THE GUARD THAT ACTUALLY PROTECTS SOMEBODY. Below the break-even price the
         * platform fee clamps at zero to keep Stripe's application fee legal — and the
         * CREATOR then receives less than they listed. Measured: at a 3% rate a £4.99
         * listing pays the creator £4.67. It is logged at error, but a log is not a
         * defence.
         *
         * This fails the build the moment a configured rate cannot cover the platform's
         * own £4.99 floor — which is exactly what 9% on card does today, and the reason
         * D1 is not a free choice between two numbers.
         */
        /*
         * ⚠️ READS THE SHIPPED CONFIG, NOT THIS CLASS'S FIXTURE. `setUp()` pins 12% so
         * the other tests are deterministic — but a guard that reads its own fixture is
         * testing the fixture. This one has to see whatever `config/payments.php`
         * actually ships, or it cannot fail when somebody changes it.
         */
        $shipped = require base_path('config/payments.php');
        config([
            'payments.all_in' => $shipped['all_in'],
            'payments.fixed_fee' => $shipped['fixed_fee'],
        ]);

        foreach (['card', 'bank'] as $rail) {
            $breakEven = FeeModel::minimumSellable($rail, 'GBP');

            $this->assertLessThanOrEqual(
                Helpers::MIN_PRICE_GBP,
                $breakEven,
                "The configured {$rail} rate does not cover the platform's minimum listing price: "
                ."it breaks even at £{$breakEven} against a £".Helpers::MIN_PRICE_GBP.' floor. '
                .'Either raise the rate, raise the minimum price, or turn the fixed fee on.'
            );

            $r = Helpers::calculateStripeDirectChargeFlow(Helpers::MIN_PRICE_GBP, 'GBP', 0, $rail);

            $this->assertGreaterThan(0, $r['platform_fee'], "{$rail} earns nothing at the minimum price");
            $this->assertGreaterThanOrEqual(Helpers::MIN_PRICE_GBP, $r['net_to_creator']);
        }
    }

    /* -----------------------------------------------------------------
     | Things that must not have moved
     | ----------------------------------------------------------------- */

    public function test_the_reserve_is_still_taken_off_the_creators_net(): void
    {
        // 🚨 House rule, older than this change and unaffected by it. A reserve computed
        // off the supporter's gross would over-withhold on every transaction.
        $r = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 10, 'card');

        $this->assertEqualsWithDelta(10.0, $r['reserve_amount'], 0.01);
        $this->assertNotEquals(
            round($r['total_supporter_pays'] * 0.10, 2),
            $r['reserve_amount'],
            'Reserve must not be a percentage of the supporter total'
        );
    }

    public function test_a_historic_charge_is_re_cost_on_the_model_that_priced_it(): void
    {
        /*
         * 🚨 Every row written before today was priced with the legacy markup. Re-costing
         * one under all-in would restate a fee nobody charged — so an override with no
         * `fee_model` means legacy, which is what every existing row is.
         */
        $r = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card', null, [
            'platform_rate' => 17,
            'compliance_rate' => 2,
            'stripe_rate' => 3.4,
            'stripe_fixed_fee' => 0.30,
        ]);

        $this->assertSame(FeeModel::MODEL_LEGACY, $r['fee_model']);
        $this->assertGreaterThan(125, $r['total_supporter_pays'], 'A legacy re-cost must reproduce the old, higher total');
    }

    public function test_an_all_in_charge_can_be_re_cost_as_all_in(): void
    {
        $r = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card', null, [
            'fee_model' => FeeModel::MODEL_ALL_IN,
            'supporter_rate' => 12,
            'stripe_rate' => 3.4,
            'stripe_fixed_fee' => 0.30,
        ]);

        $this->assertSame(FeeModel::MODEL_ALL_IN, $r['fee_model']);
        $this->assertEqualsWithDelta(112.01, $r['total_supporter_pays'], 0.02);
    }

    public function test_the_legacy_model_still_works_when_configured(): void
    {
        // The switch is an incident lever, not decoration — it must actually switch.
        config(['payments.model' => FeeModel::MODEL_LEGACY]);

        $r = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');

        $this->assertSame(FeeModel::MODEL_LEGACY, $r['fee_model']);
        $this->assertGreaterThan(125, $r['total_supporter_pays']);
    }

    public function test_a_bespoke_deal_sets_the_supporter_rate(): void
    {
        /*
         * 🚨 THE OVERRIDE COLUMN CHANGED MEANING, AND THIS IS WHERE THAT IS PROVED.
         * `creator_fee_overrides.platform_rate` was written for the legacy model, where
         * it meant "the platform's cut on top". Under all-in the platform's cut IS the
         * supporter's fee minus Stripe, so the same column is read as the creator's
         * all-in supporter rate — one number, one meaning, no second table.
         *
         * `CreatorFeeOverride{,Pricing}Test` cover the resolution mechanics against the
         * legacy model they were written for; this covers the shipping one.
         */
        $creator = User::factory()->create(['role' => 1]);

        CreatorFeeResolver::flushCache();

        DB::table('creator_fee_overrides')->insert([
            'user_id' => $creator->id,
            'platform_rate_card' => 8.0,
            'platform_rate_bank' => null,
            'effective_from' => now()->subDay(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        CreatorFeeResolver::flushCache();

        $standard = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');
        $bespoke = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card', $creator->id);

        // An 8% deal must charge this creator's supporters less than the standard 12%.
        $this->assertLessThan($standard['total_supporter_pays'], $bespoke['total_supporter_pays']);
        $this->assertEqualsWithDelta(108.00, $bespoke['total_supporter_pays'], 0.02);
        $this->assertSame(8.0, $bespoke['supporter_rate']);
        $this->assertSame('custom', $bespoke['fee_source']);

        // 🚨 And the creator is STILL whole — a discount comes out of the platform's
        // margin, never out of what the creator listed.
        $this->assertGreaterThanOrEqual(100, $bespoke['net_to_creator']);

        // ⚠️ A card-only deal must not silently reprice the bank rail.
        $bank = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'bank', $creator->id);
        $this->assertSame(9.0, $bank['supporter_rate']);
    }

    /* -----------------------------------------------------------------
     | The rate reaches the surfaces
     | ----------------------------------------------------------------- */

    public function test_the_rate_is_readable_without_knowing_where_it_is_stored(): void
    {
        // 🚨 This is what makes the headline number ONE value to change rather than an
        // eighteen-surface rewrite. Every fee figure on the site renders from here.
        config(['payments.all_in.card' => 12]);
        $this->assertSame('12%', FeeModel::describe('card')['rate_label']);

        config(['payments.all_in.card' => 9.5]);
        $this->assertSame('9.5%', FeeModel::describe('card')['rate_label']);
    }

    public function test_the_headline_never_advertises_a_rail_that_cannot_take_a_payment(): void
    {
        // Advertising "from 9%" while Pay by Bank is switched off is a price a supporter
        // cannot obtain — the same rule the client's plan applies to stablecoin.
        config(['payments.bank.enabled' => false]);
        $this->assertSame(12.0, FeeModel::lowestLiveRate());

        config(['payments.bank.enabled' => true]);
        $this->assertSame(9.0, FeeModel::lowestLiveRate());
    }

    public function test_a_fixed_fee_is_off_but_works_when_switched_on(): void
    {
        $off = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');

        config(['payments.fixed_fee.enabled' => true, 'payments.fixed_fee.amount_gbp' => 1]);
        $on = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');

        $this->assertEqualsWithDelta(1.00, $on['total_supporter_pays'] - $off['total_supporter_pays'], 0.02);
        $this->assertGreaterThanOrEqual(100, $on['net_to_creator']);
    }
}
