<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureSystemDiagnosticsAccess;
use App\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The diagnostics screen carried no authentication in any environment, because
 * this app's `admin` gate (`users.role === '2'`) answers 403 to every user alive.
 * It is now reachable only by clicking through from the admin app, which signs a
 * short-lived hand-off with a shared secret.
 *
 * Every test here pretends to be production on purpose — local and testing are
 * deliberately open, so a suite that ran in its own environment would assert
 * nothing at all.
 */
class SystemDiagnosticsAccessTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-secret-value';

    protected function setUp(): void
    {
        parent::setUp();

        $this->app['env'] = 'production';
        config()->set('system_diagnostics.link_secret', self::SECRET);
        config()->set('system_diagnostics.link_ttl', 120);
        config()->set('system_diagnostics.session_ttl', 1800);
    }

    private function signedUrl(?int $ts = null, string $actor = '7', ?string $secret = null): string
    {
        $ts ??= time();
        $signature = hash_hmac('sha256', $ts.'|'.$actor, $secret ?? self::SECRET);

        return '/admin/system-diagnostics/unlock?'.http_build_query([
            't' => $ts,
            'a' => $actor,
            's' => $signature,
        ]);
    }

    public function test_the_page_is_not_reachable_without_a_hand_off(): void
    {
        $this->get('/admin/system-diagnostics')->assertNotFound();
    }

    /** A 403 would confirm the page exists to anyone who guesses the path. */
    public function test_a_refusal_is_a_404_not_a_403(): void
    {
        $this->get('/admin/system-diagnostics')->assertStatus(404);
        $this->get($this->signedUrl(secret: 'wrong-secret'))->assertStatus(404);
    }

    /**
     * The XHR endpoints matter more than the page: `run` executes the sweep and,
     * on a deep run, mints real objects at Stripe. CSRF is dropped here so the
     * assertion is about the gate rather than about the token — without it the
     * POST stops at 419 and never reaches the middleware under test.
     */
    public function test_the_run_and_history_endpoints_are_gated_too(): void
    {
        $this->withoutMiddleware(VerifyCsrfToken::class);

        $this->postJson('/admin/system-diagnostics/run')->assertNotFound();
        $this->getJson('/admin/system-diagnostics/history')->assertNotFound();
    }

    public function test_a_valid_hand_off_unlocks_the_session(): void
    {
        $this->get($this->signedUrl())
            ->assertRedirect(route('admin.system-diagnostics.index'))
            ->assertSessionHas(EnsureSystemDiagnosticsAccess::SESSION_KEY);

        $this->get('/admin/system-diagnostics')->assertOk();
    }

    public function test_a_tampered_signature_is_refused(): void
    {
        $ts = time();
        $this->get('/admin/system-diagnostics/unlock?'.http_build_query([
            't' => $ts,
            'a' => '7',
            's' => str_repeat('0', 64),
        ]))->assertNotFound();

        $this->assertGuest();
        $this->get('/admin/system-diagnostics')->assertNotFound();
    }

    /**
     * The admin id is part of what was signed, so it cannot be rewritten while
     * keeping a valid signature — the id the website logs is the one that was
     * authenticated on the other side.
     */
    public function test_the_actor_cannot_be_swapped(): void
    {
        $url = str_replace('a=7', 'a=1', $this->signedUrl());

        $this->get($url)->assertNotFound();
    }

    public function test_a_stale_link_is_refused(): void
    {
        $this->get($this->signedUrl(ts: time() - 600))->assertNotFound();
    }

    /** A deploy that forgot the env var must fail closed, not open. */
    public function test_an_unset_secret_refuses_every_hand_off(): void
    {
        config()->set('system_diagnostics.link_secret', '');

        $this->get($this->signedUrl(secret: ''))->assertNotFound();
        $this->get('/admin/system-diagnostics')->assertNotFound();
    }

    public function test_an_expired_unlock_stops_working(): void
    {
        $this->withSession([
            EnsureSystemDiagnosticsAccess::SESSION_KEY => time() - 1,
        ])->get('/admin/system-diagnostics')->assertNotFound();
    }

    /** Local is the one place the page stays open — it is a development tool. */
    public function test_local_stays_open(): void
    {
        $this->app['env'] = 'local';

        $this->get('/admin/system-diagnostics')->assertOk();
    }
}
