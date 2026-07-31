<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CheckStripeIdentityVerification
{
    /**
     * Handle an incoming request.
     *
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (! $user) {
            return redirect()->route('login')->with('error', 'please login first');
        }

        $hasPaidSubscription = in_array($user->subscription_status, [1, 2]);

        // ⚠️ Identity is demanded only AFTER Stripe Connect is complete (31 July 2026).
        //
        // Stripe Identity bills the platform per check. Connect onboarding costs us
        // nothing and asks for bank details plus Stripe's own KYC, so gating the paid
        // check behind it means we only pay for creators who have already proved they
        // are serious. Without `stripe_details_submitted` here, every creator with an
        // approved profile and a card on file was pushed into a billable check — and
        // under free-until-first-sale they now sit at subscription_status 2 for as
        // long as it takes them to sell, so `$hasPaidSubscription` is true for far
        // more people than it used to be.
        $needsIdentityVerification = $user->role == 1
            && $user->profile_status_lock == 2
            && $user->stripe_details_submitted == 1
            && $user->identity_status != 1
            // && $isBioSocialVerified
            && $hasPaidSubscription;

        if ($needsIdentityVerification) {
            return Inertia::render('Auth/StripeIdentity', [
                'status' => false,
                'data' => $user,
                'message' => 'Please complete your Stripe identity verification.',
            ]);
        }

        return $next($request);
    }
}
