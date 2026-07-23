<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Kill-switch for the RYE physical-goods gifting feature.
 *
 * RYE predates the content-first compliance rebuild and is not cleared for
 * production (business model / Merchant-of-Record / consumer-law sign-off is
 * still outstanding). This middleware closes every RYE entry point unless
 * `RYE_ENABLED=true`, so the feature can never go live by accident.
 *
 * 404, not 403: a disabled feature should not confirm its routes exist.
 */
class EnsureRyeEnabled
{
    public function handle(Request $request, Closure $next): mixed
    {
        abort_unless(config('services.rye.enabled'), 404);

        return $next($request);
    }
}
