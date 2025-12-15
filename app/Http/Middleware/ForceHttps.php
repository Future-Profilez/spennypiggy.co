<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ForceHttps
{
    public function handle(Request $request, Closure $next)
    {
        // Bypass in non-production environments and for localhost
        if (app()->environment('local', 'development', 'testing') ||
            in_array($request->getHost(), ['127.0.0.1', 'localhost', '[::1]']) ||
            Str::startsWith(config('app.url'), 'http://')) {
            return $next($request);
        }

        if (!$request->isSecure()) {
            return redirect()->secure($request->getRequestUri(), 301);
        }
        return $next($request);
    }
}
