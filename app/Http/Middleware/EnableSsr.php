<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Ssr\BundleDetector;
use Symfony\Component\HttpFoundation\Response;

/**
 * Turns SSR on for the route it is attached to, and only that route.
 *
 * `inertia.ssr.enabled` stays false globally on purpose. Rendering the whole
 * app server-side would push every dashboard, checkout and profile through the
 * Node host — more latency, more to go wrong, and no SEO gained, because none
 * of those pages are crawled. The marketing pages are the only ones that need
 * to exist in view-source.
 *
 * Inertia reads the config at dispatch time (Ssr\HttpGateway::dispatch), so
 * setting it here, per request, is enough.
 */
class EnableSsr
{
    public function handle(Request $request, Closure $next): Response
    {
        if (static::willRender($request)) {
            config(['inertia.ssr.enabled' => true]);
        }

        return $next($request);
    }

    /**
     * Will this request actually be server-rendered?
     *
     * 🚨 `StaticPageSeoMiddleware` READS THIS TO DECIDE WHO OWNS THE SOCIAL
     * TAGS, so it is not merely an extracted condition — the two middleware
     * must agree, or a page ends up with two og:title tags (whichever Google
     * picks is then a coin toss) or with none at all. It is one method for
     * that reason; do not inline either copy.
     *
     * ⚠️ `StaticPageSeoMiddleware` runs in the `web` GROUP and this one is a
     * ROUTE middleware, so this method is called there BEFORE `handle()` has
     * run here. It must therefore depend only on the request and on config,
     * never on state `handle()` sets.
     *
     * Signed-in visitors are skipped for two reasons: they are not the crawler
     * this exists for, and their shared props carry personal data that would
     * otherwise be POSTed to the render host on every page view.
     */
    public static function willRender(Request $request): bool
    {
        if ($request->user() || ! config('inertia.ssr.url')) {
            return false;
        }

        // The same gate Inertia's own gateway applies. Without the bundle on
        // this machine no render is attempted at all — which is the state of a
        // fresh checkout and of CI, where the SEO middleware must stay in
        // charge of the tags.
        return (bool) (new BundleDetector)->detect();
    }
}
