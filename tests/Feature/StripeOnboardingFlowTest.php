<?php

namespace Tests\Feature;

use App\Models\MonthlyCharge;
use App\Models\SocialLinks;
use App\Models\User;
use App\Services\CreatorJourneyService;
use App\Services\Stripe\StripeAccountState;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The creator's route from an approved profile to a live Stripe account.
 *
 * Every case here is a bug that was live: a journey CTA that always bounced with a
 * red toast, a subscription gate enforced on one screen and nowhere else, a rail
 * rendering a superseded step order beside a panel rendering the current one, and a
 * cached account state that told a creator who had just finished onboarding that
 * action was still required.
 */
class StripeOnboardingFlowTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'profile_status_lock' => 2,
            'stripe_details_submitted' => 0,
            'identity_status' => 0,
            'account_id' => null,
        ], $attributes));
    }

    /** `trialing` with no end date is the free period — status 2, payment-eligible. */
    private function cardOnFile(User $creator): MonthlyCharge
    {
        return MonthlyCharge::create([
            'user_id' => $creator->id,
            'uuid' => (string) Str::uuid(),
            'status' => 'trialing',
            'amount' => 8.99,
            'currency' => 'GBP',
        ]);
    }

    // ── The journey CTA ─────────────────────────────────────────────────────

    /**
     * The Connect step's CTA pointed at `stripe.connect`, which is the ACTION
     * endpoint: it needs a POST carrying `termaccept` and a country, so clicking
     * "Connect payouts" redirected straight back with an error every single time.
     */
    public function test_the_connect_step_cta_points_at_a_page_a_creator_can_open(): void
    {
        $route = CreatorJourneyService::STEPS['stripe']['route'];

        $this->assertSame('stripe.index', $route);

        $this->assertTrue(
            in_array('GET', app('router')->getRoutes()->getByName($route)->methods(), true),
            'The Connect CTA must resolve to a route a plain click can open.'
        );
    }

    /** Every step's CTA must resolve — a named route that does not exist throws in Ziggy. */
    public function test_every_journey_step_route_exists(): void
    {
        foreach (CreatorJourneyService::STEPS as $key => $step) {
            if (empty($step['route'])) {
                continue;
            }

            $this->assertNotNull(
                app('router')->getRoutes()->getByName($step['route']),
                "Step [$key] points at unknown route [{$step['route']}]."
            );
        }
    }

    // ── Step order ──────────────────────────────────────────────────────────

    /**
     * 🚨 CONNECT, THEN THE CARD (11 Sep 2026, client direction). The order has moved
     * twice: the card was step 3, then after review, and it is now LAST. Identity left
     * the journey entirely for the payout gate.
     */
    public function test_step_order_is_connect_then_card(): void
    {
        $order = array_keys(CreatorJourneyService::STEPS);

        $this->assertLessThan(array_search('subscription', $order, true), array_search('stripe', $order, true));
        $this->assertNotContains('identity', $order);
        $this->assertNotContains('review', $order);
    }

    /** The rail renders from this, so it must carry every step with its real state. */
    public function test_step_states_describe_the_whole_journey(): void
    {
        $creator = $this->creator();
        $this->cardOnFile($creator);

        $states = app(CreatorJourneyService::class)->stepStates($creator->fresh());

        $this->assertSame(array_keys(CreatorJourneyService::STEPS), array_column($states, 'key'));

        $byKey = collect($states)->keyBy('key');
        $this->assertTrue($byKey['subscription']['done']);
        $this->assertFalse($byKey['stripe']['done']);
    }

    /**
     * 🚨 NO STEP WAITS ON A PERSON ANY MORE (11 Sep 2026). This test asserted that a
     * submitted profile read as "with us" rather than "you're here" — the whole state
     * it described is gone: profiles approve themselves, and the two steps that could
     * wait (`review`, `identity`) have left the journey.
     *
     * What replaced it is the inverse guarantee, and it is the one worth pinning.
     */
    public function test_no_step_ever_waits_on_an_admin(): void
    {
        $creator = $this->creator([
            'avatar' => 'uuid',
            'avatar_approved' => 1,
            'bio' => 'Hello',
            'bio_approved' => 1,
        ]);

        SocialLinks::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'status' => SocialLinks::STATUS_APPROVED,
            'instagram' => 'ben_lewis',
        ]);

        foreach (app(CreatorJourneyService::class)->stepStates($creator->fresh()) as $state) {
            $this->assertFalse(
                $state['awaiting_review'] ?? false,
                "Step {$state['key']} reports that it is waiting on an admin."
            );
        }
    }

    // ── The subscription gate ───────────────────────────────────────────────

    /**
     * 🚨 THE CARD NO LONGER GATES CONNECT (11 Sep 2026). It is the LAST step, so a
     * gate sending a creator from Connect back to the card page is a deadlock — the
     * journey points at Connect and Connect points back. `subscriptionGate()` was
     * deleted; this asserts it stays deleted.
     */
    public function test_a_creator_with_no_card_reaches_the_connect_page(): void
    {
        $creator = $this->creator(['profile_status_lock' => 2]);

        $this->actingAs($creator)->get('/stripe/authorize')->assertOk();

        $source = (string) file_get_contents(app_path('Http/Controllers/Auth/StripeController.php'));
        $this->assertStringNotContainsString('$this->subscriptionGate(', $source);
    }

    public function test_a_creator_with_a_card_reaches_the_connect_page(): void
    {
        $creator = $this->creator();
        $this->cardOnFile($creator);

        $this->actingAs($creator->fresh())
            ->get('/stripe/authorize')
            ->assertOk();
    }

    /**
     * ⚠️ The most important case here. A creator who was already mid-onboarding
     * when this rule shipped must never be stranded with an account they cannot
     * finish — so the gate applies ONLY while `account_id` is empty.
     */
    public function test_an_existing_account_is_never_blocked_by_the_new_card_rule(): void
    {
        $creator = $this->creator(['account_id' => 'acct_test_existing']);

        $response = $this->actingAs($creator)->get('/stripe/authorize');

        $this->assertNotSame(
            route('activate-subscription'),
            $response->headers->get('Location'),
            'A creator with a Stripe account must not be sent to add a card.'
        );
        $response->assertOk();
    }

    /**
     * The page tells the frontend to collapse to a single resume action. Country is
     * fixed at account creation, so re-asking for it is a question with no effect —
     * and `initConnect` already skips the terms gate for an existing account.
     */
    public function test_the_connect_page_reports_an_existing_account_so_it_can_offer_resume(): void
    {
        $creator = $this->creator(['account_id' => 'acct_test_existing', 'country' => 'GB']);

        $this->actingAs($creator)
            ->get('/stripe/authorize')
            ->assertInertia(fn ($page) => $page
                ->component('stripe/Stripe')
                ->where('has_account', true)
                ->where('account_country', 'GB')
                ->has('journey_steps')
            );
    }

    // ── The cached account state ────────────────────────────────────────────

    /**
     * The five-minute cache was never invalidated anywhere — `connectReturn()`
     * carried the forget calls commented out — so a creator who had just finished
     * onboarding was told for another five minutes that action was required.
     */
    public function test_forget_drops_the_cached_account_state(): void
    {
        $key = StripeAccountState::cacheKey('acct_test_123');
        Cache::put($key, [false, true, []], 300);

        StripeAccountState::forget('acct_test_123');

        $this->assertFalse(Cache::has($key));
    }

    /** A null account id is a no-op, never an error — the webhook passes it blind. */
    public function test_forget_tolerates_a_missing_account_id(): void
    {
        StripeAccountState::forget(null);
        StripeAccountState::forget('');

        $this->assertTrue(true);
    }

    /** No account means no Stripe call at all, and never a cached entry. */
    public function test_a_creator_with_no_account_reads_no_state(): void
    {
        $creator = $this->creator();

        $this->assertSame([false, false, []], StripeAccountState::for($creator));
    }
}
