<?php

namespace Tests\Feature;

use App\Helpers;
use App\Models\Currency;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The card Stripe estimate was raised 2.9% → 3.4% on 11 Aug 2026 so the creator
 * is never short on an international card.
 *
 * Two things have to hold, and the second is the one that bites silently:
 *
 *  1. The new estimate must actually cover Stripe's real international cost at
 *     every price point — otherwise the change achieved nothing.
 *  2. Raising it must not move a single historical figure. Every recompute path
 *     re-derives fees from a rate, and `finance:sync-transactions` rewrites
 *     `platform_fee` and `stripe_fee` on existing ledger rows every 30 minutes.
 *     Before the rate was frozen onto the row, this change would have restated
 *     the recorded fees on every past transaction on the next sync — with no
 *     error, on the columns the admin revenue dashboards read.
 */
class StripeEstimateFreezeTest extends TestCase
{
    use RefreshDatabase;

    /** Stripe UK, at the time of writing. */
    private const REAL_UK = [0.015, 0.20];

    private const REAL_EEA = [0.025, 0.20];

    private const REAL_INTERNATIONAL = [0.0325, 0.20];

    protected function setUp(): void
    {
        parent::setUp();

        Currency::updateOrCreate(
            ['ISO' => 'GBP'],
            ['name' => 'Pound Sterling', 'conversion_rate' => 1, 'ISOdigits' => 2, 'symbol' => '£']
        );
    }

    /** A bare object standing in for a payment row. */
    private function row(array $attributes): object
    {
        return (object) array_merge([
            'fee_profile' => 'card',
            'platform_fee_rate' => null,
            'compliance_fee_rate' => null,
            'stripe_fee_rate' => null,
            'stripe_fixed_fee' => null,
            'fee_source' => null,
            'fee_override_id' => null,
        ], $attributes);
    }

    public static function pricePoints(): array
    {
        return [
            'floor' => [4.99],
            'small' => [25.0],
            'typical' => [100.0],
            'large' => [500.0],
            'card ceiling' => [1000.0],
        ];
    }

    /**
     * @dataProvider pricePoints
     */
    public function test_the_new_estimate_covers_an_international_card(float $listed): void
    {
        $breakdown = Helpers::calculateStripeDirectChargeFlow($listed, 'GBP');
        $charged = $breakdown['total_supporter_pays'];

        [$rate, $fixed] = self::REAL_INTERNATIONAL;
        $realFee = round($charged * $rate + $fixed, 2);

        // What the creator actually receives once Stripe takes its real cut and
        // we take the application fee we already fixed at charge time.
        $creatorNet = round($charged - $realFee - $breakdown['application_fee'], 2);

        $this->assertGreaterThanOrEqual(
            $listed,
            $creatorNet,
            "creator was short on an international card at £{$listed}: received £{$creatorNet}"
        );
    }

    /**
     * @dataProvider pricePoints
     */
    public function test_uk_and_eea_cards_remain_comfortably_covered(float $listed): void
    {
        $breakdown = Helpers::calculateStripeDirectChargeFlow($listed, 'GBP');
        $charged = $breakdown['total_supporter_pays'];

        foreach ([self::REAL_UK, self::REAL_EEA] as $real) {
            [$rate, $fixed] = $real;
            $creatorNet = round($charged - round($charged * $rate + $fixed, 2) - $breakdown['application_fee'], 2);

            $this->assertGreaterThanOrEqual($listed, $creatorNet);
        }
    }

    public function test_the_estimate_is_recorded_on_the_charge(): void
    {
        $breakdown = Helpers::calculateStripeDirectChargeFlow(100, 'GBP');
        $columns = Helpers::feeRateColumns($breakdown);

        $this->assertSame(3.4, $columns['stripe_fee_rate']);
        $this->assertSame(0.3, $columns['stripe_fixed_fee']);
    }

    /**
     * 🚨 The one that matters. A row priced before the change must still be
     * costed at 2.9% + 30p when anything recomputes it.
     */
    public function test_a_row_priced_before_the_change_is_not_re_costed(): void
    {
        $legacy = Helpers::calculateStripeDirectChargeFlow(
            100,
            'GBP',
            0,
            'card',
            null,
            ['stripe_rate' => 2.9, 'stripe_fixed_fee' => 0.30, 'platform_rate' => 17, 'compliance_rate' => 2]
        );

        $this->assertSame(129.71, $legacy['total_supporter_pays'], 'the historical charge must reproduce exactly');
        $this->assertSame(4.06, $legacy['stripe_fee']);
    }

    public function test_a_legacy_row_with_no_stored_rate_still_uses_the_old_estimate(): void
    {
        // This is the real shape of every row written before 11 Aug 2026:
        // no stored Stripe rate at all. Reading today's config here is exactly
        // the silent restatement this whole change exists to prevent.
        $rates = Helpers::storedFeeRates($this->row(['fee_profile' => 'card']));

        $this->assertSame(Helpers::LEGACY_CARD_STRIPE_RATE, $rates['stripe_rate']);
        $this->assertSame(Helpers::LEGACY_CARD_STRIPE_FIXED_FEE, $rates['stripe_fixed_fee']);

        $recomputed = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card', null, $rates);
        $this->assertSame(129.71, $recomputed['total_supporter_pays']);
    }

    public function test_a_legacy_bank_row_keeps_the_bank_estimate_not_the_card_one(): void
    {
        // The bank estimate did not change, so its config value IS its history —
        // but a card fallback applied to a bank row would re-price it wrongly in
        // the other direction.
        $rates = Helpers::storedFeeRates($this->row(['fee_profile' => 'bank']));

        $this->assertSame(0.8, $rates['stripe_rate']);
        $this->assertSame(13.0, $rates['platform_rate']);

        $recomputed = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'bank', null, $rates);
        $this->assertSame(120.31, $recomputed['total_supporter_pays']);
    }

    public function test_a_row_missing_the_columns_entirely_does_not_fatal(): void
    {
        // ⚠️ Not the same as a NULL column. An Eloquent model answers null for a
        // column it did not select, but a plain object — which several recompute
        // paths pass — raises "Undefined property" and takes the whole payout or
        // sync run down partway through. Caught by the suite, not by review.
        $rates = Helpers::storedFeeRates((object) ['platform_fee_rate' => null]);

        $this->assertSame(Helpers::LEGACY_CARD_STRIPE_RATE, $rates['stripe_rate']);
        $this->assertSame(17.0, $rates['platform_rate']);
    }

    public function test_a_stored_rate_always_beats_the_fallback(): void
    {
        $rates = Helpers::storedFeeRates($this->row([
            'stripe_fee_rate' => 1.75,
            'stripe_fixed_fee' => 0.10,
        ]));

        $this->assertSame(1.75, $rates['stripe_rate']);
        $this->assertSame(0.10, $rates['stripe_fixed_fee']);
    }

    public function test_a_bespoke_platform_rate_is_still_honoured_alongside_the_new_estimate(): void
    {
        $rates = Helpers::storedFeeRates($this->row([
            'platform_fee_rate' => 8,
            'compliance_fee_rate' => 2,
            'stripe_fee_rate' => 3.4,
            'stripe_fixed_fee' => 0.30,
            'fee_source' => 'custom',
        ]));

        $breakdown = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card', null, $rates);

        $this->assertSame(8.0, $breakdown['platform_fee_rate']);
        $this->assertSame('custom', $breakdown['fee_source']);
        $this->assertGreaterThanOrEqual(100, $breakdown['net_to_creator']);
    }

    public function test_the_rate_survives_a_round_trip_through_stripe_metadata(): void
    {
        // The redirect handler and the webhook race for every payment; the rate
        // travels in the session metadata so whichever wins records the same one.
        $breakdown = Helpers::calculateStripeDirectChargeFlow(100, 'GBP');
        $metadata = Helpers::feeRateColumns($breakdown);

        $readBack = Helpers::feeRateColumnsFromMetadata($metadata);

        $this->assertSame(3.4, $readBack['stripe_fee_rate']);
        $this->assertSame(0.3, $readBack['stripe_fixed_fee']);
    }

    public function test_the_supporter_price_moved_by_the_expected_amount(): void
    {
        // Stated so a change to either rate cannot quietly move the published
        // figures without this failing.
        $this->assertSame(130.55, Helpers::calculateStripeDirectChargeFlow(100, 'GBP')['total_supporter_pays']);
        $this->assertSame(8.11, Helpers::calculateStripeDirectChargeFlow(4.99, 'GBP')['total_supporter_pays']);
        $this->assertSame(646.01, Helpers::calculateStripeDirectChargeFlow(500, 'GBP')['total_supporter_pays']);
    }
}
