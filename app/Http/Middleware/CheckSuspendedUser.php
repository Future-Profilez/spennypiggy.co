<?php

namespace App\Http\Middleware;

use App\Support\SuspendedAccount;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * A suspended account can SIGN IN, READ, and DO NOTHING ELSE.
 *
 * 🚨 THIS USED TO FORCE-LOGOUT ON EVERY REQUEST. The account holder was bounced
 * to the login screen with one sentence and no way back in, which meant the one
 * person who needed to read the reason, open their own history, and message
 * support was the only person who could not. Suspension is now a state of the
 * account, not a lock on the door: they sign in, they see a banner naming the
 * reason, and every write is refused.
 *
 * 🚨 THE RULE IS "READS OPEN, WRITES DENIED BY DEFAULT", NOT A LIST OF BLOCKED
 * PAGES. A denylist of suspended-user routes is wrong the moment somebody adds a
 * route and does not think of this file — and the routes worth forgetting are
 * the ones that move money. So: GET/HEAD/OPTIONS pass, every other verb is
 * refused unless its route name is in `config('suspension.allowed_write_routes')`.
 *
 * ⚠️ IT IS NOT THE ONLY GATE, AND MUST NOT BE TREATED AS ONE. Some purchases
 * start on a GET (the bill and membership checkout URLs), so the payer-side
 * check in those controllers is what stops a suspended creator paying somebody;
 * and the creator-side refusal that stops money coming IN lives in
 * `CreatorSubscriptionService::validateCreatorSubscription`, because guest
 * checkout has no session for this middleware to read. Three gates, three
 * different callers — see `SuspendedAccount`.
 */
class CheckSuspendedUser
{
    public function handle(Request $request, Closure $next)
    {
        if (! Auth::check()) {
            return $next($request);
        }

        if (! SuspendedAccount::isSuspended(Auth::user())) {
            return $next($request);
        }

        // Reads stay open: the banner, their own transaction history, their own
        // settings and the support form are all GETs, and refusing them would
        // recreate the lockout this replaced.
        if ($request->isMethodSafe()) {
            return $next($request);
        }

        $routeName = optional($request->route())->getName();

        if ($routeName && in_array($routeName, (array) config('suspension.allowed_write_routes', []), true)) {
            return $next($request);
        }

        $copy = SuspendedAccount::copyFor(Auth::user());

        // ⚠️ A bare `abort(403)` would render the generic forbidden page, which
        // says "you do not have access to this" — true but useless here, and
        // indistinguishable from a permissions bug. The reason travels with the
        // refusal so the message is the same wherever it lands.
        if ($request->expectsJson()) {
            return response()->json([
                'status' => false,
                'suspended' => true,
                'message' => $copy['body'],
            ], 403);
        }

        return back()->withErrors(['account' => $copy['body']]);
    }
}
