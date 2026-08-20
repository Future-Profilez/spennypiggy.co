<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\Discovery\AttributionService;
use App\Services\VisitTracker;
use App\Support\DiscoverySources;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Discovery Phase 1 — records a profile visit and remembers the source.
 *
 * ⚠️ SEPARATE FROM `TrackSiteVisit`, deliberately, even though both run on a
 * page view. That class counts anonymous aggregates and its docblock guarantees
 * it stores no personal data — a property that is load-bearing for consent and
 * for deletion requests. This one writes a row naming a creator and a visitor,
 * so folding it in would quietly break that guarantee. Two jobs, two files.
 *
 * Runs AFTER the response, like its neighbour: attribution must never sit
 * between a supporter and a creator's page, and everything is wrapped so a
 * failure logs rather than 500s.
 */
class TrackDiscoveryVisit
{
    public function __construct(private AttributionService $attribution) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        try {
            if (! $this->isProfileView($request, $response)) {
                return $response;
            }

            $creator = $this->creatorFor($request);

            if ($creator === null) {
                return $response;
            }

            // An explicit tag on the URL is what starts an attribution window.
            // Without one we may still record a visit, using whatever source the
            // cookie already remembers for this creator.
            $tagged = DiscoverySources::normalise($request->query(DiscoverySources::PARAM));

            if ($tagged !== null) {
                $map = $this->attribution->withSource($request, $creator->id, $tagged);

                Cookie::queue(Cookie::make(
                    DiscoverySources::COOKIE,
                    json_encode($map),
                    60 * 24 * DiscoverySources::WINDOW_DAYS,
                    null,
                    null,
                    (bool) config('session.secure'),
                    true,   // httpOnly — nothing in the browser needs to read it
                    false,
                    'lax'
                ));

                // ⚠️ The cookie is queued on the RESPONSE, so it is not on the
                // request this attribution service is about to read. Put it
                // there by hand or the very first tagged visit — the one that
                // matters most — records with no source.
                $request->cookies->set(DiscoverySources::COOKIE, json_encode($map));
            }

            $this->attribution->recordVisit($request, $creator);
        } catch (\Throwable $e) {
            Log::warning('TrackDiscoveryVisit failed', ['error' => $e->getMessage()]);
        }

        return $response;
    }

    /**
     * A real view of a creator profile.
     *
     * ⚠️ Route NAME, never the path — `/{username}/{page?}` is a catch-all, so
     * path matching cannot tell a profile from an app page. Same reason
     * `VisitTracker::PROFILE_ROUTE` exists.
     */
    private function isProfileView(Request $request, Response $response): bool
    {
        if (! $request->isMethod('GET') || $response->getStatusCode() !== 200) {
            return false;
        }

        if ($request->header('X-Inertia-Partial-Data')) {
            return false;
        }

        // Prefetches are not visits.
        $purpose = strtolower((string) ($request->header('Sec-Purpose') ?? $request->header('Purpose') ?? ''));

        if (str_contains($purpose, 'prefetch') || str_contains($purpose, 'preview')) {
            return false;
        }

        return $request->route()?->getName() === VisitTracker::PROFILE_ROUTE;
    }

    private function creatorFor(Request $request): ?User
    {
        $username = $request->route('username');

        if (! is_string($username) || $username === '') {
            return null;
        }

        return User::query()
            ->where('username', $username)
            ->select('id', 'username')
            ->first();
    }
}
