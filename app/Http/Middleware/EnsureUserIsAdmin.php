<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        // role 2 is Admin, role 1 is Creator, role 0 is Gifter
        if (!$user || (string) $user->role !== '2') {
            abort(403);
        }

        return $next($request);
    }
}

