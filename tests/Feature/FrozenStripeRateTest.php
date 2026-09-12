<?php

namespace Tests\Feature;

use App\Helpers;
use App\Models\FinancialTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The Stripe estimate a charge was grossed up from has to survive the write.
 *
 * 🚨 IT DID NOT, FOR A MONTH. `Helpers::feeRateColumns()` emits
 * `stripe_fee_rate` and `stripe_fixed_fee`, and not one of the four payment
 * models listed them in `$fillable` — so Eloquent dropped both on every
 * mass-assigned write. Measured 12 Sep 2026: **0 of 225 rows populated.**
 *
 * `storedFeeRates()` then read null and fell back to `LEGACY_CARD_STRIPE_RATE`
 * (2.9%), while the configured card estimate has been 3.4% since 11 Aug 2026 —
 * so every card sale since then is re-cost 0.5pp cheap, understating Stripe and
 * overstating the platform's own margin on the screens it reports margin from.
 *
 * ⚠️ The fallback is still CORRECT for a pre-11-Aug row, which is why it stays.
 */
class FrozenStripeRateTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 🚨 THE ONE THAT WOULD HAVE CAUGHT IT. A test that builds the array and
     * asserts its contents passes against this bug — the array was always right.
     * The fault was between the array and the database.
     */
    public function test_the_frozen_stripe_rate_actually_reaches_the_row(): void
    {
        $row = FinancialTransaction::create([
            'user_id' => User::factory()->create(['role' => 1])->id,
            'type' => 'income',
            'gross_amount' => 130.55,
            'net_amount' => 100,
            'currency' => 'GBP',
            'status' => 'completed',
            'transaction_date' => now(),
            ...Helpers::feeRateColumns([
                'platform_fee_rate' => 12.0,
                'compliance_fee_rate' => 0.0,
                'stripe_fee_rate' => 3.4,
                'stripe_fixed_fee' => 0.3,
                'fee_source' => 'standard',
            ]),
        ]);

        $stored = $row->fresh();

        $this->assertSame(3.4, (float) $stored->stripe_fee_rate, 'Mass assignment dropped the frozen rate.');
        $this->assertSame(0.3, (float) $stored->stripe_fixed_fee);
    }

    /**
     * ⚠️ A ROW THAT NEVER RECORDED ONE KEEPS THE LEGACY FALLBACK. Every row
     * written before 12 Sep 2026 is null here, and 2.9% is what the pre-11-Aug
     * ones were actually charged at. Reading config instead would restate them.
     */
    public function test_a_row_with_no_recorded_rate_still_falls_back(): void
    {
        $row = FinancialTransaction::create([
            'user_id' => User::factory()->create(['role' => 1])->id,
            'type' => 'income',
            'gross_amount' => 100,
            'net_amount' => 100,
            'currency' => 'GBP',
            'status' => 'completed',
            'transaction_date' => now(),
            'fee_profile' => 'card',
        ]);

        $rates = Helpers::storedFeeRates($row->fresh());

        $this->assertSame(
            Helpers::LEGACY_CARD_STRIPE_RATE,
            (float) $rates['stripe_rate'],
            'An unrecorded rate must stay on the legacy fallback, which is right for the rows that have none.'
        );
    }

    /** And a recorded rate is read back, not overridden by config. */
    public function test_a_recorded_rate_wins_over_the_fallback(): void
    {
        $row = FinancialTransaction::create([
            'user_id' => User::factory()->create(['role' => 1])->id,
            'type' => 'income',
            'gross_amount' => 130.55,
            'net_amount' => 100,
            'currency' => 'GBP',
            'status' => 'completed',
            'transaction_date' => now(),
            'fee_profile' => 'card',
            ...Helpers::feeRateColumns(['stripe_fee_rate' => 3.4, 'stripe_fixed_fee' => 0.3]),
        ]);

        $this->assertSame(3.4, (float) Helpers::storedFeeRates($row->fresh())['stripe_rate']);
    }
}
