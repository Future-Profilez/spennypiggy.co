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

        $needsIdentityVerification = $user->role == 1
            && $user->profile_status_lock == 2
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
