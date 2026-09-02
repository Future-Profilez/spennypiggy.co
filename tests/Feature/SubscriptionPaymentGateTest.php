<?php

namespace Tests\Feature;

use App\Models\MonthlyCharge;
use App\Models\User;
use App\Services\CreatorSubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The one gate every supporter checkout runs before taking money.
 *
 * Eight checkouts call `validateCreatorSubscription`, so this matrix is the only
 * thing standing between "this creator stopped paying" and "we took a supporter's
 * money anyway". A wrong ALLOW costs the platform its fee; a wrong REFUSE blocks
 * every sale on the platform for that creator, which is far worse — hence the free
 * period cases are asserted just as hard as the refusals.
 */
class SubscriptionPaymentGateTest extends TestCase
{
    use RefreshDatabase;

    private function gate(): CreatorSubscriptionService
    {
        return app(CreatorSubscriptionService::class);
    }

    private function creator(?array $charge = null): User
    {
        $user = User::factory()->create(['role' => 1]);

        if ($charge !== null) {
            MonthlyCharge::create(array_merge([
                'user_id' => $user->id,
                'amount' => 8.99,
                'currency' => 'GBP',
            ], $charge));
        }

        return $user->fresh();
    }

    public static function refusalCases(): array
    {
        return [
            'never subscribed (no row at all)' => [null],
            'abandoned checkout' => [['status' => 'initiated']],
            'expired' => [['status' => 'expired']],
            'cancelled' => [['status' => 'canceled', 'cancelled_at' => '2026-08-01 00:00:00']],
            'card declined' => [['status' => 'failed', 'stripe_payment_method' => 'pm_x']],
            'written off' => [['status' => 'ended']],
        ];
    }

    /** @dataProvider refusalCases */
    public function test_a_creator_who_is_not_paying_cannot_be_paid(?array $charge): void
    {
        $result = $this->gate()->validateCreatorSubscription($this->creator($charge));

        $this->assertFalse(
            $result['eligible'],
            "expected a refusal, got: {$result['status']}"
        );
    }

    public static function allowCases(): array
    {
        return [
            'free period, card saved' => [['status' => 'trialing', 'stripe_payment_method' => 'pm_x']],
            'billing monthly' => [['status' => 'paid']],
            'renewed' => [['status' => 'renew']],
            // ⚠️ A dated row, because that is the only shape 'active' ever has in
            // production — the webhook writes the period when it creates it.
            // Without dates this status is REFUSED: `computeSubscriptionStatus()`
            // lists 'active' in its first allow-list but not in the fallback one
            // below it, so a dateless 'active' row falls through to 0. Harmless
            // today, and a trap for anyone who writes that status by hand.
            // 🚨 RELATIVE TO NOW, NEVER A LITERAL DATE. This fixture carried
            // '2026-08-01' → '2026-09-01' and started failing on 1 Sep 2026 —
            // the subscription had genuinely expired, so the gate was right and
            // the test was wrong. A suite that turns red on a calendar date is
            // exactly what makes a green run stop meaning anything.
            'active' => [[
                'status' => 'active',
                'current_start_subscription_date' => now()->subMonth()->toDateTimeString(),
                'current_end_subscription_date' => now()->addMonth()->toDateTimeString(),
            ]],
        ];
    }

    /**
     * 🚨 The most expensive assertion here. A creator in their free period has never
     * been charged and never will be until they sell — if this ever returns false,
     * every checkout on the platform refuses for the entire cohort the policy exists
     * to attract, and nothing errors.
     *
     * @dataProvider allowCases
     */
    public function test_a_creator_in_good_standing_can_be_paid(array $charge): void
    {
        $result = $this->gate()->validateCreatorSubscription($this->creator($charge));

        $this->assertTrue(
            $result['eligible'],
            "expected this creator to be sellable, got: {$result['status']}"
        );
    }

    /** A fan is never subject to the creator subscription. */
    public function test_a_fan_is_not_gated(): void
    {
        $fan = User::factory()->create(['role' => 0]);

        $this->assertTrue($this->gate()->validateCreatorSubscription($fan)['eligible']);
        $this->assertSame('not_creator', $this->gate()->validateCreatorSubscription($fan)['status']);
    }
}
