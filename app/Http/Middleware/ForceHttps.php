<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ForceHttps
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->isSecure()) {
            $secureUrl = 'https://' . $request->getHttpHost() . $request->getRequestUri();
            return redirect()->secure($request->getRequestUri(), 301);
        }
        return $next($request);
    }
}

