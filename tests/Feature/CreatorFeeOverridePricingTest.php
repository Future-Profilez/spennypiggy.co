<?php

namespace Tests\Feature;

use App\Helpers;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\CreatorFeeOverride;
use App\Models\FinancialTransaction;
use App\Models\ProductOrderDetail;
use App\Models\RyeProductPayment;
use App\Models\User;
use App\Services\Pricing\CreatorFeeResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The behaviours that make a bespoke rate safe: what a supporter is quoted, what
 * a past transaction keeps, and the one thing the repricing job must never do.
 *
 * @see CreatorFeeOverrideTest for resolution and fallback
 */
class CreatorFeeOverridePricingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        CreatorFeeResolver::flushCache();

        config([
            'payments.fee_profiles.card.platform_rate' => 17.0,
            'payments.fee_profiles.card.compliance_rate' => 2.0,
            'payments.fee_profiles.bank.platform_rate' => 13.0,
            'payments.fee_profiles.bank.compliance_rate' => 2.0,
            'payments.enabled' => true,
        ]);
    }

    private function creator(): User
    {
        return User::factory()->create(['role' => 1, 'default_currency' => 'GBP']);
    }

    private function agree(User $creator, ?float $bank = 8.0, ?float $card = 12.0): CreatorFeeOverride
    {
        CreatorFeeResolver::flushCache();

        return CreatorFeeOverride::create([
            'user_id' => $creator->id,
            'platform_rate_bank' => $bank,
            'platform_rate_card' => $card,
            'effective_from' => now()->subDay(),
        ]);
    }

    /**
     * The mismatch this whole feature exists to prevent: the price a supporter is
     * QUOTED must equal the price they are CHARGED.
     */
    public function test_the_price_preview_matches_what_the_checkout_would_charge(): void
    {
        $creator = $this->creator();
        $this->agree($creator);

        $response = $this->postJson(route('payments.price-preview'), [
            'amount' => 100,
            'currency' => 'GBP',
            'creator_id' => $creator->id,
        ]);

        $response->assertOk();

        CreatorFeeResolver::flushCache();

        foreach (['card', 'bank'] as $profile) {
            $charge = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, $profile, $creator->id);

            $this->assertSame(
                (float) $charge['total_supporter_pays'],
                (float) $response->json("prices.$profile"),
                "preview and charge disagree on $profile"
            );
        }
    }

    /**
     * Without a creator the preview must be the standard quote — the endpoint is
     * public and is called from screens that have no creator context.
     */
    public function test_the_preview_without_a_creator_quotes_the_standard_price(): void
    {
        $creator = $this->creator();
        $this->agree($creator);

        $withCreator = $this->postJson(route('payments.price-preview'), [
            'amount' => 100, 'currency' => 'GBP', 'creator_id' => $creator->id,
        ])->json('prices.bank');

        $without = $this->postJson(route('payments.price-preview'), [
            'amount' => 100, 'currency' => 'GBP',
        ])->json('prices.bank');

        $this->assertLessThan($without, $withCreator);
    }

    /**
     * History immunity, end to end: a payment row keeps the rate it was charged
     * at, and re-costing it later reproduces the ORIGINAL figures even though the
     * creator's agreement has changed since.
     */
    public function test_a_recompute_reproduces_the_original_fees_after_the_deal_changes(): void
    {
        $creator = $this->creator();

        // Charged on standard rates.
        $atCharge = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card', $creator->id);
        $stored = Helpers::feeRateColumns($atCharge);

        $this->assertSame(17.0, $stored['platform_fee_rate']);
        $this->assertSame('standard', $stored['fee_source']);

        // The creator later negotiates a much lower rate.
        $this->agree($creator, bank: 4.0, card: 4.0);
        CreatorFeeResolver::flushCache();

        // A recompute path passes the STORED rates rather than resolving live.
        $row = (object) $stored;
        $recomputed = Helpers::calculateStripeDirectChargeFlow(
            100, 'GBP', 0, 'card', $creator->id, Helpers::storedFeeRates($row)
        );

        $this->assertSame($atCharge['total_supporter_pays'], $recomputed['total_supporter_pays']);
        $this->assertSame($atCharge['platform_fee'], $recomputed['platform_fee']);
        $this->assertSame(17.0, $recomputed['platform_fee_rate']);
    }

    /**
     * A row written before these columns existed re-costs at the rates that
     * priced it at the time — never at a rate agreed since, and never at a
     * config value that has moved since.
     *
     * ⚠️ This used to assert `storedFeeRates()` returned NULL for such a row.
     * It no longer does, and the change is deliberate: NULL meant "fall through
     * to config", and on 11 Aug 2026 the card Stripe estimate stopped being the
     * value that priced these rows (2.9% → 3.4%). Falling through would have
     * re-costed every pre-change transaction at the new estimate on the next
     * `finance:sync-transactions` run. The intent this test protects is
     * unchanged; only the mechanism is.
     */
    public function test_a_legacy_row_with_no_stored_rate_falls_back_to_the_rates_that_priced_it(): void
    {
        $creator = $this->creator();
        $this->agree($creator, bank: 4.0, card: 4.0);

        $legacy = (object) ['platform_fee_rate' => null, 'compliance_fee_rate' => null];
        $rates = Helpers::storedFeeRates($legacy);

        // The creator's bespoke 4% was agreed AFTER this row was charged and
        // must not reach back over it.
        $this->assertSame(17.0, $rates['platform_rate']);

        // And the Stripe estimate is the historical one, not today's.
        $this->assertSame(Helpers::LEGACY_CARD_STRIPE_RATE, $rates['stripe_rate']);

        $recomputed = Helpers::calculateStripeDirectChargeFlow(
            100, 'GBP', 0, 'card', null, $rates
        );

        $this->assertSame(17.0, $recomputed['platform_fee_rate']);
        $this->assertSame(129.71, $recomputed['total_supporter_pays'], 'a pre-change row must reproduce its original charge');
    }

    /**
     * 🚨 The rule the repricing job exists to enforce: a supporter's recurring
     * charge is never raised. A creator whose rate goes back UP leaves existing
     * subscribers exactly where they are.
     */
    public function test_the_repricing_job_grandfathers_a_subscriber_when_the_rate_goes_up(): void
    {
        $creator = $this->creator();
        $this->agree($creator, bank: 8.0, card: 12.0);

        $subscription = $this->subscriptionFor($creator, chargedPlatformRate: 4.0);

        $this->artisan('subscriptions:reprice-on-fee-change', ['--dry-run' => true])
            ->expectsOutputToContain('grandfathered 1')
            ->assertSuccessful();

        $this->assertSame(4.0, (float) $subscription->fresh()->platform_fee_rate);
    }

    public function test_the_repricing_job_leaves_a_subscriber_alone_when_nothing_changed(): void
    {
        $creator = $this->creator();
        $this->agree($creator, bank: 8.0, card: 12.0);

        $this->subscriptionFor($creator, chargedPlatformRate: 12.0);

        $this->artisan('subscriptions:reprice-on-fee-change', ['--dry-run' => true])
            ->expectsOutputToContain('unchanged 1')
            ->assertSuccessful();
    }

    /**
     * A reduction is what the job is for — and a dry run must change nothing.
     */
    public function test_the_repricing_job_reports_a_reduction_and_a_dry_run_writes_nothing(): void
    {
        $creator = $this->creator();
        $this->agree($creator, bank: 8.0, card: 12.0);

        $subscription = $this->subscriptionFor($creator, chargedPlatformRate: 17.0);
        $before = $subscription->total_paid;

        $this->artisan('subscriptions:reprice-on-fee-change', ['--dry-run' => true])
            ->expectsOutputToContain('Repriced 1')
            ->assertSuccessful();

        $subscription->refresh();
        $this->assertSame(17.0, (float) $subscription->platform_fee_rate);
        $this->assertEquals($before, $subscription->total_paid);
    }

    /**
     * A creator on standard pricing is never even examined — the job only ever
     * has work for someone with a live agreement.
     */
    public function test_a_creator_with_no_agreement_is_not_touched(): void
    {
        $creator = $this->creator();
        $this->subscriptionFor($creator, chargedPlatformRate: 17.0);

        $this->artisan('subscriptions:reprice-on-fee-change', ['--dry-run' => true])
            ->expectsOutputToContain('nothing to reprice')
            ->assertSuccessful();
    }

    /**
     * 🚨 The promise the entire pricing model rests on: the creator receives AT
     * LEAST the price they listed, on every rate, method and currency.
     *
     * This was NOT true before. Each component rounds independently — the
     * supporter total is CEILed, the Stripe and platform fees are rounded
     * half-up — so the parts could sum to one minor unit more than the whole.
     * 8 of these 288 combinations paid the creator a penny short, all of them
     * non-GBP (the £1 admin fee is currency-converted and rounds again). An
     * earlier GBP-only sweep reported it clean, which is how it survived.
     */
    public function test_the_creator_never_receives_less_than_the_listed_price(): void
    {
        $creator = $this->creator();
        $this->agree($creator, bank: 8.0, card: 12.0);

        $short = [];
        $checked = 0;

        foreach ([null, $creator->id] as $creatorId) {
            foreach (['card', 'bank'] as $profile) {
                // JPY is zero-decimal — its rounding behaves differently, and it
                // was among the currencies that came up short.
                foreach (['GBP', 'USD', 'EUR', 'JPY'] as $currency) {
                    foreach ([4.99, 15, 49.99, 100, 250, 999.99, 1000, 2500, 10000] as $price) {
                        foreach ([0, 20] as $vatPercent) {
                            $listed = round($price * (1 + $vatPercent / 100), 2);

                            $b = Helpers::calculateStripeDirectChargeFlow(
                                $listed, $currency, 0, $profile, $creatorId
                            );

                            $checked++;

                            if ((float) $b['net_to_creator'] < (float) $b['listed_price']) {
                                $short[] = sprintf(
                                    '%s/%s/%s listed=%s net=%s',
                                    $creatorId ? 'custom' : 'standard',
                                    $profile, $currency,
                                    $b['listed_price'], $b['net_to_creator']
                                );
                            }
                        }
                    }
                }
            }
        }

        $this->assertSame(288, $checked, 'the sweep did not cover what it claims to');
        $this->assertSame([], $short, 'creator paid less than the listed price: '.implode(' | ', $short));
    }

    /**
     * ⚠️ The shortfall comes off the PLATFORM's fee, never out of the supporter's
     * pocket. Covering it by charging a penny more would be a silent price rise
     * for every creator on standard pricing — the one thing the client said must
     * not change.
     */
    public function test_covering_the_shortfall_never_raises_the_supporter_price(): void
    {
        // The exact combination that used to pay a penny short.
        $b = Helpers::calculateStripeDirectChargeFlow(120, 'USD', 0, 'card');

        $this->assertGreaterThanOrEqual(120, (float) $b['net_to_creator']);

        // Known-good totals: unchanged by the shortfall guard.
        //
        // Card is 130.55 rather than 129.71 since 11 Aug 2026 — the Stripe
        // estimate was raised 2.9% → 3.4% so an international card can never
        // leave the creator short. Bank is untouched by that change.
        $this->assertSame(130.55, (float) Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card')['total_supporter_pays']);
        $this->assertSame(120.31, (float) Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'bank')['total_supporter_pays']);
    }

    /**
     * A live monthly bill subscription for a creator, charged at a given rate.
     */
    private function subscriptionFor(User $creator, float $chargedPlatformRate): BillPayment
    {
        $bill = Bills::create([
            'user_id' => $creator->id,
            'name' => 'Monthly content',
            'price' => 20,
            'currency' => 'GBP',
            'period' => 'monthly',
        ]);

        return BillPayment::create([
            'bills_id' => $bill->id,
            'user_id' => null,
            'guest_email' => 'supporter@example.com',
            'currency' => 'GBP',
            'amount' => 20,
            'total_paid' => 26.50,
            'status' => 'paid',
            'recurring_for' => 'continue',
            'recurring_type' => 'monthly',
            'stripe_id' => 'sub_'.uniqid(),
            'platform_fee_rate' => $chargedPlatformRate,
            'compliance_fee_rate' => 2.0,
            'fee_source' => $chargedPlatformRate === 17.0 ? 'standard' : 'custom',
        ]);
    }

    public function test_rye_product_payment_syncs_correctly_to_financial_transactions(): void
    {
        $creator = $this->creator();
        $supporter = User::factory()->create();

        // Create RyeProductPayment
        $payment = RyeProductPayment::create([
            'user_id' => $supporter->id,
            'currency' => 'GBP',
            'amount' => 100.00,
            'tax' => 20.31,
            'total_paid' => 120.31,
            'status' => 'succeeded',
        ]);

        // Create the corresponding ProductOrderDetail so sync can find the creator
        ProductOrderDetail::create([
            'order_id' => $payment->id,
            'creater_id' => $creator->id,
            'user_id' => $supporter->id,
            'session_id' => 'cs_test',
            'product_id' => 1,
        ]);

        // Run the sync command
        $this->artisan('finance:sync-transactions')
            ->assertSuccessful();

        $ft = FinancialTransaction::where('source_type', RyeProductPayment::class)
            ->where('source_id', $payment->id)
            ->first();

        $this->assertNotNull($ft);
        $this->assertEquals(120.31, (float) $ft->gross_amount);
        $this->assertEquals(20.31, (float) $ft->platform_fee);
        $this->assertEquals(100.00, (float) $ft->net_amount);
    }
}
