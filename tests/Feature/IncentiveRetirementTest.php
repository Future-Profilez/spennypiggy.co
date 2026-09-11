<?php

namespace Tests\Feature;

use App\Support\Incentives;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Four incentive schemes were retired on 11 September 2026 (client §6).
 *
 * 🚨 SWITCHED OFF, NEVER DELETED (client §4). The tables, the records and the history
 * stay, so a scheme can be switched back on rather than rebuilt — and so nobody who
 * already earned under one loses it.
 *
 * These are the rules that cost somebody real money if they break.
 */
class IncentiveRetirementTest extends TestCase
{
    use RefreshDatabase;

    /* -----------------------------------------------------------------
     | The rule that protects a creator who already qualified
     | ----------------------------------------------------------------- */

    public function test_the_payout_switch_outlives_the_scheme_switch(): void
    {
        /*
         * 🚨 THE MOST EXPENSIVE THING IN THIS FILE TO GET WRONG.
         *
         * A creator can have met a scheme's published condition and be waiting on the
         * payment. Closing the scheme must stop NEW qualifications and must NOT stop
         * the payer — otherwise somebody who earned a bonus simply never receives it,
         * and nothing errors, because from the code's point of view the scheme is
         * merely off.
         *
         * Two switches, and the second is deliberately not `&&`-ed to the first.
         */
        config([
            'founder_bonus.enabled' => false,
            'founder_bonus.payouts_enabled' => true,
            'growth_bonus.enabled' => false,
            'growth_bonus.payouts_enabled' => true,
            'fast_start_bonus.enabled' => false,
            'fast_start_bonus.payouts_enabled' => true,
        ]);

        $this->assertFalse(Incentives::founderEnabled(), 'the scheme is closed');
        $this->assertTrue(Incentives::founderPayoutsEnabled(), 'but honoured bonuses must still be paid');

        $this->assertFalse(Incentives::growthBonusEnabled());
        $this->assertTrue(Incentives::growthBonusPayoutsEnabled());

        $this->assertFalse(Incentives::fastStartEnabled());
        $this->assertTrue(Incentives::fastStartPayoutsEnabled());
    }

    public function test_closing_the_payer_is_a_separate_deliberate_act(): void
    {
        // It must be possible — the payer is switched off LAST, once the final honoured
        // bonus has gone out — but it must take its own decision to do it.
        config(['founder_bonus.enabled' => false, 'founder_bonus.payouts_enabled' => false]);

        $this->assertFalse(Incentives::founderPayoutsEnabled());
    }

    /* -----------------------------------------------------------------
     | What a visitor sees
     | ----------------------------------------------------------------- */

    public function test_a_retired_ad_landing_page_explains_itself_instead_of_404ing(): void
    {
        /*
         * 🚨 LIVE AD SPEND POINTS AT THIS EXACT URL. A 404 spends the click and tells
         * the visitor nothing — the platform already learned this on /giftstore, where
         * a header link sat above a kill-switched feature and every visitor who clicked
         * it got an error page.
         *
         * ⚠️ And the real page must NOT render: it advertises a bonus nobody can now
         * earn.
         */
        config(['founder_bonus.enabled' => false]);

        $this->get(route('creators.founder-bonus'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('ComingSoon'));
    }

    public function test_switching_it_back_on_restores_the_real_page(): void
    {
        // The whole reason nothing was deleted. A flag that cannot be un-flipped is a
        // deletion with extra steps.
        config(['founder_bonus.enabled' => true]);

        $this->get(route('creators.founder-bonus'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('creators/FounderBonus'));
    }

    /* -----------------------------------------------------------------
     | The published terms
     | ----------------------------------------------------------------- */

    public function test_a_closed_date_is_reported_only_once_the_scheme_is_actually_off(): void
    {
        /*
         * ⚠️ A closed date sitting on a scheme that is still switched ON is a
         * contradiction, and the LIVE scheme is the one to believe — the engine is
         * paying people. Reporting the date anyway would print "this programme is
         * closed" on the terms of a programme currently awarding money.
         */
        config(['founder_bonus.enabled' => true, 'founder_bonus.closed_on' => '2026-09-11']);
        $this->assertNull(Incentives::closedOn('founder_bonus'));

        config(['founder_bonus.enabled' => false]);
        $this->assertSame('2026-09-11', Incentives::closedOn('founder_bonus'));
    }

    public function test_an_unknown_scheme_never_invents_a_closed_date(): void
    {
        $this->assertNull(Incentives::closedOn('a_scheme_that_does_not_exist'));
    }

    public function test_published_terms_stay_reachable_after_the_scheme_closes(): void
    {
        /*
         * 🚨 A LEGAL PAGE MAY NOT VANISH. Anyone who agreed to these terms is entitled
         * to read what they agreed to, and a dead link in somebody's inbox is not an
         * acceptable answer. Closed and dated — never deleted, never silently rewritten.
         */
        config(['growth_bonus.enabled' => false, 'growth_bonus.closed_on' => '2026-09-11']);

        $this->get('/growth-bonus-terms')->assertOk();
    }
}
