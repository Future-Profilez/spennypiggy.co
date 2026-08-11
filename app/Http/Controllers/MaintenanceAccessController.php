<?php

namespace App\Http\Controllers;

use App\Support\MaintenanceMode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;

/**
 * Exchanges a bypass token for a cookie, so whoever is doing the maintenance can
 * verify the site BEFORE lifting the wall for everyone.
 *
 * Deploying blind and then lifting the wall to discover the deploy is broken is
 * the failure this exists to prevent — which is why the route is exempt from the
 * wall in MaintenanceMode::EXEMPT_PREFIXES.
 *
 * The token in the URL IS the credential, so this route is throttled, sends
 * X-Robots-Tag and Referrer-Policy, and never confirms whether a wrong token was
 * close: a bad token and a site that is simply up look identical.
 */
class MaintenanceAccessController extends Controller
{
    public function __invoke(Request $request, string $token): RedirectResponse
    {
        $state = MaintenanceMode::state();
        $expected = $state['bypass_token'];

        $redirect = redirect('/')->withHeaders([
            'X-Robots-Tag' => 'noindex, nofollow',
            // The URL is the secret — do not hand it to the next site in a header.
            'Referrer-Policy' => 'no-referrer',
            'Cache-Control' => 'no-store',
        ]);

        if (! $expected || ! hash_equals($expected, $token)) {
            // Deliberately silent. Saying "invalid bypass token" on a public URL
            // confirms the mechanism exists and that this one was merely wrong.
            return $redirect;
        }

        return $redirect->withCookie(
            Cookie::make(
                MaintenanceMode::BYPASS_COOKIE,
                $token,
                MaintenanceMode::BYPASS_HOURS * 60,
                '/',
                null,
                config('session.secure', false),
                true,   // httpOnly — no page needs to read this
                false,
                'lax'
            )
        );
    }
}
