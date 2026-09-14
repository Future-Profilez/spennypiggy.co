<?php

namespace Tests\Feature;

use App\Helpers;
use App\Models\PlatformPricingVersion;
use App\Models\User;
use App\Services\Pricing\CreatorFeeResolver;
use App\Services\Pricing\FeeModel;
use App\Services\Pricing\PricingPreview;
use App\Services\Pricing\PricingResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Pricing published from the back office (11 Sep 2026, client §3).
 *
 * 🚨 THE THING UNDER TEST IS THAT `FeeModel` IS STILL THE ONE READ PATH. Every
 * assertion below goes through `FeeModel` or `Helpers::calculateStripeDirectChargeFlow`,
 * never through `PricingResolver` directly, because a caller being able to tell which
 * source answered is the failure this whole design exists to avoid.
 *
 * ⚠️ `AllInFeeModelTest` stays green unchanged, and that is deliberate: an EMPTY table
 * means "nothing has been published, config is the source", which is the state on the
 * day this deploys and the state in every test that does not publish a version.
 */
class PlatformPricingEngineTest extends TestCase
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

        PricingResolver::forget();
    }

    /** Publish a version straight into the table, the way the admin app does. */
    private function publish(array $attributes = []): PlatformPricingVersion
    {
        $version = new PlatformPricingVersion;

        $version->forceFill(array_merge([
            'label' => 'Test pricing',
            'kind' => PlatformPricingVersion::KIND_STANDARD,
            'fee_model' => FeeModel::MODEL_ALL_IN,
            'rate_card' => 12,
            'rate_bank' => 9,
            'fixed_fee_enabled' => false,
            'fixed_fee_gbp' => 0,
            'effective_at' => now()->subMinute(),
        ], $attributes))->save();

        PricingResolver::forget();

        return $version->refresh();
    }

    /* -----------------------------------------------------------------
     | The chain: database → config → default
     | ----------------------------------------------------------------- */

    public function test_config_prices_the_platform_while_nothing_is_published(): void
    {
        // ⚠️ THE CONTROL, and the most important test in the file. An empty table is
        // the state on deploy day and in every other suite; if this ever fails, the
        // whole existing test estate is being priced by something it never set.
        $this->assertSame(0, PlatformPricingVersion::count());
        $this->assertSame(12.0, FeeModel::supporterRate('card'));
        $this->assertSame(9.0, FeeModel::supporterRate('bank'));
    }

    public function test_a_published_version_overrides_the_configured_rate(): void
    {
        $this->publish(['rate_card' => 14, 'rate_bank' => 11]);

        $this->assertSame(14.0, FeeModel::supporterRate('card'));
        $this->assertSame(11.0, FeeModel::supporterRate('bank'));

        // And it reaches the arithmetic, not just the reader.
        $r = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');
        $this->assertEqualsWithDelta(114.00, $r['total_supporter_pays'], 0.02);
        $this->assertGreaterThanOrEqual(100, $r['net_to_creator']);
    }

    public function test_an_unreadable_pricing_table_still_prices_at_the_configured_rate(): void
    {
        /*
         * 🚨 FAILS OPEN, UPWARDS. A missing table, a half-run migration on one app, a
         * database blip mid-checkout — none of them may leave a checkout unable to
         * price itself. The worst acceptable outcome is the previous rate for one
         * transaction.
         */
        $this->publish(['rate_card' => 20]);
        Schema::drop('platform_pricing_versions');
        PricingResolver::forget();

        $this->assertSame(12.0, FeeModel::supporterRate('card'));
    }

    public function test_the_published_fixed_fee_is_read_the_same_way_as_the_rate(): void
    {
        $off = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');

        $this->publish(['fixed_fee_enabled' => true, 'fixed_fee_gbp' => 1]);

        $on = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card');

        $this->assertEqualsWithDelta(1.00, $on['total_supporter_pays'] - $off['total_supporter_pays'], 0.02);
        $this->assertGreaterThanOrEqual(100, $on['net_to_creator']);
    }

    /* -----------------------------------------------------------------
     | Effective dating
     | ----------------------------------------------------------------- */

    public function test_a_scheduled_version_prices_nothing_until_it_is_due(): void
    {
        $this->publish(['rate_card' => 12]);
        $this->publish(['label' => 'Next year', 'rate_card' => 18, 'effective_at' => now()->addDays(7)]);

        $this->assertSame(12.0, FeeModel::supporterRate('card'));
    }

    public function test_a_scheduled_rate_is_never_readable_from_a_public_surface(): void
    {
        /*
         * 🚨 CLIENT DIRECTION: "do not expose future pricing plans publicly."
         * `describe()` is the shared `fees` Inertia prop — landing pages, the comparison
         * page, help tokens, every creator form — so a future rate leaking into it is
         * published, not merely readable.
         */
        $this->publish(['rate_card' => 12]);
        $this->publish(['label' => 'Price rise', 'rate_card' => 18, 'effective_at' => now()->addDays(7)]);

        $described = FeeModel::describe('card');

        $this->assertSame('12%', $described['rate_label']);
        $this->assertSame(12.0, $described['rate']);
        $this->assertNotContains(18.0, $described, 'a scheduled rate reached the public fee payload');
        $this->assertStringNotContainsString('18', json_encode($described));
    }

    public function test_a_scheduled_version_takes_over_on_its_own_effective_date(): void
    {
        $this->publish(['rate_card' => 12]);
        $this->publish(['label' => 'Price rise', 'rate_card' => 18, 'effective_at' => now()->addHour()]);

        $this->travel(2)->hours();
        PricingResolver::forget();

        $this->assertSame(18.0, FeeModel::supporterRate('card'));
    }

    public function test_a_cancelled_version_never_prices_anything(): void
    {
        $this->publish(['rate_card' => 12]);
        $cancelled = $this->publish(['label' => 'Withdrawn', 'rate_card' => 30]);

        $cancelled->forceFill(['cancelled_at' => now()])->save();
        PricingResolver::forget();

        $this->assertSame(12.0, FeeModel::supporterRate('card'));
    }

    public function test_a_campaign_expires_and_the_version_underneath_it_resumes(): void
    {
        /*
         * ⚠️ No scheduler, no reinstate step, nothing to forget to switch back — the
         * campaign simply stops matching the resolution query and the version below it
         * becomes the newest match on the next read.
         */
        $this->publish(['label' => 'Standard', 'rate_card' => 12]);
        $this->publish([
            'label' => 'Launch week',
            'kind' => PlatformPricingVersion::KIND_CAMPAIGN,
            'rate_card' => 8,
            'ends_at' => now()->addDay(),
        ]);

        $this->assertSame(8.0, FeeModel::supporterRate('card'));

        $this->travel(2)->days();
        PricingResolver::forget();

        $this->assertSame(12.0, FeeModel::supporterRate('card'));
    }

    /* -----------------------------------------------------------------
     | Race safety and caching
     | ----------------------------------------------------------------- */

    public function test_one_request_can_never_price_a_charge_at_two_rates(): void
    {
        /*
         * 🚨 THE RACE-SAFETY ASSERTION. A charge asks `FeeModel` several times — price
         * preview, tier decision, the charge itself — and a scheduled version landing
         * between two of those calls would compute one transaction at two rates.
         *
         * ⚠️ The CACHE is cleared between the two reads and the memo deliberately is
         * not. Clearing both would prove nothing (the cache alone would pin the value
         * for 60 seconds and the test would pass with the memo removed); clearing
         * neither would prove nothing either.
         */
        $this->publish(['rate_card' => 12]);

        $first = FeeModel::supporterRate('card');

        DB::table('platform_pricing_versions')->insert([
            'label' => 'Landed mid-request',
            'kind' => PlatformPricingVersion::KIND_STANDARD,
            'fee_model' => FeeModel::MODEL_ALL_IN,
            'rate_card' => 20,
            'rate_bank' => 20,
            'fixed_fee_enabled' => 0,
            'fixed_fee_gbp' => 0,
            'effective_at' => now()->subSecond(),
            'grandfather_existing' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Cache::forget(PricingResolver::CACHE_KEY);

        $this->assertSame($first, FeeModel::supporterRate('card'),
            'the rate moved inside one request — a charge could be computed at two rates');
    }

    public function test_the_cache_entry_cannot_outlive_the_next_scheduled_change(): void
    {
        /*
         * A scheduled version becomes due with nobody pressing anything, so there is no
         * publish event to bust on. The entry has to expire by itself, exactly then —
         * never sit out the full standard window with a due rate behind it.
         */
        $this->publish(['rate_card' => 12]);
        $this->publish(['label' => 'Soon', 'rate_card' => 18, 'effective_at' => now()->addSeconds(10)]);

        FeeModel::supporterRate('card');
        $this->assertTrue(Cache::has(PricingResolver::CACHE_KEY));

        $this->travel(11)->seconds();

        $this->assertFalse(Cache::has(PricingResolver::CACHE_KEY),
            'the cached pricing outlived the moment the next version was due');
    }

    public function test_publishing_busts_the_cache_rather_than_waiting_out_a_ttl(): void
    {
        $this->publish(['rate_card' => 12]);
        FeeModel::supporterRate('card');

        // A publish calls forget(); the new rate is live on the very next read, with no
        // clock travel at all.
        $this->publish(['label' => 'Immediate', 'rate_card' => 15]);

        $this->assertSame(15.0, FeeModel::supporterRate('card'));
    }

    /* -----------------------------------------------------------------
     | Grandfathering
     | ----------------------------------------------------------------- */

    public function test_a_creator_who_predates_the_change_keeps_the_old_rate(): void
    {
        $old = $this->publish(['label' => 'Launch', 'rate_card' => 12]);

        $existing = User::factory()->create(['role' => 1, 'created_at' => now()->subYear()]);

        $this->publish([
            'label' => 'Price rise',
            'rate_card' => 18,
            'grandfather_existing' => true,
            'grandfathered_from_id' => $old->id,
        ]);

        $newcomer = User::factory()->create(['role' => 1, 'created_at' => now()]);

        $this->assertSame(12.0, FeeModel::supporterRate('card', $existing->id));
        $this->assertSame(18.0, FeeModel::supporterRate('card', $newcomer->id));

        // ⚠️ And the PUBLIC headline is the new rate — grandfathering is per creator,
        // never a thing a stranger can read off the platform's advertised price.
        $this->assertSame(18.0, FeeModel::supporterRate('card'));
    }

    public function test_a_grandfathered_rate_reaches_the_charge_not_just_the_reader(): void
    {
        $old = $this->publish(['label' => 'Launch', 'rate_card' => 12]);

        $existing = User::factory()->create(['role' => 1, 'created_at' => now()->subYear()]);

        $this->publish([
            'label' => 'Price rise',
            'rate_card' => 20,
            'grandfather_existing' => true,
            'grandfathered_from_id' => $old->id,
        ]);

        $r = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 0, 'card', $existing->id);

        $this->assertEqualsWithDelta(112.00, $r['total_supporter_pays'], 0.02);
        $this->assertGreaterThanOrEqual(100, $r['net_to_creator']);
    }

    public function test_a_bespoke_deal_beats_a_published_version(): void
    {
        /*
         * A negotiated rate is an agreement with a named person; a published version is
         * a platform price. The person wins — including over a campaign.
         */
        // ⚠️ Both rails moved off the configured 12/9, so the bank assertion below can
        // tell "fell through to the published version" from "fell through to config".
        $this->publish(['rate_card' => 18, 'rate_bank' => 11]);

        $creator = User::factory()->create(['role' => 1]);

        CreatorFeeResolver::flushCache();

        DB::table('creator_fee_overrides')->insert([
            'user_id' => $creator->id,
            'platform_rate_card' => 14.0,
            'platform_rate_bank' => null,
            'effective_from' => now()->subDay(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        CreatorFeeResolver::flushCache();

        $this->assertSame(14.0, FeeModel::supporterRate('card', $creator->id));
        // ⚠️ A card-only deal must not reprice the bank rail — that falls through to
        // the published version, not to config.
        $this->assertSame(11.0, FeeModel::supporterRate('bank', $creator->id));
    }

    /* -----------------------------------------------------------------
     | The preview calculator
     | ----------------------------------------------------------------- */

    public function test_the_preview_agrees_with_the_real_calculator(): void
    {
        /*
         * 🚨 THIS IS WHAT MAKES `PricingPreview` SAFE TO MIRROR INTO THE ADMIN APP.
         * The back office previews a rate before publishing it, and it has no copy of
         * `Helpers::calculateStripeDirectChargeFlow` — so the preview is proved equal to
         * the real calculator here, in the app that owns it, rather than hoped about.
         */
        $this->publish(['rate_card' => 12, 'rate_bank' => 9]);

        foreach ([4.99, 5, 7.50, 9.99, 10, 12.34, 49.99, 100, 249.99, 500, 1000, 10000] as $listed) {
            foreach (['card' => 12.0, 'bank' => 9.0] as $rail => $rate) {
                $profile = config("payments.fee_profiles.$rail");

                $real = Helpers::calculateStripeDirectChargeFlow($listed, 'GBP', 0, $rail);
                $preview = PricingPreview::transaction(
                    $listed,
                    $rate,
                    0.0,
                    (float) $profile['stripe_rate'],
                    (float) $profile['stripe_fixed_fee']
                );

                $this->assertEqualsWithDelta($real['total_supporter_pays'], $preview['total'], 0.005, "total at £{$listed} on {$rail}");
                $this->assertEqualsWithDelta($real['stripe_fee'], $preview['stripe_fee'], 0.005, "stripe fee at £{$listed} on {$rail}");
                $this->assertEqualsWithDelta($real['platform_fee'], $preview['platform_fee'], 0.005, "platform fee at £{$listed} on {$rail}");
                $this->assertEqualsWithDelta($real['net_to_creator'], $preview['net_to_creator'], 0.005, "net at £{$listed} on {$rail}");
            }
        }
    }

    public function test_the_preview_agrees_with_the_real_calculator_with_a_fixed_fee_on(): void
    {
        $this->publish(['rate_card' => 12, 'fixed_fee_enabled' => true, 'fixed_fee_gbp' => 1]);

        $profile = config('payments.fee_profiles.card');

        foreach ([4.99, 20, 100, 1000] as $listed) {
            $real = Helpers::calculateStripeDirectChargeFlow($listed, 'GBP', 0, 'card');
            $preview = PricingPreview::transaction($listed, 12.0, 1.0, (float) $profile['stripe_rate'], (float) $profile['stripe_fixed_fee']);

            $this->assertEqualsWithDelta($real['total_supporter_pays'], $preview['total'], 0.005, "total at £{$listed}");
            $this->assertEqualsWithDelta($real['net_to_creator'], $preview['net_to_creator'], 0.005, "net at £{$listed}");
        }
    }

    public function test_the_preview_break_even_matches_the_fee_models_own(): void
    {
        // `FeeModel::minimumSellable()` delegates to `PricingPreview::breakEven()`, so the
        // published figure and the publish-time guard cannot disagree.
        $this->publish(['rate_card' => 12]);

        $profile = config('payments.fee_profiles.card');

        $this->assertEqualsWithDelta(
            FeeModel::minimumSellable('card', 'GBP'),
            PricingPreview::breakEven(12.0, 0.0, (float) $profile['stripe_rate'], (float) $profile['stripe_fixed_fee']),
            0.005
        );
    }

    public function test_the_preview_minimum_matches_the_platform_minimum(): void
    {
        // `PricingPreview` carries its own copy of the floor only because the admin app
        // has no `Helpers::MIN_PRICE_GBP`. Pinned so the two cannot drift.
        $this->assertSame(Helpers::MIN_PRICE_GBP, PricingPreview::MIN_LISTING_GBP);
    }

    public function test_a_rate_that_cannot_cover_the_minimum_listing_is_refused(): void
    {
        /*
         * 🚨 THE BACK OFFICE MUST NOT BE A WAY ROUND THE BUILD GUARD.
         * `AllInFeeModelTest::test_the_configured_rate_covers_the_platforms_own_minimum_price`
         * fails the build on a configured rate that cannot cover £4.99. Once a rate can
         * be published from a screen, the same rule has to hold at publish time.
         */
        $profile = config('payments.fee_profiles.card');
        $stripeRate = (float) $profile['stripe_rate'];
        $stripeFixed = (float) $profile['stripe_fixed_fee'];

        $this->assertNull(PricingPreview::refuse('card', 12, 0, $stripeRate, $stripeFixed));

        $refusal = PricingPreview::refuse('card', 9, 0, $stripeRate, $stripeFixed);
        $this->assertIsString($refusal);
        $this->assertStringContainsString('5.67', $refusal);

        // A rate below the processing cost itself cannot cover it at any price.
        $this->assertStringContainsString('any price', (string) PricingPreview::refuse('card', 2, 0, $stripeRate, $stripeFixed));
    }

    public function test_a_loss_making_rate_really_does_shortchange_the_creator(): void
    {
        // ⚠️ The reason the refusal above is not merely tidy: below break-even the
        // platform fee clamps at zero to keep Stripe's application fee legal, and the
        // shortfall lands on the CREATOR.
        $this->publish(['rate_card' => 3]);

        $r = Helpers::calculateStripeDirectChargeFlow(Helpers::MIN_PRICE_GBP, 'GBP', 0, 'card');

        $this->assertLessThan(Helpers::MIN_PRICE_GBP, $r['net_to_creator']);
    }
}
