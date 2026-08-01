<?php

namespace Tests\Feature;

use App\Models\FinancialTransaction;
use App\Models\MonthlyCharge;
use App\Models\User;
use App\Services\SubscriptionActivationService;
use App\Support\SubscriptionPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * "No charge until your first sale" (client decision, 31 July 2026).
 *
 * The behaviour these tests protect is billing, so the failure modes are asymmetric:
 * activating too early charges a creator who has earned nothing — the exact objection
 * the feature removes — and activating twice bills them twice.
 */
class SubscriptionFirstSaleActivationTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $attributes = []): User
    {
        return User::factory()->create(array_merge(['role' => 1], $attributes));
    }

    private function parkedSubscription(User $creator, array $attributes = []): MonthlyCharge
    {
        return MonthlyCharge::create(array_merge([
            'user_id' => $creator->id,
            'stripe_id' => 'sub_test_'.$creator->id,
            'email' => $creator->email,
            'currency' => 'GBP',
            'amount' => SubscriptionPlan::price(),
            'tax' => SubscriptionPlan::vat(),
            'status' => 'trialing',
        ], $attributes));
    }

    private function sale(User $creator, string $status = 'completed'): FinancialTransaction
    {
        return FinancialTransaction::create([
            'user_id' => $creator->id,
            'type' => 'income',
            'status' => $status,
            'gross_amount' => 20,
            'net_amount' => 16,
            'currency' => 'GBP',
            'transaction_date' => now(),
        ]);
    }

    private function service(): SubscriptionActivationService
    {
        return app(SubscriptionActivationService::class);
    }

    public function test_a_creator_with_no_sale_is_not_activated(): void
    {
        $creator = $this->creator();
        $this->parkedSubscription($creator);

        $this->assertFalse($this->service()->shouldActivate($creator));
    }

    public function test_a_creator_with_a_completed_sale_is_activated(): void
    {
        $creator = $this->creator();
        $this->parkedSubscription($creator);
        $this->sale($creator);

        $this->assertTrue($this->service()->shouldActivate($creator));
        $this->assertTrue($this->service()->dueQuery()->pluck('id')->contains($creator->id));
    }

    /**
     * Money that came back out is not a sale. Both the journey card and billing
     * read the same definition, so this is what keeps them agreeing.
     */
    public function test_a_refunded_sale_does_not_start_billing(): void
    {
        $creator = $this->creator();
        $this->parkedSubscription($creator);
        $this->sale($creator, 'refunded');

        $this->assertFalse($this->service()->hasEverMadeSale($creator));
        $this->assertFalse($this->service()->shouldActivate($creator));
    }

    public function test_a_pending_sale_does_not_start_billing(): void
    {
        $creator = $this->creator();
        $this->parkedSubscription($creator);
        $this->sale($creator, 'pending');

        $this->assertFalse($this->service()->shouldActivate($creator));
    }

    /**
     * The claim is the guard against double billing: two sweeps, or a sweep racing
     * a webhook, must not both raise an invoice.
     */
    public function test_an_already_claimed_subscription_is_not_activated_again(): void
    {
        $creator = $this->creator();
        $this->parkedSubscription($creator, ['first_sale_activated_at' => now()]);
        $this->sale($creator);

        $this->assertNull($this->service()->pendingSubscription($creator));
        $this->assertFalse($this->service()->shouldActivate($creator));
        $this->assertFalse($this->service()->dueQuery()->pluck('id')->contains($creator->id));
    }

    public function test_an_already_billing_subscription_is_left_alone(): void
    {
        $creator = $this->creator();
        $this->parkedSubscription($creator, ['status' => 'paid']);
        $this->sale($creator);

        $this->assertFalse($this->service()->shouldActivate($creator));
    }

    /**
     * A dry run must claim nothing — otherwise the first real run finds every row
     * already claimed and silently bills nobody.
     */
    public function test_dry_run_leaves_the_claim_untouched(): void
    {
        $creator = $this->creator();
        $subscription = $this->parkedSubscription($creator);
        $this->sale($creator);

        $this->assertTrue($this->service()->activate($creator, dryRun: true));
        $this->assertNull($subscription->fresh()->first_sale_activated_at);
    }

    public function test_a_fan_is_never_activated(): void
    {
        $fan = $this->creator(['role' => 0]);
        $this->parkedSubscription($fan);
        $this->sale($fan);

        $this->assertFalse($this->service()->shouldActivate($fan));
    }

    public function test_nothing_activates_when_the_policy_is_switched_off(): void
    {
        config()->set('creator_subscription.free_until_first_sale', false);

        $creator = $this->creator();
        $this->parkedSubscription($creator);
        $this->sale($creator);

        $this->assertFalse($this->service()->shouldActivate($creator));
    }

    /**
     * The free period is parked far enough out that no genuine creator reaches it,
     * and never in the past — a non-positive value would make Stripe bill on day one.
     */
    public function test_the_parked_free_period_is_always_in_the_future(): void
    {
        config()->set('creator_subscription.free_period_days', 0);
        $this->assertGreaterThan(0, SubscriptionPlan::freePeriodDays());

        config()->set('creator_subscription.free_period_days', -5);
        $this->assertGreaterThan(0, SubscriptionPlan::freePeriodDays());
    }

    /**
     * ⚠️ Stripe rejects the whole Checkout session above 730 days — "The maximum
     * number of trial period days is 730 (2 years)" — so a creator could not
     * subscribe at all. This shipped broken at 1095 and was caught in the browser.
     */
    public function test_the_free_period_never_exceeds_stripes_trial_ceiling(): void
    {
        config()->set('creator_subscription.free_period_days', 1095);

        $this->assertSame(
            SubscriptionPlan::STRIPE_MAX_TRIAL_DAYS,
            SubscriptionPlan::freePeriodDays(),
        );
        $this->assertLessThanOrEqual(730, SubscriptionPlan::freePeriodDays());
    }

    /**
     * The webhook and the redirect handler each create their own monthly_charges
     * row, so one Stripe subscription can be described by two local rows. Claiming
     * only the row we happened to read left the other for the next sweep, which
     * would bill the same subscription a second time.
     */
    public function test_two_rows_for_one_stripe_subscription_are_claimed_together(): void
    {
        $creator = $this->creator();
        $first = $this->parkedSubscription($creator, ['stripe_id' => 'sub_shared']);
        $second = $this->parkedSubscription($creator, ['stripe_id' => 'sub_shared']);
        $this->sale($creator);

        $service = $this->service();
        $subscription = $service->pendingSubscription($creator);

        // Claim without reaching Stripe: assert the claim covers both rows.
        MonthlyCharge::where('stripe_id', $subscription->stripe_id)
            ->whereNull('first_sale_activated_at')
            ->update(['first_sale_activated_at' => now()]);

        $this->assertNotNull($first->fresh()->first_sale_activated_at);
        $this->assertNotNull($second->fresh()->first_sale_activated_at);
        $this->assertNull($service->pendingSubscription($creator));
        $this->assertFalse($service->shouldActivate($creator));
    }

    /**
     * A checkout that was STARTED is not a subscription. The trial dates are
     * written before the creator is sent to Stripe, so an abandoned checkout row
     * must not read as an active trial — under free-until-first-sale the parked
     * trial runs for years, so treating it as one would grant permanent payment
     * eligibility to anyone who opened the Stripe page and closed it.
     */
    public function test_an_abandoned_checkout_does_not_grant_payment_eligibility(): void
    {
        $creator = $this->creator();
        $this->parkedSubscription($creator, [
            'status' => 'initiated',
            'stripe_id' => null,
            'current_start_trial_date' => now()->subDay(),
            'current_end_trial_date' => now()->addDays(SubscriptionPlan::freePeriodDays()),
        ]);

        $this->assertNotContains(
            $creator->fresh()->subscription_status,
            [1, 2],
            'An abandoned checkout must not read as an active subscription or trial.',
        );
    }

    /**
     * A completed free-period subscription IS eligible — the creator has a card on
     * file and is selling, they simply have not been billed yet. If this ever
     * returns 0 or 3 the supporter checkout gates block every sale on the platform.
     */
    public function test_a_creator_in_their_free_period_can_still_receive_payments(): void
    {
        $creator = $this->creator();
        $this->parkedSubscription($creator, [
            'current_start_trial_date' => now()->subDay(),
            'current_end_trial_date' => now()->addDays(SubscriptionPlan::freePeriodDays()),
        ]);

        $this->assertContains($creator->fresh()->subscription_status, [1, 2]);
    }

    /**
     * ⚠️ The parked trial date sits ~2 years out and is NOT cleared when billing
     * starts, so any status that reads as "still in the free period" keeps the
     * creator selling for two years. A failed card did exactly that: the webhook
     * writes 'failed', which slipped past the original deny-list check.
     *
     * @dataProvider nonFreePeriodStatuses
     */
    public function test_only_a_real_free_period_counts_as_eligible(string $status): void
    {
        $creator = $this->creator();
        $this->parkedSubscription($creator, [
            'status' => $status,
            'current_start_trial_date' => now()->subDays(5),
            'current_end_trial_date' => now()->addDays(SubscriptionPlan::freePeriodDays()),
        ]);

        $this->assertNotContains(
            $creator->fresh()->subscription_status,
            [1, 2],
            "A '{$status}' subscription must not read as a live free period.",
        );
    }

    public static function nonFreePeriodStatuses(): array
    {
        return [
            'card payment failed' => ['failed'],
            'checkout abandoned' => ['initiated'],
            'cancelled' => ['canceled'],
        ];
    }

    /** @dataProvider freePeriodStatuses */
    public function test_a_real_free_period_is_eligible(string $status): void
    {
        $creator = $this->creator();
        $this->parkedSubscription($creator, [
            'status' => $status,
            'current_start_trial_date' => now()->subDays(5),
            'current_end_trial_date' => now()->addDays(SubscriptionPlan::freePeriodDays()),
        ]);

        $this->assertContains($creator->fresh()->subscription_status, [1, 2]);
    }

    public static function freePeriodStatuses(): array
    {
        return [
            'trialing' => ['trialing'],
            'trial ending' => ['trial_ending'],
        ];
    }

    /**
     * Cancelling before any payment revokes access at once; after a payment it
     * runs to the end of the paid period. These assert the CONDITION the
     * controller branches on, since the branch itself reaches Stripe.
     *
     * @dataProvider cancellationStates
     */
    public function test_cancellation_timing_is_decided_by_whether_billing_started(
        array $attributes,
        bool $expectedImmediate,
        string $why,
    ): void {
        $creator = $this->creator();
        $charge = $this->parkedSubscription($creator, $attributes);

        $isBeforePayment = in_array($charge->status, ['trialing', 'trial_ending'], true)
            && ! $charge->current_start_subscription_date
            && ! $charge->first_sale_activated_at;

        $this->assertSame($expectedImmediate, $isBeforePayment, $why);
    }

    public static function cancellationStates(): array
    {
        return [
            'never billed' => [
                ['status' => 'trialing'],
                true,
                'Nothing was paid, so nothing is owed and access stops at once.',
            ],
            'billing already started' => [
                ['status' => 'paid', 'current_start_subscription_date' => '2026-07-01'],
                false,
                'A paid period must run to its end.',
            ],
            // ⚠️ The race this exists for: the claim is taken BEFORE Stripe is
            // told to charge and the status is only flipped after, so for a
            // moment a charged creator still looks like a free-period one.
            'charged, status not yet flipped' => [
                ['status' => 'trialing', 'first_sale_activated_at' => '2026-07-31 12:00:00'],
                false,
                'The creator has just been charged — access must not be revoked.',
            ],
            'activation failed, claim released' => [
                ['status' => 'trialing', 'first_sale_activated_at' => null],
                true,
                'A released claim means billing never started.',
            ],
        ];
    }

    /**
     * Setup mode: the row holds a saved card and no Stripe subscription, because
     * the subscription is what the first sale creates. It must still be picked up.
     */
    public function test_a_saved_card_with_no_subscription_is_activatable(): void
    {
        $creator = $this->creator();
        $this->parkedSubscription($creator, [
            'stripe_id' => null,
            'stripe_payment_method' => 'pm_test_card',
        ]);
        $this->sale($creator);

        $this->assertNotNull($this->service()->pendingSubscription($creator));
        $this->assertTrue($this->service()->shouldActivate($creator));
        $this->assertTrue($this->service()->dueQuery()->pluck('id')->contains($creator->id));
    }

    /**
     * A row with neither a subscription nor a card has nothing to bill against —
     * charging cannot be attempted, so it must not be selected.
     */
    public function test_a_row_with_nothing_chargeable_is_ignored(): void
    {
        $creator = $this->creator();
        $this->parkedSubscription($creator, [
            'stripe_id' => null,
            'stripe_payment_method' => null,
        ]);
        $this->sale($creator);

        $this->assertNull($this->service()->pendingSubscription($creator));
        $this->assertFalse($this->service()->shouldActivate($creator));
        $this->assertFalse($this->service()->dueQuery()->pluck('id')->contains($creator->id));
    }

    /**
     * ⚠️ The 15-minute `subscription:sync` finds no Stripe subscription for a
     * setup-mode creator — because there is not one yet — and used to clear their
     * subscribed flag on every single tick.
     */
    public function test_awaiting_a_first_sale_is_not_mistaken_for_having_no_subscription(): void
    {
        $creator = $this->creator(['is_subscribed' => 1]);
        $this->parkedSubscription($creator, [
            'stripe_id' => null,
            'stripe_payment_method' => 'pm_test_card',
        ]);

        $awaiting = MonthlyCharge::where('user_id', $creator->id)
            ->whereIn('status', ['trialing', 'trial_ending'])
            ->whereNull('first_sale_activated_at')
            ->whereNotNull('stripe_payment_method')
            ->exists();

        $this->assertTrue($awaiting, 'A saved card awaiting a first sale must be a recognised state.');
    }

    /** An unrecognised mode must never silently opt creators into the newer flow. */
    public function test_an_unknown_checkout_mode_falls_back_to_the_legacy_path(): void
    {
        config()->set('creator_subscription.checkout_mode', 'nonsense');

        $this->assertSame(SubscriptionPlan::MODE_SUBSCRIPTION, SubscriptionPlan::checkoutMode());
        $this->assertFalse(SubscriptionPlan::usesSetupMode());

        config()->set('creator_subscription.checkout_mode', 'setup');
        $this->assertTrue(SubscriptionPlan::usesSetupMode());
    }

    /** A future real trial is a config value, and is clamped like every other. */
    public function test_the_on_sale_trial_is_clamped(): void
    {
        config()->set('creator_subscription.trial_days', -3);
        $this->assertSame(0, SubscriptionPlan::trialDaysOnSale());

        config()->set('creator_subscription.trial_days', 9999);
        $this->assertSame(SubscriptionPlan::STRIPE_MAX_TRIAL_DAYS, SubscriptionPlan::trialDaysOnSale());

        config()->set('creator_subscription.trial_days', 7);
        $this->assertSame(7, SubscriptionPlan::trialDaysOnSale());
    }

    /**
     * ⚠️ The local status must come from what Stripe actually did.
     *
     * An off-session charge that needs authentication, or a declined card, leaves
     * the subscription `incomplete`. Writing 'paid' there tells the creator they
     * are subscribed while nothing is being collected — and an `incomplete`
     * subscription sits for roughly 23 hours before Stripe gives up, so the
     * webhook does not correct it quickly either.
     *
     * @dataProvider stripeActivationResults
     */
    public function test_the_local_status_follows_what_stripe_did(?string $stripeStatus, string $expected): void
    {
        $localStatus = match ($stripeStatus) {
            'active' => 'paid',
            'trialing' => 'trialing',
            null => 'paid',
            default => 'failed',
        };

        $this->assertSame($expected, $localStatus);
        // A 'failed' outcome must not leave the creator able to sell.
        if ($expected === 'failed') {
            $this->assertNotContains($expected, SubscriptionActivationService::CONVERTIBLE_STATUSES);
        }
    }

    public static function stripeActivationResults(): array
    {
        return [
            'collected' => ['active', 'paid'],
            'real trial applied' => ['trialing', 'trialing'],
            'needs authentication' => ['incomplete', 'failed'],
            'card declined' => ['past_due', 'failed'],
            'unpaid' => ['unpaid', 'failed'],
            'stripe said nothing' => [null, 'paid'],
        ];
    }

    public function test_plan_arithmetic_and_copy_come_from_one_place(): void
    {
        config()->set('creator_subscription.price', 8.99);
        config()->set('creator_subscription.vat_rate', 20);

        $this->assertSame(8.99, SubscriptionPlan::price());
        $this->assertSame(1.80, SubscriptionPlan::vat());
        $this->assertSame(10.79, SubscriptionPlan::total());
        $this->assertSame('£8.99', SubscriptionPlan::formatted());
        $this->assertStringContainsString('£8.99', SubscriptionPlan::copy('price_line'));
        $this->assertSame('', SubscriptionPlan::copy('no_such_key'));
    }
}
