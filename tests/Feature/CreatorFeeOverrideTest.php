<?php

namespace Tests\Feature;

use App\Helpers;
use App\Models\CreatorFeeOverride;
use App\Models\User;
use App\Services\Pricing\CreatorFeeResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreatorFeeOverrideTest extends TestCase
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
        ]);
    }

    private function creator(): User
    {
        return User::factory()->create(['role' => 1]);
    }

    private function override(User $creator, array $attributes = []): CreatorFeeOverride
    {
        return CreatorFeeOverride::create(array_merge([
            'user_id' => $creator->id,
            'platform_rate_card' => 12.0,
            'platform_rate_bank' => 8.0,
            'effective_from' => now()->subDay(),
        ], $attributes));
    }

    /**
     * The load-bearing guarantee: standard pricing is untouched. A creator with
     * no agreement must price exactly as they did before this feature existed.
     */
    public function test_a_creator_with_no_override_prices_at_the_standard_config_rates(): void
    {
        $creator = $this->creator();

        foreach ([['card', 17.0], ['bank', 13.0]] as [$profile, $expected]) {
            $breakdown = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, $profile, $creator->id);

            $this->assertSame($expected, $breakdown['platform_fee_rate']);
            $this->assertSame(2.0, $breakdown['compliance_fee_rate']);
            $this->assertSame('standard', $breakdown['fee_source']);
            $this->assertNull($breakdown['fee_override_id']);
        }
    }

    /**
     * Passing no creator at all — what ~45 existing call sites do — must be
     * identical to passing a creator who has no deal.
     */
    public function test_omitting_the_creator_is_identical_to_a_standard_creator(): void
    {
        $creator = $this->creator();

        foreach (['card', 'bank'] as $profile) {
            foreach ([4.99, 15.00, 250.00, 10000.00] as $price) {
                $withoutCreator = Helpers::calculateStripeDirectChargeFlow($price, 'GBP', 0, $profile);
                $withCreator = Helpers::calculateStripeDirectChargeFlow($price, 'GBP', 0, $profile, $creator->id);

                $this->assertEquals($withoutCreator, $withCreator, "diverged at $profile/$price");
            }
        }
    }

    public function test_a_bespoke_rate_lowers_the_supporter_price_and_is_recorded(): void
    {
        $creator = $this->creator();
        $this->override($creator);

        $standard = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'bank');
        $bespoke = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'bank', $creator->id);

        $this->assertSame(8.0, $bespoke['platform_fee_rate']);
        $this->assertSame('custom', $bespoke['fee_source']);
        $this->assertNotNull($bespoke['fee_override_id']);

        // The creator still receives exactly the listed price — the reduction is
        // taken out of the platform's margin, not added to the creator's net.
        $this->assertLessThan($standard['total_supporter_pays'], $bespoke['total_supporter_pays']);
        $this->assertGreaterThanOrEqual(100, $bespoke['net_to_creator']);
    }

    /**
     * Card and bank are configured independently (client decision, 3 Aug 2026):
     * a deal on one method must not move the other.
     */
    public function test_a_bank_only_deal_leaves_card_on_the_standard_rate(): void
    {
        $creator = $this->creator();
        $this->override($creator, ['platform_rate_card' => null, 'platform_rate_bank' => 8.0]);

        $bank = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'bank', $creator->id);
        $card = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card', $creator->id);

        $this->assertSame(8.0, $bank['platform_fee_rate']);
        $this->assertSame('custom', $bank['fee_source']);

        $this->assertSame(17.0, $card['platform_fee_rate']);
        $this->assertSame('standard', $card['fee_source']);
    }

    /**
     * History immunity. This is what every recompute path relies on: given the
     * rates stored against a past transaction, it re-costs at those rates and
     * ignores whatever the creator's deal says today.
     */
    public function test_explicit_stored_rates_beat_the_creators_current_deal(): void
    {
        $creator = $this->creator();
        $this->override($creator, ['platform_rate_bank' => 8.0]);

        $historical = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'bank', $creator->id, [
            'platform_rate' => 13.0,
            'compliance_rate' => 2.0,
            'fee_source' => 'standard',
            'fee_override_id' => null,
        ]);

        $this->assertSame(13.0, $historical['platform_fee_rate']);
        $this->assertSame('standard', $historical['fee_source']);

        $atTodaysRate = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'bank');
        $this->assertSame($atTodaysRate['total_supporter_pays'], $historical['total_supporter_pays']);
    }

    public function test_an_ended_agreement_reverts_the_creator_to_standard_pricing(): void
    {
        $creator = $this->creator();
        $this->override($creator, ['effective_to' => now()->subHour()]);

        CreatorFeeResolver::flushCache();

        $breakdown = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'bank', $creator->id);

        $this->assertSame(13.0, $breakdown['platform_fee_rate']);
        $this->assertSame('standard', $breakdown['fee_source']);
    }

    public function test_a_future_agreement_is_not_applied_yet(): void
    {
        $creator = $this->creator();
        $this->override($creator, ['effective_from' => now()->addWeek()]);

        CreatorFeeResolver::flushCache();

        $this->assertSame(
            'standard',
            Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'bank', $creator->id)['fee_source']
        );
    }

    /**
     * A typo in the admin form must not be able to price a real charge.
     */
    public function test_an_out_of_range_rate_is_rejected_in_favour_of_the_standard_rate(): void
    {
        $creator = $this->creator();
        $this->override($creator, ['platform_rate_bank' => 250.0]);

        CreatorFeeResolver::flushCache();

        $breakdown = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'bank', $creator->id);

        $this->assertSame(13.0, $breakdown['platform_fee_rate']);
        $this->assertSame('standard', $breakdown['fee_source']);
    }

    public function test_the_latest_agreement_wins_when_a_deal_has_been_renegotiated(): void
    {
        $creator = $this->creator();
        $this->override($creator, ['platform_rate_bank' => 10.0, 'effective_to' => now()->subDay()]);
        $current = $this->override($creator, ['platform_rate_bank' => 8.0]);

        CreatorFeeResolver::flushCache();

        $breakdown = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'bank', $creator->id);

        $this->assertSame(8.0, $breakdown['platform_fee_rate']);
        $this->assertSame($current->id, $breakdown['fee_override_id']);
    }

    public function test_rates_for_reports_both_methods_for_display(): void
    {
        $creator = $this->creator();
        $this->override($creator);

        CreatorFeeResolver::flushCache();

        $rates = CreatorFeeResolver::ratesFor($creator->id);

        $this->assertTrue($rates['is_custom']);
        $this->assertSame(10.0, $rates['bank']['total_rate']);
        $this->assertSame(14.0, $rates['card']['total_rate']);
    }

    /**
     * Bonus eligibility is independent of pricing — a bespoke-rate creator is
     * still eligible unless a Super Admin says otherwise.
     */
    public function test_bonus_eligibility_defaults_to_true_and_is_not_tied_to_custom_pricing(): void
    {
        $creator = $this->creator();
        $this->override($creator);

        $this->assertTrue($creator->fresh()->isBonusEligible());

        $creator->forceFill(['bonus_scheme_eligible' => false])->save();

        $this->assertFalse($creator->fresh()->isBonusEligible());

        // Turning bonuses off must not have touched their pricing.
        CreatorFeeResolver::flushCache();
        $this->assertSame(
            'custom',
            Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'bank', $creator->id)['fee_source']
        );
    }
}
