<?php

namespace Tests\Feature;

use App\Models\EngagementNotification;
use App\Models\MonthlyCharge;
use App\Models\User;
use App\Services\NotificationDispatcher;
use App\Services\SubscriptionActivationService;
use App\Services\SubscriptionCheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A creator's card must not be lost because a browser redirect went missing.
 *
 * 🚨 Until this shipped, the ONLY thing that turned a `monthly_charges` row from
 * `initiated` into a card on file was Stripe's `success_url` reaching us. No
 * webhook, no sweep. A creator who saved their card and lost the redirect had the
 * card on Stripe and nothing here — permanently, silently, unable to sell.
 */
class SubscriptionCheckoutRecoveryTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
            'stripe_id' => 'cus_test123',
        ], $overrides));
    }

    private function startedCheckout(User $user, array $overrides = []): MonthlyCharge
    {
        return MonthlyCharge::create(array_merge([
            'user_id' => $user->id,
            'email' => $user->email,
            'currency' => 'GBP',
            'amount' => 8.99,
            'tax' => 1.80,
            'session_id' => 'cs_test_'.uniqid(),
            'status' => SubscriptionCheckoutService::STATUS_STARTED,
        ], $overrides));
    }

    /** A service whose only Stripe call is answered locally. */
    private function service(?string $paymentMethod): SubscriptionCheckoutService
    {
        return new class(app(SubscriptionActivationService::class), $paymentMethod) extends SubscriptionCheckoutService
        {
            public function __construct(SubscriptionActivationService $activation, private ?string $pm)
            {
                parent::__construct($activation);
            }

            protected function paymentMethodFor($session): ?string
            {
                return $this->pm;
            }
        };
    }

    /** ⚠️ Not `session()` — Laravel's TestCase already declares a public one. */
    private function stripeSession(array $overrides = []): object
    {
        return (object) array_merge([
            'id' => 'cs_test_x',
            'mode' => 'setup',
            'status' => 'complete',
            'payment_status' => 'no_payment_required',
            'setup_intent' => 'seti_test',
            'url' => 'https://checkout.stripe.com/c/pay/cs_test_x',
        ], $overrides);
    }

    /** The whole point: a completed setup session records the card. */
    public function test_a_completed_setup_session_records_the_card(): void
    {
        $user = $this->creator();
        $sub = $this->startedCheckout($user);

        $done = $this->service('pm_saved123')->completeSetupCheckout($sub, $this->stripeSession(), 'test');

        $this->assertTrue($done);

        $sub->refresh();
        $this->assertSame(SubscriptionCheckoutService::STATUS_CARD_ON_FILE, $sub->status);
        $this->assertSame('pm_saved123', $sub->stripe_payment_method);
        $this->assertSame(1, (int) $user->fresh()->is_subscribed);
    }

    /**
     * ⚠️ The redirect and the webhook arrive together by design. The claim is an
     * atomic UPDATE, so exactly one of them may complete the row — otherwise both
     * write, and the second sets a default card against a row the first has moved
     * past.
     */
    public function test_only_one_caller_can_complete_the_same_checkout(): void
    {
        $user = $this->creator();
        $sub = $this->startedCheckout($user);

        $first = $this->service('pm_first')->completeSetupCheckout($sub, $this->stripeSession(), 'redirect');
        $second = $this->service('pm_second')->completeSetupCheckout($sub->fresh(), $this->stripeSession(), 'webhook');

        $this->assertTrue($first);
        $this->assertFalse($second);
        $this->assertSame('pm_first', $sub->fresh()->stripe_payment_method);
    }

    /**
     * ⚠️ No card means the creator cannot be billed later. Marking the row as
     * "card on file" anyway would leave them selling for free with nothing to
     * charge — and would hide the failure from the retry that could fix it.
     */
    public function test_a_session_with_no_saved_card_leaves_the_row_open(): void
    {
        $user = $this->creator();
        $sub = $this->startedCheckout($user);

        $done = $this->service(null)->completeSetupCheckout($sub, $this->stripeSession(), 'test');

        $this->assertFalse($done);
        $this->assertSame(SubscriptionCheckoutService::STATUS_STARTED, $sub->fresh()->status);
        $this->assertNull($sub->fresh()->stripe_payment_method);
    }

    /** A row that already carries a card is never re-completed. */
    public function test_a_settled_row_is_left_alone(): void
    {
        $user = $this->creator();
        $sub = $this->startedCheckout($user, [
            'status' => SubscriptionCheckoutService::STATUS_CARD_ON_FILE,
            'stripe_payment_method' => 'pm_existing',
        ]);

        $done = $this->service('pm_new')->completeSetupCheckout($sub, $this->stripeSession(), 'test');

        $this->assertFalse($done);
        $this->assertSame('pm_existing', $sub->fresh()->stripe_payment_method);
    }

    /**
     * ⚠️ `handleCheckoutSessionExpired` used to touch the risk-ledger `Payment`
     * table and nothing else, so an abandoned subscription checkout sat at
     * `initiated` forever — long after the link inside it was dead.
     */
    public function test_a_dead_checkout_is_closed(): void
    {
        $user = $this->creator();
        $sub = $this->startedCheckout($user);

        $this->assertTrue($this->service(null)->markDead($sub, 'session_expired'));
        $this->assertSame(SubscriptionCheckoutService::STATUS_DEAD, $sub->fresh()->status);
    }

    /** Closing is a claim too: a second sweep must not re-close, or re-report. */
    public function test_closing_is_idempotent(): void
    {
        $user = $this->creator();
        $sub = $this->startedCheckout($user);
        $service = $this->service(null);

        $this->assertTrue($service->markDead($sub, 'first'));
        $this->assertFalse($service->markDead($sub->fresh(), 'second'));
    }

    /** ⚠️ A completed checkout must never be written off as dead. */
    public function test_a_completed_checkout_is_never_closed(): void
    {
        $user = $this->creator();
        $sub = $this->startedCheckout($user, [
            'status' => SubscriptionCheckoutService::STATUS_CARD_ON_FILE,
        ]);

        $this->assertFalse($this->service(null)->markDead($sub, 'sweep'));
        $this->assertSame(SubscriptionCheckoutService::STATUS_CARD_ON_FILE, $sub->fresh()->status);
    }

    /**
     * Matched on `session_id`, never on metadata: the sessions already open in
     * production carry theirs on the SetupIntent rather than the session, so a
     * metadata-only lookup would recover none of the creators currently stuck.
     */
    public function test_a_row_is_found_by_its_session_id(): void
    {
        $user = $this->creator();
        $sub = $this->startedCheckout($user, ['session_id' => 'cs_live_known']);
        $service = $this->service(null);

        $this->assertSame($sub->id, $service->rowForSession('cs_live_known')?->id);
        $this->assertNull($service->rowForSession('cs_live_someone_elses'));
        $this->assertNull($service->rowForSession(null));
    }

    /** The sweep only looks at checkouts that are actually unresolved. */
    public function test_the_sweep_only_examines_unresolved_checkouts(): void
    {
        $user = $this->creator();

        $this->startedCheckout($user, ['status' => SubscriptionCheckoutService::STATUS_CARD_ON_FILE]);
        $this->startedCheckout($user, ['status' => 'paid']);
        $this->startedCheckout($user, ['status' => SubscriptionCheckoutService::STATUS_DEAD]);
        // Unresolved, but with no session there is nothing to ask Stripe about.
        $this->startedCheckout($user, ['session_id' => null]);

        $this->artisan('subscription:reconcile-checkouts --dry-run')
            ->expectsOutputToContain('Examined 0')
            ->assertSuccessful();
    }

    /**
     * ⚠️ A brand-new checkout is left alone: the creator may still be on the Stripe
     * page, and the redirect should be given its chance to win first.
     */
    public function test_a_brand_new_checkout_is_not_swept(): void
    {
        $user = $this->creator();
        $this->startedCheckout($user);

        $this->artisan('subscription:reconcile-checkouts --dry-run')
            ->expectsOutputToContain('Examined 0')
            ->assertSuccessful();
    }

    /**
     * ⚠️ The reminder is claimed per CHECKOUT, not per creator. A creator who
     * abandons twice has two unfinished checkouts and should hear about the second;
     * a per-creator key would silence them forever after the first.
     */
    public function test_a_reminder_is_claimed_once_per_checkout(): void
    {
        $user = $this->creator();

        $this->assertTrue(
            NotificationDispatcher::claim($user->id, 'subscription_checkout', 'checkout:1')
        );
        $this->assertFalse(
            NotificationDispatcher::claim($user->id, 'subscription_checkout', 'checkout:1')
        );
        // A different checkout is a different thing to be told about.
        $this->assertTrue(
            NotificationDispatcher::claim($user->id, 'subscription_checkout', 'checkout:2')
        );

        $this->assertSame(
            2,
            EngagementNotification::where('user_id', $user->id)
                ->where('type', 'subscription_checkout')
                ->count()
        );
    }
}
