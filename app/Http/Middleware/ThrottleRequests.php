<?php

namespace App\Http\Middleware;

use Illuminate\Routing\Middleware\ThrottleRequests as Middleware;

/**
 * Per-ROUTE throttling.
 *
 * 🚨 Laravel's own signature for a numeric `throttle:N,M` is
 * `sha1($route->getDomain().'|'.$request->ip())` for a guest, and
 * `sha1($userId)` for a signed-in caller — the route is NOT part of it. So every
 * bare `throttle:` route on this domain shared ONE counter, and the tightest
 * limit among them became the effective limit for all of them.
 *
 * That is how a signup died on its FIRST submit: the register form's debounced
 * `register/validate` calls, `username-availablity` and the referral-code check
 * all incremented the same counter, and `POST register` then read it against its
 * own maximum and answered 429 — for a person who had submitted nothing yet.
 * The decay window was whichever route happened to hit first, so the same flow
 * failed differently depending on typing order, and nothing in any log named a
 * route that had actually been called too often.
 *
 * The signature below adds the route's identity (uri + verbs), which is what
 * every one of those `->middleware('throttle:N,M')` declarations already reads
 * as if it meant. Nothing else changes: an authenticated caller is still keyed
 * by user id so their limit follows them across IPs, and a guest by IP.
 *
 * ⚠️ NAMED limiters (`throttle:register`, `throttle:api`) never reach this
 * method — they build their own key from the RateLimiter::for closure — so this
 * override cannot affect them.
 */
class ThrottleRequests extends Middleware
{
    protected function resolveRequestSignature($request)
    {
        $route = $request->route();

        $caller = $request->user()?->getAuthIdentifier() ?: $request->ip();

        // No route (a global middleware hit) leaves only the caller, which is
        // the framework's own behaviour minus the exception it would throw.
        $target = $route
            ? $route->getDomain().'|'.$route->uri().'|'.implode(',', $route->methods())
            : 'no-route';

        return sha1($target.'|'.$caller);
    }
}
