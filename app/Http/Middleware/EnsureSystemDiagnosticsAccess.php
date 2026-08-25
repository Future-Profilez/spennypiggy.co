<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates the system-diagnostics screen behind a hand-off from the admin app.
 *
 * The screen used to carry no authentication at all in any environment, because
 * this app's `admin` middleware checks `users.role === '2'` and nobody holds
 * that role — the real administrators are rows in the `admins` table, which this
 * app has no auth guard for. So the choice was "open to anyone with the URL" or
 * "closed to everyone", and open was picked.
 *
 * This is the third option: the admin app, which DOES authenticate admins
 * (`auth:admin` + `2fa`), mints a short-lived signed link; hitting it unlocks
 * the session here for a while. Nothing about this app's auth changes.
 *
 * ⚠️ A refusal is a 404, not a 403. A 403 confirms the page exists to anyone who
 * guesses the path, and the whole point of this middleware is that the URL alone
 * is no longer worth having.
 */
class EnsureSystemDiagnosticsAccess
{
    /** Session key holding the unix timestamp the current unlock expires at. */
    public const SESSION_KEY = 'sysdiag_unlocked_until';

    public function handle(Request $request, Closure $next): Response
    {
        // Local and testing stay open — the page is a development tool there,
        // and requiring a second app to be running to look at it would mean it
        // simply stops being used.
        if (app()->environment('local', 'testing')) {
            return $next($request);
        }

        $until = (int) $request->session()->get(self::SESSION_KEY, 0);

        if ($until <= time()) {
            $request->session()->forget(self::SESSION_KEY);

            abort(404);
        }

        return $next($request);
    }
}
