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
