<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class PreventBackHistory
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Skip for binary file downloads or streamed responses to prevent interruption
        if ($response instanceof \Symfony\Component\HttpFoundation\BinaryFileResponse || 
            $response instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $response;
        }

        // For all authenticated responses (or attempts to authenticate), ensure no caching
        // This includes login, dashboard, and any user-specific pages
        $response->headers->set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', 'Sat, 01 Jan 1990 00:00:00 GMT');

        return $response;
    }
}
