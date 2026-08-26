<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

/**
 * 🚨 Laravel's own signature for a numeric `throttle:N,M` is
 * `sha1($route->getDomain().'|'.$request->ip())` for a guest — the ROUTE is not in
 * it — so every bare `throttle:` route on this domain shared ONE counter and the
 * tightest limit among them became the effective limit for all of them.
 *
 * That is how a signup died on its FIRST submit: the register form's debounced
 * `register/validate` calls, `username-availablity` and the referral-code check all
 * incremented the same counter, and `POST register` then read it against its own
 * maximum and answered 429 for a person who had submitted nothing yet.
 *
 * App\Http\Middleware\ThrottleRequests adds the route's identity. These tests assert
 * the two halves that matter: the buckets are separate, and each route's own limit
 * still bites.
 */
class PerRouteThrottleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('');
        $this->app['cache']->flush();
    }

    public function test_a_loose_routes_traffic_does_not_exhaust_a_tighter_routes_limit(): void
    {
        // ⚠️ The direction matters. Every route compares the SHARED counter against
        // its OWN maximum, so spending a tight route's allowance and then calling a
        // looser one passes even with the bug — the looser maximum is not reached.
        // The fault only shows loose-to-tight, which is exactly the reported case:
        // the register form's own field checks (60/min) ran up a counter that
        // `POST register` (10/hour) then read and refused on.

        // register/validate is throttle:120,1 — well inside its own limit.
        for ($i = 0; $i < 50; $i++) {
            $this->post('/register/validate', ['email' => "someone{$i}@example.com"]);
        }

        // check-coupon-code is throttle:40,1 and has not been called once. With the
        // stock signature it reads 50 against its maximum of 40 and answers 429.
        $this->get('/check-coupon-code/never-called-before')
            ->assertStatus(200);
    }

    public function test_a_routes_own_limit_is_still_enforced(): void
    {
        // The isolation must not become a way of removing the limit.
        for ($i = 0; $i < 40; $i++) {
            $this->get('/check-coupon-code/code-'.$i)->assertStatus(200);
        }

        $this->get('/check-coupon-code/code-41')->assertStatus(429);
    }

    public function test_walking_the_register_form_does_not_refuse_the_code_check(): void
    {
        // The reported flow, in order: type a username, type an email, then blur the
        // referral field. Before this the last step met "Too many requests".
        for ($i = 0; $i < 12; $i++) {
            $this->post('/username-availablity', ['username' => "handle{$i}"]);
            $this->post('/register/validate', ['email' => "someone{$i}@example.com"]);
        }

        $response = $this->get('/check-coupon-code/typed-by-the-user');

        $this->assertNotSame(429, $response->getStatusCode());
    }
}
