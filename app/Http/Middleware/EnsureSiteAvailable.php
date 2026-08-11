<?php

namespace App\Http\Middleware;

use App\Support\MaintenanceMode;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Serves the maintenance wall while the platform is intentionally offline.
 *
 * Registered in the GLOBAL stack, after TrustProxies (the IP allowlist needs the
 * real client address) and before StartSession/Inertia — building a session and a
 * page of shared props for a request that is about to be refused is wasted work
 * against a database that may be the reason we are down.
 *
 * ⚠️ The response is 503 with Retry-After, never 200. A maintenance page served
 * as 200 is a page Google indexes: the whole site becomes "we'll be back soon" in
 * the results, and it stays that way long after the window closes.
 */
class EnsureSiteAvailable
{
    public function handle(Request $request, Closure $next): Response
    {
        // Cheapest check first, and it is what keeps webhooks and asset requests
        // from touching the database at all.
        if (MaintenanceMode::isExempt($request)) {
            return $next($request);
        }

        $state = MaintenanceMode::state();

        if (! MaintenanceMode::isDown($state)) {
            return $next($request);
        }

        if (MaintenanceMode::hasBypass($request, $state)) {
            return $next($request);
        }

        $retryAfter = MaintenanceMode::retryAfterSeconds($state);

        // An API/XHR caller gets JSON. Handing an axios call an HTML page renders
        // as an unparseable blob and the frontend reports something misleading.
        if ($request->expectsJson()) {
            $response = response()->json([
                'maintenance' => true,
                'headline' => $state['headline'],
                'message' => $state['message'],
                'ends_at' => $state['ends_at'],
            ], 503);
        } else {
            $response = response()->view('maintenance', [
                'headline' => $state['headline'],
                'message' => $state['message'],
                'endsAt' => $state['ends_at'],
            ], 503);
        }

        return $response->withHeaders([
            'Retry-After' => (string) $retryAfter,
            'X-Robots-Tag' => 'noindex, nofollow',
            // A wall must never be cached by CloudFront or a browser — it would
            // outlive the window it describes.
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
        ]);
    }
}
