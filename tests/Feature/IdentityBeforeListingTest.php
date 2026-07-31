<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureIdentityVerifiedForListings;
use App\Models\User;
use App\Services\CreatorJourneyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

/**
 * Identity verification moved to sit AFTER Stripe Connect (31 July 2026).
 *
 * Stripe Identity bills the platform per check. Gating it behind Connect — which is
 * free to us and already demands bank details plus Stripe's own KYC — means we only
 * pay for creators who have proved they are serious. The requirement itself did not
 * go away: it now blocks LISTING rather than blocking Connect.
 */
class IdentityBeforeListingTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'profile_status_lock' => 2,
            'stripe_details_submitted' => 1,
            'identity_status' => 0,
        ], $attributes));
    }

    private function pass(User $user, bool $json = false, bool $inertia = false)
    {
        $request = Request::create('/save_wish_item', 'POST');
        $request->setUserResolver(fn () => $user);

        if ($json) {
            $request->headers->set('Accept', 'application/json');
        }

        if ($inertia) {
            $request->headers->set('X-Inertia', 'true');
            // Inertia sets this too, which is exactly why an ajax() check alone
            // was not enough to tell the two callers apart.
            $request->headers->set('X-Requested-With', 'XMLHttpRequest');
        }

        $this->actingAs($user);

        return (new EnsureIdentityVerifiedForListings)->handle(
            $request,
            fn () => response('reached the controller'),
        );
    }

    public function test_a_verified_creator_may_list(): void
    {
        $response = $this->pass($this->creator(['identity_status' => 1]));

        $this->assertSame('reached the controller', $response->getContent());
    }

    public function test_an_unverified_creator_may_not_list(): void
    {
        $response = $this->pass($this->creator(['identity_status' => 0]));

        $this->assertTrue($response->isRedirect());
        $this->assertStringContainsString('identity-verification', $response->getTargetUrl());
    }

    /**
     * ⚠️ Every add-item form on this platform submits over axios or Inertia. Handing
     * one an HTML redirect surfaces as a spinner that never resolves and no
     * explanation — worse than a plain refusal.
     */
    public function test_a_json_caller_gets_a_refusal_it_can_render(): void
    {
        $response = $this->pass($this->creator(['identity_status' => 0]), json: true);

        $this->assertSame(403, $response->getStatusCode());
        $payload = $response->getData(true);
        $this->assertTrue($payload['identity_required']);
        $this->assertNotEmpty($payload['message']);
    }

    /**
     * ⚠️ Inertia sets X-Requested-With as well, so an `ajax()` check alone answered
     * it with raw JSON — which Inertia renders as an error modal instead of a
     * message on the page. It needs a redirect it can follow.
     */
    public function test_an_inertia_caller_gets_a_redirect_not_json(): void
    {
        $response = $this->pass($this->creator(['identity_status' => 0]), inertia: true);

        $this->assertTrue($response->isRedirect());
        $this->assertNotSame(403, $response->getStatusCode());
    }

    /**
     * A creator waiting on Stripe has nothing left to do; telling them to "verify"
     * again is how they end up starting a second billable check.
     */
    public function test_a_creator_awaiting_review_is_told_to_wait(): void
    {
        $response = $this->pass($this->creator(['identity_status' => 2]), json: true);

        $this->assertStringContainsString('being reviewed', $response->getData(true)['message']);
    }

    public function test_a_fan_is_unaffected(): void
    {
        $response = $this->pass($this->creator(['role' => 0, 'identity_status' => 0]));

        $this->assertSame('reached the controller', $response->getContent());
    }

    /**
     * The whole point of the flip: an unverified creator must still be able to reach
     * Stripe Connect, because completing it is what earns them the paid check.
     */
    public function test_connect_no_longer_demands_identity_first(): void
    {
        $creator = $this->creator(['identity_status' => 0, 'stripe_details_submitted' => 0]);

        $response = $this->actingAs($creator)->get(route('stripe.index'));

        $this->assertFalse(
            str_contains((string) session('error'), 'identity verification'),
            'Stripe Connect must not turn an unverified creator away.',
        );
        $this->assertNotSame(500, $response->getStatusCode());
    }

    public function test_the_journey_puts_payouts_before_identity(): void
    {
        $order = array_keys(CreatorJourneyService::STEPS);

        $this->assertLessThan(
            array_search('identity', $order, true),
            array_search('stripe', $order, true),
            'Connect must come before identity, and the admin app mirrors this order.',
        );
    }

    /**
     * Identity is not demanded until Connect is done — otherwise the platform pays
     * for a check on every creator who merely got a profile approved.
     */
    public function test_identity_is_not_demanded_before_connect_is_complete(): void
    {
        // Profile has to be finished first, or the journey correctly stops there and
        // the assertion says nothing about the ordering under test.
        $creator = $this->creator([
            'avatar_approved' => 1,
            'bio_approved' => 1,
            'stripe_details_submitted' => 0,
            'identity_status' => 0,
        ]);

        $this->assertSame('stripe', app(CreatorJourneyService::class)->currentStep($creator));
    }
}
