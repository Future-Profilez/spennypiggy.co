<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * The service worker is served by a ROUTE reading `resources/proxy/`, not from
 * `public/` — which is not reachable on the app domain. `scripts/build-sw.js`
 * wrote to `public/service-worker.js` for a long time, so the worker it built was
 * never deployed and what production served instead was the MagicBell client
 * library bundle: no `push` listener, no `notificationclick`, no caching.
 *
 * Nothing failed. Pushes were accepted by MagicBell and displayed by nobody, and a
 * hashed chunk that went missing had no cache to fall back on. Every assertion
 * here exists because that combination is invisible at runtime.
 *
 * ⚠️ `RefreshDatabase` is required even though these routes touch no model: they
 * sit in the `web` group, whose shared Inertia props read the `currencies` table,
 * so without a migrated database every one of them answers 500.
 */
class ServiceWorkerDeliveryTest extends TestCase
{
    use RefreshDatabase;

    private function workerBody(): string
    {
        return $this->get('/service-worker.js')->getContent();
    }

    public function test_the_route_serves_the_built_worker(): void
    {
        $response = $this->get('/service-worker.js');

        $response->assertOk();
        $this->assertStringContainsString(
            'text/javascript',
            $response->headers->get('Content-Type')
        );
    }

    /**
     * A cached worker script is a deploy that never reaches the installed app.
     *
     * 🚨 This asserts against `HandleCorsForAssets`, not against the route. That
     * middleware runs AFTER the route and stamps `max-age=31536000` on anything
     * ending `.js` — so it was overwriting the worker's own `no-cache` and
     * serving the file that decides push delivery with a one-year lifetime.
     */
    public function test_the_worker_is_not_cached(): void
    {
        $cacheControl = $this->get('/service-worker.js')
            ->headers->get('Cache-Control');

        $this->assertStringContainsString('no-cache', $cacheControl);
        $this->assertStringNotContainsString('max-age=31536000', $cacheControl);
    }

    /**
     * 🚨 The whole reason push silently displayed nothing: the file being served
     * had no handler capable of drawing a notification.
     */
    public function test_the_worker_can_display_a_push(): void
    {
        $body = $this->workerBody();

        $this->assertStringContainsString("addEventListener('push'", $body);
        $this->assertStringContainsString('showNotification', $body);
        $this->assertStringContainsString("addEventListener('notificationclick'", $body);
    }

    /**
     * 🚨 A failed `importScripts` aborts evaluation of the entire script, so
     * anything declared after it is silently never registered. Push must not be
     * able to die because a third-party CDN had a bad day.
     */
    public function test_push_is_registered_before_the_cdn_import(): void
    {
        $body = $this->workerBody();

        $push = strpos($body, "addEventListener('push'");
        $import = strpos($body, 'importScripts(');

        $this->assertNotFalse($push);
        $this->assertNotFalse($import);
        $this->assertLessThan($import, $push, 'Push must register above importScripts.');
    }

    public function test_the_worker_still_carries_the_caching_layer(): void
    {
        $body = $this->workerBody();

        $this->assertStringContainsString('precacheAndRoute', $body);
        $this->assertStringContainsString('registerRoute', $body);
    }

    /**
     * 🚨 THE ASSERTION THIS FILE EXISTS FOR.
     *
     * `precacheAndRoute` fetches every entry during `install`, and ONE failure
     * rejects the whole install — the worker never activates, so push AND caching
     * both stay dead with nothing logged anywhere. The precache list used to be
     * globbed out of `public/`, producing `/offline.html`, `/siteicon.png`,
     * `/logo.png` and `/Favicon.svg`; measured against production, all four
     * answered 404.
     */
    public function test_every_precached_url_resolves(): void
    {
        preg_match('/precacheAndRoute\((\[.*?\])\)/s', $this->workerBody(), $matches);

        $this->assertNotEmpty($matches, 'Could not read the precache manifest.');

        $manifest = json_decode($matches[1], true);

        $this->assertNotEmpty($manifest, 'The precache manifest is empty.');

        foreach ($manifest as $entry) {
            $this->assertArrayHasKey('url', $entry);

            $this->get($entry['url'])->assertOk();
        }
    }

    public function test_the_offline_page_is_served(): void
    {
        // ⚠️ Assert on `noindex` alone — `StaticPageSeoMiddleware` appends
        // `noarchive` on a non-indexable host, which every test environment is.
        $response = $this->get('/offline.html')->assertOk();

        $this->assertStringContainsString(
            'noindex',
            $response->headers->get('X-Robots-Tag')
        );
    }

    /**
     * The client registers this exact path, the route reads this exact file and
     * the build writes it. A rename anywhere breaks push with no error.
     */
    public function test_the_client_registers_the_path_the_route_serves(): void
    {
        $this->assertTrue(Route::has('service.worker'));

        $client = file_get_contents(
            resource_path('js/Pages/webpush/MagicBellNotification.jsx')
        );

        $this->assertStringContainsString("serviceWorkerPath: '/service-worker.js'", $client);
    }
}
