<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * `POST stripe/identity/verify` opens a billable Stripe Identity session. Until
 * 31 Aug 2026 it was declared under "Public routes (no middleware)" and checked only
 * that SOMEBODY was signed in — a gifter could loop it. The gate here mirrors the one
 * on the identity PAGE (CheckStripeIdentityVerification): creator, approved profile,
 * Connect done, not already verified. Every refusal happens before Stripe is called.
 */
class IdentityVerifySessionGateTest extends TestCase
{
    use RefreshDatabase;

    private function user(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'profile_status_lock' => 2,
            'stripe_details_submitted' => 1,
            'identity_status' => 0,
            'email_verified_at' => now(),
        ], $attributes));
    }

    public function test_a_guest_is_sent_to_login(): void
    {
        $this->postJson(route('stripe.identity.verify'))->assertUnauthorized();
    }

    public function test_a_gifter_is_refused(): void
    {
        $this->actingAs($this->user(['role' => 0]))
            ->postJson(route('stripe.identity.verify'))
            ->assertForbidden();
    }

    public function test_an_unapproved_profile_is_refused(): void
    {
        $this->actingAs($this->user(['profile_status_lock' => 1]))
            ->postJson(route('stripe.identity.verify'))
            ->assertForbidden();
    }

    public function test_identity_is_not_opened_before_connect(): void
    {
        $this->actingAs($this->user(['stripe_details_submitted' => 0]))
            ->postJson(route('stripe.identity.verify'))
            ->assertForbidden();
    }

    public function test_an_already_verified_creator_is_refused(): void
    {
        $this->actingAs($this->user(['identity_status' => 1]))
            ->postJson(route('stripe.identity.verify'))
            ->assertStatus(409);
    }

    public function test_a_flagged_creator_is_told_to_contact_support_not_retried(): void
    {
        $this->actingAs($this->user(['identity_status' => 3]))
            ->postJson(route('stripe.identity.verify'))
            ->assertStatus(409)
            ->assertJsonFragment(['error' => 'Your identity check did not pass our security review. Please contact support.']);
    }

    public function test_the_route_is_throttled(): void
    {
        $route = app('router')->getRoutes()->getByName('stripe.identity.verify');

        $this->assertNotNull($route);
        $this->assertContains('auth', $route->gatherMiddleware());
        $this->assertTrue(
            collect($route->gatherMiddleware())->contains(fn ($m) => str_starts_with((string) $m, 'throttle:')),
            'a session-minting endpoint must be rate limited'
        );
    }
}
