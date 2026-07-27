<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $nonce = base64_encode(random_bytes(16));
        View::share('cspNonce', $nonce);

        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-origin');

        $csp = "default-src 'self' data: blob: https: http:; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: https: http:; font-src 'self' https: http: data:; connect-src 'self' https: http: wss: ws:; script-src 'self' 'nonce-{$nonce}' https: http: https://js.stripe.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https: http:; frame-src 'self' https: http: https://js.stripe.com https://challenges.cloudflare.com https://ucarecdn.com https://*.uploadcare.com";

        if (! app()->environment('local')) {
            $response->headers->set('Content-Security-Policy', $csp);
        }

        return $response;
    }
}
