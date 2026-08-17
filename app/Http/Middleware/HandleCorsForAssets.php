<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class HandleCorsForAssets
{
    /**
     * 🚨 A SERVICE WORKER IS NOT A STATIC ASSET.
     *
     * This middleware runs AFTER the route, so its blanket `.js` rule below
     * OVERWROTE the `Cache-Control: no-cache` the service-worker route sets on
     * itself — the worker that decides push delivery and asset caching was being
     * served with `max-age=31536000`. Browsers bypass the HTTP cache for a
     * top-level worker script only once the cached copy is 24h old, so a deploy
     * could sit a full day behind on every installed app, and any proxy in front
     * would happily hold it for a year.
     *
     * These paths keep whatever cache header their own route decided.
     */
    private const NEVER_CACHE = [
        'service-worker.js',
        'new-service-worker.js',
        'sw.js',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response|RedirectResponse)  $next
     * @return Response|RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Check if this is a request for font assets
        $path = $request->path();

        if (in_array(ltrim($path, '/'), self::NEVER_CACHE, true)) {
            return $response;
        }
        if (preg_match('/\.(woff|woff2|eot|ttf|otf)$/i', $path)) {
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
            $response->headers->set('Cache-Control', 'public, max-age=31536000');

            // Handle preflight requests
            if ($request->getMethod() === 'OPTIONS') {
                $response->setStatusCode(200);
            }
        }

        // Add performance headers for all assets
        if (preg_match('/\.(css|js|png|jpg|jpeg|gif|svg|webp|avif|ico|woff|woff2|eot|ttf|otf)$/i', $path)) {
            $response->headers->set('Cache-Control', 'public, max-age=31536000');
            $response->headers->set('Expires', gmdate('D, d M Y H:i:s', time() + 31536000).' GMT');
        }

        return $response;
    }
}
