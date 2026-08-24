<?php

namespace Tests;

use App\SeoMeta;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * 🚨 `SeoMeta` KEEPS ITS TAGS IN A STATIC, AND A PHPUNIT RUN IS ONE PROCESS.
     *
     * `addTag()` APPENDS for everything except the title, so every meta, link and
     * JSON-LD block a test causes to be set stays there for every test that runs
     * after it. `CspInlineScriptTest` renders `view('app')` directly — no HTTP
     * request, so no `cspNonce` is shared — and a JSON-LD block left behind by an
     * earlier test therefore arrived un-nonced and failed the assertion. It passed
     * in isolation and failed in the full run, i.e. the result depended on test
     * ORDER.
     *
     * That is the thing worth fixing rather than the one assertion: a suite that
     * fails at random makes the green-regression release gate meaningless, which
     * is the same reason the Stripe HTTP client was taken offline in `testing`.
     *
     * ⚠️ **Production is NOT affected and this needed no production change.** Vapor
     * serves HTTP through PHP-FPM, where each request is a fresh script execution
     * and statics do not survive between requests. (An Octane deployment WOULD leak
     * these across requests in one worker — if this app ever moves to Octane, reset
     * `SeoMeta` per request rather than relying on that.)
     */
    protected function setUp(): void
    {
        parent::setUp();

        SeoMeta::clear();
    }

    /**
     * 🚨 SWITCHING USER MID-TEST MUST DROP THE PREVIOUS USER'S PASSWORD HASH.
     *
     * `AuthenticateSession` (in the `web` group since 24 Aug 2026) signs out any
     * session whose stored `password_hash_web` does not match the current user's.
     * A real sign-in never trips that, because `SessionGuard::login()` regenerates
     * the session — but `actingAs()` does not: it sets the user on the guard and
     * reuses whatever session the test already has. So `actingAs($a)` followed by
     * `actingAs($b)` left $a's hash in place and $b was logged straight back out,
     * with the request answering 401 or redirecting to login.
     *
     * That is a HARNESS artefact, not a product fault — three tests hit it
     * (`CreatorPushTest`, `ItemFunnelTest`, `SupportTicketTest`), all of them
     * switching users to check an owner-only route. Forgetting the key here is
     * the test-side equivalent of the session regeneration a real login performs;
     * the middleware then stores the new user's hash on the next request.
     */
    public function actingAs(Authenticatable $user, $guard = null)
    {
        parent::actingAs($user, $guard);

        $key = 'password_hash_'.($guard ?: config('auth.defaults.guard'));

        /*
         * ⚠️ NO `isStarted()` GUARD. The store reports NOT started once a request
         * has finished and saved it, while still holding the data — so guarding on
         * it skipped the forget in exactly the case that needs it (a second
         * `actingAs` after a first request). Measured, after the guard failed to
         * fix the three tests.
         */
        if ($this->app->bound('session.store')) {
            $this->app['session.store']->forget($key);
        }

        return $this;
    }
}
