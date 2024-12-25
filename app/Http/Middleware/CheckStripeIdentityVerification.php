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
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        // Check if the user's identity_status is not verified (0)
        if ($user && $user->identity_status !== 1) {
            // Redirect to the Stripe identity verification page
            return Inertia::render('Auth/StripeIdentity', [
                'status' => false,
                'data' => $user,
                'message' => 'Please complete your Stripe identity verification.',
            ]);
        }

        // If verified, allow the request to proceed
        return $next($request);
    }
}
