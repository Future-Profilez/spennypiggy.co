<?php

namespace Tests\Feature;

use App\Support\MaintenanceMode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class MaintenanceModeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        /*
         * A bare route through the global middleware stack — the wall is global, so
         * this exercises it without dragging in a real page's controller.
         *
         * ⚠️ THREE segments deliberately. web.php ends with the `/{username}/{page?}`
         * profile catch-all, which swallows any one- or two-segment path and answers
         * an unknown username with a 404 — so a `/__probe` here reads as "the wall
         * let it through and the route does not exist", which is indistinguishable
         * from the wall being up.
         */
        Route::get('/__probe/mw/check', fn () => 'ok');
    }

    /** Write the flag the way the admin app does, and drop the read cache. */
    private function setState(array $state): void
    {
        DB::table('settings')->updateOrInsert(
            ['key' => MaintenanceMode::SETTING_KEY],
            ['value' => json_encode(MaintenanceMode::normalise($state)), 'created_at' => now(), 'updated_at' => now()]
        );

        Cache::flush();
    }

    public function test_the_site_is_up_when_nothing_has_ever_been_written(): void
    {
        $this->get('/__probe/mw/check')->assertOk()->assertSee('ok');
    }

    public function test_an_enabled_flag_serves_503_with_retry_after_and_noindex(): void
    {
        $this->setState([
            'enabled' => true,
            'headline' => 'Upgrading the piggy bank',
            'ends_at' => now()->addHour()->toIso8601String(),
        ]);

        $response = $this->get('/__probe/mw/check');

        // 🚨 Never 200. A maintenance page served as 200 is a page Google indexes,
        // and the whole site becomes "we'll be back soon" in the results.
        $response->assertStatus(503);
        $response->assertSee('Upgrading the piggy bank');
        $response->assertHeader('X-Robots-Tag', 'noindex, nofollow');

        $this->assertGreaterThan(0, (int) $response->headers->get('Retry-After'));
        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
    }

    public function test_stripe_webhooks_are_never_walled(): void
    {
        $this->setState(['enabled' => true]);

        /*
         * 🚨 The one exemption that is not a convenience: Stripe retries a failing
         * webhook for three days and then gives up permanently, so a walled
         * checkout.session.completed loses a deliverable with no error anywhere.
         *
         * The assertion is "not 503", not "200" — the real handler rejects an
         * unsigned payload, and what matters here is only that the wall let it
         * reach that handler at all.
         */
        $this->assertNotSame(503, $this->post('/webhook/payment')->getStatusCode());
    }

    /**
     * Asserted against the rule rather than against a live response: /health
     * legitimately answers 503 of its own accord when a dependency is unhappy, so
     * a status check there cannot tell "exempt" from "walled".
     */
    public function test_the_exempt_list_covers_the_paths_that_must_never_be_walled(): void
    {
        foreach ([
            'webhook/payment',
            'stripe/webhook',
            'rye-webhook',
            'health',
            'health/detailed',
            'up',
            'maintenance-access/abc123',
            'build/assets/app.js',
            'robots.txt',
            'favicon.ico',
            'service-worker.js',
        ] as $path) {
            $this->assertTrue(
                MaintenanceMode::isExempt(Request::create('/'.$path)),
                $path.' must be exempt from the maintenance wall'
            );
        }

        // A path that merely STARTS with an exempt word is not exempt — the match
        // is on a whole segment, so a creator called "healthy" is still walled.
        $this->assertFalse(MaintenanceMode::isExempt(Request::create('/healthy')));
        $this->assertFalse(MaintenanceMode::isExempt(Request::create('/upgrade')));
    }

    public function test_a_json_caller_gets_json_rather_than_a_page(): void
    {
        $this->setState(['enabled' => true, 'headline' => 'Back soon']);

        $this->getJson('/__probe/mw/check')
            ->assertStatus(503)
            ->assertJson(['maintenance' => true, 'headline' => 'Back soon']);
    }

    public function test_a_bypass_cookie_passes_the_wall(): void
    {
        $token = MaintenanceMode::newToken();
        $this->setState(['enabled' => true, 'bypass_token' => $token]);

        $this->get('/__probe/mw/check')->assertStatus(503);

        $this->withUnencryptedCookie(MaintenanceMode::BYPASS_COOKIE, $token)
            ->get('/__probe/mw/check')
            ->assertOk();
    }

    public function test_a_wrong_bypass_token_does_not_pass(): void
    {
        $this->setState(['enabled' => true, 'bypass_token' => MaintenanceMode::newToken()]);

        $this->withUnencryptedCookie(MaintenanceMode::BYPASS_COOKIE, MaintenanceMode::newToken())
            ->get('/__probe/mw/check')
            ->assertStatus(503);
    }

    public function test_the_bypass_route_exchanges_a_valid_token_for_a_cookie(): void
    {
        $token = MaintenanceMode::newToken();
        $this->setState(['enabled' => true, 'bypass_token' => $token]);

        $this->get('/maintenance-access/'.$token)
            ->assertRedirect('/')
            // `false` — the cookie is in EncryptCookies::\$except, because the wall
            // reads it before that middleware runs.
            ->assertCookie(MaintenanceMode::BYPASS_COOKIE, $token, false);

        // A wrong token is refused silently — confirming it was merely wrong
        // confirms the mechanism exists.
        $this->get('/maintenance-access/'.MaintenanceMode::newToken())
            ->assertRedirect('/')
            ->assertCookieMissing(MaintenanceMode::BYPASS_COOKIE);
    }

    public function test_an_allowlisted_ip_passes_the_wall(): void
    {
        $this->setState(['enabled' => true, 'allow_ips' => ['203.0.113.4']]);

        $this->get('/__probe/mw/check')->assertStatus(503);

        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.4'])
            ->get('/__probe/mw/check')
            ->assertOk();
    }

    public function test_a_window_scheduled_for_later_leaves_the_site_up(): void
    {
        $this->setState([
            'enabled' => true,
            'starts_at' => now()->addHours(3)->toIso8601String(),
        ]);

        $this->get('/__probe/mw/check')->assertOk();
    }

    public function test_auto_lift_returns_the_site_once_the_window_has_passed(): void
    {
        $this->setState([
            'enabled' => true,
            'auto_lift' => true,
            'starts_at' => now()->subHours(2)->toIso8601String(),
            'ends_at' => now()->subMinute()->toIso8601String(),
        ]);

        $this->get('/__probe/mw/check')->assertOk();
    }

    public function test_without_auto_lift_the_wall_stays_up_past_the_end_time(): void
    {
        // Deliberate: someone has to confirm the work actually finished before the
        // platform starts taking money again.
        $this->setState([
            'enabled' => true,
            'auto_lift' => false,
            'ends_at' => now()->subMinute()->toIso8601String(),
        ]);

        $this->get('/__probe/mw/check')->assertStatus(503);
    }

    public function test_malformed_state_fails_open(): void
    {
        DB::table('settings')->updateOrInsert(
            ['key' => MaintenanceMode::SETTING_KEY],
            ['value' => 'not json at all', 'created_at' => now(), 'updated_at' => now()]
        );
        Cache::flush();

        // A database blip or a corrupt row must never be able to black out the
        // platform. Up is the only safe direction.
        $this->get('/__probe/mw/check')->assertOk();
    }
}
