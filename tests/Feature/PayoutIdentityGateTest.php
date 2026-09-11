<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\CreatorJourneyService;
use App\Support\IdentityCheckState;
use App\Support\PayoutEligibility;
use App\Support\PayoutIdentityGatePayload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Identity is a PAYOUT gate, not an onboarding step (10 Sep 2026, client direction).
 *
 * A creator builds, publishes and sells with no ID check. They cannot be PAID until
 * Stripe passes the document AND an admin signs it off.
 *
 * 🚨 THE SOURCE SCAN IS THE MOST IMPORTANT TEST IN HERE. Six separate jobs move money
 * out of this platform and none of them shares a caller with the others. A per-path
 * behaviour test proves the paths that exist today; only the scan catches the SEVENTH
 * one somebody adds next month by copying an existing job and not the gate — which is
 * exactly how a control like this rots.
 */
class PayoutIdentityGateTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
            'identity_status' => 0,
            'identity_admin_status' => 0,
            'identity_verified_at' => null,
        ], $overrides));
    }

    /* -----------------------------------------------------------------
     | Who may be paid
     | ----------------------------------------------------------------- */

    public function test_stripe_alone_is_not_enough(): void
    {
        // ⚠️ The window has its own tests below. Without closing it here, a creator
        // verified "now" falls inside the shipped cutoff and this passes for the
        // wrong reason — which is exactly how a gate gets certified as working.
        config(['payout_identity.grandfather_verified_before' => null]);

        // 🚨 The whole reason the human sign-off exists: Stripe proves the DOCUMENT is
        // real and matches the selfie. It cannot prove the holder is the person whose
        // profile it is, which is what somebody using another person's ID relies on.
        $creator = $this->creator([
            'identity_status' => PayoutEligibility::IDENTITY_VERIFIED,
            'identity_admin_status' => 0,
            'identity_verified_at' => now(),
        ]);

        $this->assertTrue(PayoutEligibility::blocksPayout($creator));
        $this->assertSame(PayoutEligibility::STATE_ADMIN_PENDING, PayoutEligibility::stateFor($creator));
    }

    public function test_both_together_are(): void
    {
        $creator = $this->creator([
            'identity_status' => PayoutEligibility::IDENTITY_VERIFIED,
            'identity_admin_status' => PayoutEligibility::ADMIN_APPROVED,
            'identity_verified_at' => now(),
        ]);

        $this->assertTrue(PayoutEligibility::identityComplete($creator));
        $this->assertSame(PayoutEligibility::STATE_COMPLETE, PayoutEligibility::stateFor($creator));
        $this->assertNull(PayoutEligibility::reasonFor($creator));
    }

    public function test_an_admin_sign_off_without_a_stripe_pass_is_worth_nothing(): void
    {
        config(['payout_identity.grandfather_verified_before' => null]);

        // Belt and braces against a stale column: 1 here with no Stripe verdict means
        // somebody approved a check that never happened.
        $creator = $this->creator([
            'identity_status' => 0,
            'identity_admin_status' => PayoutEligibility::ADMIN_APPROVED,
        ]);

        $this->assertTrue(PayoutEligibility::blocksPayout($creator));
    }

    /* -----------------------------------------------------------------
     | The grandfather window
     | ----------------------------------------------------------------- */

    public function test_a_creator_verified_before_the_cutoff_is_not_stranded(): void
    {
        // 🚨 Until 4 Sep 2026 a Stripe pass auto-wrote the sign-off. Everyone verified
        // between that change and this one sits at admin-pending through no fault of
        // their own, and would otherwise stop being paid on the next Friday run.
        config(['payout_identity.grandfather_verified_before' => '2026-09-11 00:00:00']);

        $creator = $this->creator([
            'identity_status' => PayoutEligibility::IDENTITY_VERIFIED,
            'identity_admin_status' => 0,
            'identity_verified_at' => '2026-09-05 12:00:00',
        ]);

        $this->assertTrue(PayoutEligibility::identityComplete($creator));
    }

    public function test_a_creator_verified_after_the_cutoff_still_needs_a_person(): void
    {
        config(['payout_identity.grandfather_verified_before' => '2026-09-11 00:00:00']);

        $creator = $this->creator([
            'identity_status' => PayoutEligibility::IDENTITY_VERIFIED,
            'identity_admin_status' => 0,
            'identity_verified_at' => '2026-09-20 12:00:00',
        ]);

        $this->assertTrue(PayoutEligibility::blocksPayout($creator));
    }

    public function test_a_refusal_is_never_grandfathered(): void
    {
        // 🚨 A person looked and said no. A date cannot overrule that, however old it is.
        config(['payout_identity.grandfather_verified_before' => '2026-09-11 00:00:00']);

        $creator = $this->creator([
            'identity_status' => PayoutEligibility::IDENTITY_VERIFIED,
            'identity_admin_status' => PayoutEligibility::ADMIN_REJECTED,
            'identity_verified_at' => '2026-09-05 12:00:00',
        ]);

        $this->assertTrue(PayoutEligibility::blocksPayout($creator));
        $this->assertSame(PayoutEligibility::STATE_REJECTED, PayoutEligibility::stateFor($creator));
    }

    public function test_clearing_the_window_closes_it(): void
    {
        config(['payout_identity.grandfather_verified_before' => null]);

        $creator = $this->creator([
            'identity_status' => PayoutEligibility::IDENTITY_VERIFIED,
            'identity_admin_status' => 0,
            'identity_verified_at' => '2026-09-05 12:00:00',
        ]);

        $this->assertTrue(PayoutEligibility::blocksPayout($creator));
    }

    /* -----------------------------------------------------------------
     | The states a creator reads
     | ----------------------------------------------------------------- */

    public function test_an_abandoned_check_and_a_processing_one_read_differently(): void
    {
        $abandoned = $this->creator([
            'identity_status' => PayoutEligibility::IDENTITY_SESSION_OPEN,
            'identity_session_status' => IdentityCheckState::REQUIRES_INPUT,
        ]);

        $processing = $this->creator([
            'identity_status' => PayoutEligibility::IDENTITY_SESSION_OPEN,
            'identity_session_status' => IdentityCheckState::PROCESSING,
        ]);

        $this->assertSame(PayoutEligibility::STATE_UNFINISHED, PayoutEligibility::stateFor($abandoned));
        $this->assertSame(PayoutEligibility::STATE_PROCESSING, PayoutEligibility::stateFor($processing));

        // 🚨 Only the one the creator can move offers a button. A "verify" button on a
        // check already with Stripe buys a second billable check with the same answer.
        $this->assertNotNull(PayoutEligibility::copyFor(PayoutEligibility::STATE_UNFINISHED)['cta']);
        $this->assertNull(PayoutEligibility::copyFor(PayoutEligibility::STATE_PROCESSING)['cta']);
    }

    public function test_no_state_the_creator_cannot_move_offers_a_button(): void
    {
        foreach ([
            PayoutEligibility::STATE_PROCESSING,
            PayoutEligibility::STATE_ADMIN_PENDING,
            PayoutEligibility::STATE_REJECTED,
            PayoutEligibility::STATE_FLAGGED,
        ] as $state) {
            $copy = PayoutEligibility::copyFor($state);

            $this->assertNull($copy['cta'], "{$state} must not offer an action");
            $this->assertNull($copy['route'], "{$state} must not carry a route");
        }
    }

    public function test_the_admin_pending_copy_does_not_blame_the_creator(): void
    {
        // 🚨 The only state where the delay is OURS. Telling them their check "is being
        // processed" is false — it passed — and telling them to verify again sends them
        // to pay for a second check.
        $body = strtolower(PayoutEligibility::copyFor(PayoutEligibility::STATE_ADMIN_PENDING)['body']);

        $this->assertStringContainsString('you do not need to do anything', $body);
    }

    /* -----------------------------------------------------------------
     | The payout page panel
     | ----------------------------------------------------------------- */

    public function test_a_creator_with_no_earnings_is_told_nothing(): void
    {
        // 🚨 Client rule. Nothing is waiting, so there is nothing to unlock, and asking
        // somebody to photograph a passport for no reason reads as a demand.
        $creator = $this->creator();

        $this->assertNull(
            PayoutIdentityGatePayload::for($creator, 0.0, 0.0, 'GBP', now()->toDateTimeString())
        );
    }

    public function test_a_creator_with_money_waiting_is(): void
    {
        $creator = $this->creator();

        $gate = PayoutIdentityGatePayload::for($creator, 240.0, 0.0, 'GBP', '2026-09-18 10:00:00');

        $this->assertNotNull($gate);
        $this->assertSame(PayoutEligibility::STATE_NONE, $gate['state']);
        $this->assertSame(240.0, $gate['held_total']);
        $this->assertNotNull($gate['cta']);
    }

    public function test_held_reserves_alone_count_as_earnings(): void
    {
        // ⚠️ A creator whose whole balance sits in a held reserve has unquestionably
        // earned — and the reserve release is a payout this same gate stops, so going
        // quiet here would silence exactly the creator whose money is furthest away.
        $creator = $this->creator();

        $gate = PayoutIdentityGatePayload::for($creator, 0.0, 90.0, 'GBP', null);

        $this->assertNotNull($gate);
        $this->assertSame(90.0, $gate['held_total']);
    }

    public function test_a_verified_creator_gets_no_panel_however_much_is_waiting(): void
    {
        // 🚨 The page renders on this prop's presence. An always-sent object is one
        // truthiness slip away from telling every verified creator they are unverified.
        $creator = $this->creator([
            'identity_status' => PayoutEligibility::IDENTITY_VERIFIED,
            'identity_admin_status' => PayoutEligibility::ADMIN_APPROVED,
            'identity_verified_at' => now(),
        ]);

        $this->assertNull(
            PayoutIdentityGatePayload::for($creator, 5000.0, 1000.0, 'GBP', null)
        );
    }

    public function test_a_fan_never_sees_it(): void
    {
        $fan = $this->creator(['role' => 0]);

        $this->assertNull(
            PayoutIdentityGatePayload::for($fan, 100.0, 0.0, 'GBP', null)
        );
    }

    public function test_only_a_refusal_carries_a_reason(): void
    {
        $rejected = $this->creator([
            'identity_status' => PayoutEligibility::IDENTITY_VERIFIED,
            'identity_admin_status' => PayoutEligibility::ADMIN_REJECTED,
            'identity_verified_at' => now(),
            'identity_verification_error' => 'The photo did not match your profile.',
        ]);

        $none = $this->creator(['identity_verification_error' => 'stale text from a past check']);

        $this->assertSame(
            'The photo did not match your profile.',
            PayoutIdentityGatePayload::for($rejected, 10.0, 0.0, 'GBP', null)['reason']
        );

        // ⚠️ A leftover error string must not be shown beside a state nobody decided.
        $this->assertNull(
            PayoutIdentityGatePayload::for($none, 10.0, 0.0, 'GBP', null)['reason']
        );
    }

    /* -----------------------------------------------------------------
     | The gate is off the listing path
     | ----------------------------------------------------------------- */

    public function test_no_route_carries_the_old_listing_gate(): void
    {
        // 🚨 The point of the change: a creator lists and sells with no ID check. A
        // middleware re-added to any create route puts the friction straight back.
        $routes = collect(app('router')->getRoutes())
            // ⚠️ `middleware()`, NOT `gatherMiddleware()`: the latter instantiates each
            // route's controller to collect its middleware, and one of this app's test
            // controllers throws on construction. What we are asserting is what the
            // route file declares, which is what `middleware()` returns.
            ->filter(fn ($r) => in_array('identityBeforeListing', (array) $r->middleware(), true))
            ->map(fn ($r) => $r->uri())
            ->all();

        $this->assertSame([], $routes, 'A listing route still carries an identity gate.');
    }

    /**
     * 🚨 THE SAME GATE SURVIVED UNDER A DIFFERENT NAME, OVER A FAR BIGGER SURFACE.
     *
     * `identityBeforeListing` was deleted on 10 Sep 2026 and the test above pins it.
     * `mustCompletedStripeIdentity` (`CheckStripeIdentityVerification`) did the same
     * job and nothing pinned it — it wrapped 149 routes in `routes/auth.php` plus a
     * group in `web.php`, and its condition was EXACTLY the creator the change
     * declares legitimate: role 1, profile live, Stripe connected, card on file,
     * `identity_status != 1`. For them every one of those routes rendered
     * `Auth/StripeIdentity` instead of the page requested — including
     * `financial.dashboard`, the page that mounts `PayoutIdentityGate`, the panel
     * built to replace this gate. They could not reach the thing telling them
     * their money was waiting. Found by a read-only audit on 11 Sep 2026.
     *
     * Two assertions because neither alone is enough: a route could carry the alias
     * with the class deleted (a boot error), or the class could survive with no
     * route (a landmine for the next person to reach for it).
     */
    public function test_no_route_carries_the_old_identity_wall_and_its_class_is_gone(): void
    {
        $routes = collect(app('router')->getRoutes())
            ->filter(fn ($r) => in_array('mustCompletedStripeIdentity', (array) $r->middleware(), true))
            ->map(fn ($r) => $r->uri())
            ->all();

        $this->assertSame([], $routes, 'A route still carries the mustCompletedStripeIdentity wall.');

        $this->assertFalse(
            class_exists('App\\Http\\Middleware\\CheckStripeIdentityVerification'),
            'CheckStripeIdentityVerification still exists. Identity is a payout gate (PayoutEligibility), never a page wall.'
        );

        $this->assertArrayNotHasKey(
            'mustCompletedStripeIdentity',
            app('router')->getMiddleware(),
            'The mustCompletedStripeIdentity alias is still registered in the Kernel.'
        );
    }

    public function test_identity_is_not_a_journey_step(): void
    {
        $this->assertArrayNotHasKey('identity', CreatorJourneyService::STEPS);
        $this->assertNotContains('identity', CreatorJourneyService::SETUP_STEPS);
    }

    /* -----------------------------------------------------------------
     | The scan
     | ----------------------------------------------------------------- */

    public function test_every_payout_path_reads_the_gate(): void
    {
        /*
         * 🚨 SIX WAYS MONEY LEAVES THIS PLATFORM AND THEY SHARE NO CALLER. A gate on
         * five of them is decorative — the sixth pays an unverified creator in full.
         *
         * This is a SOURCE SCAN rather than six behaviour tests on purpose: reaching
         * several of these paths needs a live Stripe account, and what has to be pinned
         * is that the branch is still there at all. A seventh payout job written by
         * copying one of these is the failure this catches.
         */
        $paths = [
            'app/Services/Risk/PayoutService.php' => 'the weekly run',
            'app/Console/Commands/ReleaseReserves.php' => 'reserve release',
            'app/Jobs/ProcessFounderPayouts.php' => 'Founder payouts',
            'app/Jobs/ProcessFounderMonthlyBonuses.php' => 'Founder monthly bonuses',
            'app/Console/Commands/ProcessFastStartBonusPayouts.php' => 'Fast Start payouts',
            'app/Services/GrowthBonusService.php' => 'Growth Bonus release',
        ];

        foreach ($paths as $file => $what) {
            $source = file_get_contents(base_path($file));

            $this->assertNotFalse($source, "{$file} is missing — did {$what} move?");
            $this->assertStringContainsString(
                'PayoutEligibility::blocksPayout',
                $source,
                "{$what} ({$file}) does not check identity before paying. Every path that "
                .'moves money must call PayoutEligibility::blocksPayout().'
            );
        }

        /*
         * 🚨 THE SEVENTH PAYER. `growth-bonus:pay` (Phase 3, scheduled Fridays) is gated
         * TRANSITIVELY: it asks `GrowthBonusService::holdReasonFor()`, which is what calls
         * `PayoutEligibility`. The literal never appears in the payer, so the loop above
         * could not see it — and an audit on 11 Sep 2026 found that deleting the
         * `holdReasonFor` line left this suite green. Pin both ends of the chain.
         */
        $payer = file_get_contents(base_path('app/Console/Commands/ProcessGrowthBonusPayouts.php'));
        $this->assertNotFalse($payer);
        $this->assertStringContainsString('holdReasonFor(', $payer,
            'growth-bonus:pay no longer asks GrowthBonusService::holdReasonFor() — that call IS its identity gate.');
        $this->assertStringContainsString('PayoutEligibility::blocksPayout', file_get_contents(base_path('app/Services/GrowthBonusService.php')),
            'GrowthBonusService::holdReasonFor() no longer reads PayoutEligibility, so growth-bonus:pay is ungated.');
    }
}
