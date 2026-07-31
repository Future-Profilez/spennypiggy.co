<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * A creator must have completed identity verification before they can LIST anything.
 *
 * This is where the identity requirement moved to (31 July 2026). It used to sit in
 * front of Stripe Connect, which meant the platform paid Stripe for an identity check
 * on every creator who merely got a profile approved. Connect onboarding is free to us
 * and demands bank details plus Stripe's own KYC, so putting Connect first and the paid
 * check here means only creators who have done real work reach the cost.
 *
 * ⚠️ Browsing is deliberately NOT blocked. A creator can explore the whole platform,
 * set up their profile and connect payouts unverified — they simply cannot put
 * something up for sale, which is the only action that needs the check.
 */
class EnsureIdentityVerifiedForListings
{
    /** Set on `users.identity_status` once Stripe reports the check passed. */
    public const VERIFIED = 1;

    /** Submitted to Stripe, awaiting a result. The creator has nothing left to do. */
    public const SUBMITTED = 2;

    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (! $user) {
            return redirect()->route('login')->with('error', 'Please log in first.');
        }

        // Fans never list anything; this gate has nothing to say about them.
        if ((int) $user->role !== 1) {
            return $next($request);
        }

        if ((int) ($user->identity_status ?? 0) === self::VERIFIED) {
            return $next($request);
        }

        $message = (int) ($user->identity_status ?? 0) === self::SUBMITTED
            ? 'Your identity check is being reviewed. You can list items as soon as it clears.'
            : 'Verify your identity before listing an item. It takes a couple of minutes.';

        // ⚠️ Three callers, three correct answers. The add-item forms on this
        // platform are split between Inertia and plain axios, and giving either
        // one the other's response surfaces as a form that spins forever with
        // nothing explaining why.
        //
        // Inertia FIRST: an Inertia request also sets X-Requested-With, so an
        // `ajax()` check alone catches it and answers with raw JSON, which Inertia
        // renders as an error modal rather than a message the creator can act on.
        // A redirect is what Inertia understands — it follows it and the flash
        // lands on the page they were already on.
        if ($request->header('X-Inertia')) {
            return back()->with('error', $message);
        }

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'status' => false,
                'identity_required' => true,
                'message' => $message,
            ], 403);
        }

        return redirect()
            ->route('stripe.identity.verification')
            ->with('error', $message);
    }
}
