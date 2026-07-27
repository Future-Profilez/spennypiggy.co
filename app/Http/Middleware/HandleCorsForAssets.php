<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class HandleCorsForAssets
{
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
