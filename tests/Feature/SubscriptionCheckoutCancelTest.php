<?php

namespace Tests\Feature;

use App\Models\MonthlyCharge;
use App\Models\User;
use App\Services\SubscriptionCheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * The route is `/handle/{uuid}/{status}` and the controller declared only `$uuid`, so
 * Stripe's answer was thrown away: `success_url` and `cancel_url` differ by that one
 * segment and nothing else, and a creator who pressed Back came down the COMPLETION
 * path. A setup-mode session always reports `payment_status = no_payment_required`
 * (nothing is ever charged in setup mode), so the guard let it through,
 * completeSetupCheckout found no card and logged at ERROR — four production alerts
 * from one creator tapping back (JAVASCRIPT-REACT-AG) — and they were then told
 * "We could not save your card. Please try again." for something they chose to do.
 */
class SubscriptionCheckoutCancelTest extends TestCase
{
    use RefreshDatabase;

    private function startedCheckout(): MonthlyCharge
    {
        $user = User::factory()->create(['role' => 1]);

        return MonthlyCharge::create([
            'user_id' => $user->id,
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'session_id' => 'cs_live_'.\Illuminate\Support\Str::random(20),
            'status' => SubscriptionCheckoutService::STATUS_STARTED,
        ]);
    }

    public function test_a_cancelled_checkout_never_reaches_the_completion_path(): void
    {
        Log::spy();

        $sub = $this->startedCheckout();

        $this->actingAs($sub->user)
            ->get("/handle/{$sub->uuid}/cancel")
            ->assertRedirect(route('activate-subscription'));

        Log::shouldNotHaveReceived('error');
    }

    public function test_a_cancelled_checkout_is_not_reported_as_a_failure(): void
    {
        $sub = $this->startedCheckout();

        $this->actingAs($sub->user)
            ->get("/handle/{$sub->uuid}/cancel")
            ->assertSessionMissing('error');
    }

    public function test_the_row_is_left_startable_so_a_retry_can_still_win(): void
    {
        $sub = $this->startedCheckout();

        $this->actingAs($sub->user)->get("/handle/{$sub->uuid}/cancel");

        $this->assertSame(
            SubscriptionCheckoutService::STATUS_STARTED,
            $sub->fresh()->status,
            'The card was never saved, so the webhook and the reconcile sweep must still be able to complete it.'
        );
    }
}
