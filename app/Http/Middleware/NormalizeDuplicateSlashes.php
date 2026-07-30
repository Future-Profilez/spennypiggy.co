<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Collapse repeated slashes in the request path and redirect to the clean URL.
 *
 * A path like //admin/emulate-login/ reaches the app fine, but the browser's
 * History API refuses it: pushState resolves a leading "//" as a
 * protocol-relative URL, so the SPA tried to move to https://admin/... and threw
 * a SecurityError that left the page wedged. It is also duplicate content for a
 * crawler. Redirecting once, permanently, fixes both.
 */
class NormalizeDuplicateSlashes
{
    public function handle(Request $request, Closure $next)
    {
        $path = $request->getPathInfo();

        // GET/HEAD only, listed explicitly. A 301/302 makes the browser re-issue the
        // request as a GET, so redirecting a POST would drop its body and the
        // submission would fail silently. Request::isMethodSafe() is the wrong test
        // here because it also covers OPTIONS: this middleware runs before
        // HandleCors, so a CORS preflight would be answered with a redirect instead
        // of the preflight headers and the real request would never be sent.
        if (! in_array($request->getMethod(), ['GET', 'HEAD'], true) || ! str_contains($path, '//')) {
            return $next($request);
        }

        $normalised = preg_replace('#/{2,}#', '/', $path);
        $query = $request->getQueryString();

        return redirect($normalised.($query ? '?'.$query : ''), 301);
    }
}
