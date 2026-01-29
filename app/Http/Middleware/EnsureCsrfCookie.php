<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class EnsureCsrfCookie
{
    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        $response = $next($request);
        $hasCookie = $request->cookies->has('XSRF-TOKEN');
        if (!$hasCookie) {
            $cookie = cookie('XSRF-TOKEN', csrf_token(), config('session.lifetime'), '/', config('session.domain'), (bool) config('session.secure'), false, false, config('session.same_site'));
            $response->headers->setCookie($cookie);
        }
        return $response;
    }
}
