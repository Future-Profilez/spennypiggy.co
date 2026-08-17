<?php

namespace App\Http\Middleware;

use App\Services\VisitTracker;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Counts a page view, and remembers the source a visitor first arrived from.
 *
 * Runs AFTER the response is built, so nothing here is on the path between the
 * request and the page. Everything is wrapped: analytics must never be the
 * reason a page fails to load.
 */
class TrackSiteVisit
{
    public function __construct(private VisitTracker $tracker) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        try {
            if (! $this->shouldCount($request, $response)) {
                return $response;
            }

            // "New visitor" means no cookie yet today. The cookie holds a random
            // value with no meaning and is never read back for identification —
            // its presence alone is the signal.
            $isNewVisitor = ! $request->cookies->has(VisitTracker::VISITOR_COOKIE);

            $source = $this->tracker->record($request, $isNewVisitor);

            // Secure flag follows session config — hardcoding true means the
            // browser drops the cookie on plain-http dev, so every request
            // looks like a brand-new visitor and uniques triple.
            $secure = (bool) config('session.secure');

            if ($isNewVisitor) {
                Cookie::queue(
                    Cookie::make(VisitTracker::VISITOR_COOKIE, (string) Str::uuid(), 60 * 24, null, null, $secure, true, false, 'lax')
                );
            }

            // The paid-ads landing page they arrived on, remembered on the same
            // first-touch rule as the source. Someone who clicks the Founder
            // Bonus advert, reads three other pages and signs up two days later
            // is still credited to Founder Bonus — the last page before the
            // form is almost always /register, which tells us nothing.
            $adLanding = $this->tracker->resolveAdLanding($request);

            if ($adLanding !== null && ! $request->cookies->has(VisitTracker::LANDING_COOKIE)) {
                Cookie::queue(
                    Cookie::make(
                        VisitTracker::LANDING_COOKIE,
                        $adLanding,
                        60 * 24 * VisitTracker::ATTRIBUTION_DAYS,
                        null, null, $secure, true, false, 'lax'
                    )
                );
            }

            // First touch wins: if someone arrives from Reddit and comes back
            // direct a week later before signing up, Reddit gets the credit.
            if ($source && $source !== 'direct' && ! $request->cookies->has(VisitTracker::ATTRIBUTION_COOKIE)) {
                Cookie::queue(
                    Cookie::make(
                        VisitTracker::ATTRIBUTION_COOKIE,
                        $source,
                        60 * 24 * VisitTracker::ATTRIBUTION_DAYS,
                        null, null, $secure, true, false, 'lax'
                    )
                );
            }
        } catch (\Throwable $e) {
            Log::warning('TrackSiteVisit failed', ['error' => $e->getMessage()]);
        }

        return $response;
    }

    /**
     * Only real page views count.
     *
     * The site is an SPA: after the first full load, every page-to-page move is
     * an Inertia XHR request. Those ARE page views and must count — excluding
     * all AJAX silently dropped every navigation after the first, which starved
     * the supporter funnel in particular (visitors land on the home page and
     * *navigate* to creator profiles). Partial reloads are the exception: they
     * refresh props on a page the visitor is already looking at.
     */
    private function shouldCount(Request $request, Response $response): bool
    {
        if (! $request->isMethod('GET')) {
            return false;
        }

        if ($request->header('X-Inertia-Partial-Data')) {
            return false;
        }

        // Non-Inertia AJAX (polling, autocomplete, notification checks) is not a
        // page view.
        if ($request->ajax() && ! $request->header('X-Inertia')) {
            return false;
        }

        // Browsers prefetch links the visitor may never click.
        $purpose = strtolower((string) ($request->header('Sec-Purpose') ?? $request->header('Purpose') ?? ''));

        if (str_contains($purpose, 'prefetch') || str_contains($purpose, 'preview')) {
            return false;
        }

        // 200 only: a redirect is not a page view (the page it lands on will
        // count), and an error page is not a visit.
        if ($response->getStatusCode() !== 200) {
            return false;
        }

        $path = trim($request->path(), '/');

        foreach (['api', 'webhook', 'health', 'build', 'storage', 'livewire', '_debugbar', 'dev'] as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix.'/')) {
                return false;
            }
        }

        return true;
    }
}
