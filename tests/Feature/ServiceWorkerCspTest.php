<?php

namespace Tests\Feature;

use App\Http\Middleware\SecurityHeaders;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Tests\TestCase;

/**
 * 🚨 THE SERVICE WORKER INHERITS THE PAGE'S CSP, AND A FAILED `importScripts`
 * ABORTS THE WHOLE WORKER.
 *
 * Not one directive among many: if the workbox runtime cannot load, evaluation
 * stops there — no push listener, no `notificationclick`, no offline page and no
 * precache to fall back on when a hashed chunk goes stale. The worker simply is
 * not there, and nothing on any screen says so.
 *
 * Reported 12 Sep 2026 as four separate Sentry issues, 262 events, every one of
 * them with `document-uri: /service-worker.js`. ⚠️ They were `disposition:
 * report` — `SECURITY_CSP_ENFORCE` defaults false — so nothing was broken for
 * anybody. That is exactly what makes this worth pinning: the report is the only
 * warning that exists before somebody switches enforcement on.
 */
class ServiceWorkerCspTest extends TestCase
{
    private function policy(): string
    {
        // ⚠️ `security.csp.skip_environments` is `['local', 'testing']`, so the
        // suite's own environment sets NO header at all — without this the
        // assertions below read an empty string and pass for the wrong reason.
        $this->app['env'] = 'production';

        $middleware = new SecurityHeaders;

        $response = $middleware->handle(
            Request::create('https://spennypiggy.co/', 'GET'),
            fn () => new Response('ok')
        );

        return (string) (
            $response->headers->get('Content-Security-Policy')
            ?: $response->headers->get('Content-Security-Policy-Report-Only')
        );
    }

    private function directive(string $name): string
    {
        foreach (explode(';', $this->policy()) as $part) {
            $part = trim($part);
            if (str_starts_with($part, $name.' ')) {
                return $part;
            }
        }

        return '';
    }

    /**
     * The exact URL the worker imports. Read out of the worker rather than
     * retyped — a version bump that moves the path must fail here, not in
     * production three weeks later.
     */
    private function workboxUrl(): string
    {
        $worker = (string) file_get_contents(base_path('resources/proxy/service-worker.js'));

        $this->assertMatchesRegularExpression(
            '/importScripts\(\s*[\'"](https:\/\/[^\'"]+)[\'"]/',
            $worker,
            'The worker no longer imports a remote script — if that is deliberate, delete this test.'
        );

        preg_match('/importScripts\(\s*[\'"](https:\/\/[^\'"]+)[\'"]/', $worker, $m);

        return $m[1];
    }

    public function test_the_workbox_runtime_the_worker_imports_is_allowed(): void
    {
        $url = $this->workboxUrl();
        $script = $this->directive('script-src');

        $allowed = false;

        foreach (preg_split('/\s+/', $script) as $source) {
            if ($source !== '' && str_starts_with($url, rtrim($source, '/').'/')) {
                $allowed = true;
                break;
            }
        }

        $this->assertTrue(
            $allowed,
            "script-src does not admit {$url}. Under enforcement importScripts fails and the "
            .'whole service worker dies with it — push, offline and precache together.'
        );
    }

    /**
     * 🚨 THE CONTROL, AND THE POINT OF THE WHOLE EXERCISE. A bare
     * `storage.googleapis.com` admits every public Google Cloud Storage bucket
     * there is, which is not an allowlist. The source must carry its path.
     */
    public function test_the_bucket_host_is_never_allowed_whole(): void
    {
        $this->assertStringNotContainsString(
            'https://storage.googleapis.com ',
            $this->directive('script-src').' ',
            'storage.googleapis.com is allowed without a path — anybody can host a script there.'
        );
    }

    /**
     * ⚠️ A `fetch` is `connect-src` whatever it returns, so the hosts the worker
     * caches from need admitting here as well as in style-src/font-src.
     */
    public function test_the_worker_may_cache_the_font_and_cdn_hosts(): void
    {
        $connect = $this->directive('connect-src');

        foreach (['https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'] as $host) {
            $this->assertStringContainsString(
                $host,
                $connect,
                "connect-src refuses {$host}, so the worker cannot cache it."
            );
        }
    }

    /**
     * ⚠️ Widening connect-src must not quietly widen the rest. `default-src` is
     * what everything unnamed falls back to and it stays closed.
     */
    public function test_the_policy_is_still_closed_by_default(): void
    {
        $this->assertStringContainsString("default-src 'self'", $this->policy());
        $this->assertStringContainsString("object-src 'none'", $this->policy());
        $this->assertStringContainsString("base-uri 'self'", $this->policy());
    }
}
