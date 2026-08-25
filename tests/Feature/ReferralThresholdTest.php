<?php

namespace Tests\Feature;

use App\Models\CreatorReferral;
use App\Services\PromoBannerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * 🚨 ONE THRESHOLD, FOUR AUDIENCES.
 *
 * `config('referral.qualifying_gmv')` decides whether a creator is paid the
 * referral reward or nothing. Until 23 Aug 2026 the number `1000` was written
 * out by hand in five places: the qualification short-cut in `Helpers`, the
 * progress bar on the referral page, both counting queries in
 * `ReferAndEarnController`, and the figure the promo deck prints to every
 * creator on the platform.
 *
 * Four of those are READ BY THE PERSON BEING PAID and one is what actually pays
 * them. A drift between them does not fail — it promises a creator money at a
 * number the payout query does not agree with, which is the one referral bug
 * that reaches a real person's bank balance.
 */
class ReferralThresholdTest extends TestCase
{
    use RefreshDatabase;

    private function referralAt(float $gmv): CreatorReferral
    {
        return new CreatorReferral(['lifetime_gmv' => $gmv]);
    }

    /**
     * ⚠️ Read the promo through the PUBLIC deck, exactly as the page does —
     * `facts()` is private, and reaching past it with reflection would prove the
     * builder agrees with config while saying nothing about what a creator is
     * actually shown. ⚠️ The deck is cached per viewer, so flush first.
     */
    private function referralFacts(): array
    {
        Cache::flush();

        $deck = app(PromoBannerService::class)->for(null)['banners'];

        return collect($deck)->firstWhere('key', 'refer_and_earn')['facts'];
    }

    public function test_the_progress_bar_fills_exactly_at_the_configured_threshold(): void
    {
        config(['referral.qualifying_gmv' => 1000]);

        $this->assertSame(0.0, $this->referralAt(0)->progressPercentage());
        $this->assertSame(50.0, $this->referralAt(500)->progressPercentage());
        $this->assertSame(100.0, $this->referralAt(1000)->progressPercentage());
    }

    /**
     * 🚨 THE ASSERTION THAT MATTERS: move the threshold and everything that
     * quotes it moves with it. A test that only checked today's 1,000 would
     * pass just as happily with five hardcoded copies of it.
     */
    public function test_moving_the_threshold_moves_the_bar_and_the_promo_together(): void
    {
        config(['referral.qualifying_gmv' => 2500]);

        // The bar is no longer full at the old number.
        $this->assertSame(40.0, $this->referralAt(1000)->progressPercentage());
        $this->assertSame(100.0, $this->referralAt(2500)->progressPercentage());

        // And the promo card quotes the new one.
        $facts = $this->referralFacts();

        $this->assertStringContainsString(
            '2,500',
            $facts['threshold'],
            'The promo deck must quote the configured threshold, not a hardcoded figure.'
        );
    }

    /**
     * ⚠️ The reward is NEVER quoted without the threshold — a creator who is
     * shown "£50" alone shares their link, watches someone sign up, and is paid
     * nothing they can account for.
     */
    public function test_the_promo_never_states_the_reward_without_the_threshold(): void
    {
        $facts = $this->referralFacts();

        $this->assertNotEmpty($facts['reward']);
        $this->assertNotEmpty($facts['threshold']);
    }

    /**
     * ⚠️ A misconfigured zero must not divide by zero on a page a creator loads.
     */
    public function test_a_zero_threshold_reports_complete_rather_than_dividing_by_zero(): void
    {
        config(['referral.qualifying_gmv' => 0]);

        $this->assertSame(100.0, $this->referralAt(0)->progressPercentage());
    }
}
