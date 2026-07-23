<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Closes a route anywhere except a developer's own machine.
 *
 * Scratch routes accumulate. They send real email, call Stripe and print debug
 * output, and they are written without auth because "it's just a test route" —
 * then they ship. `!app()->isProduction()` is not a substitute: the dev
 * deployment is a publicly reachable host too.
 *
 * 404, not 403: a closed route should not confirm it exists.
 */
class LocalOnly
{
    public function handle(Request $request, Closure $next): mixed
    {
        abort_unless(app()->environment(['local', 'testing']), 404);

        return $next($request);
    }
}
