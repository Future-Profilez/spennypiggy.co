<?php

namespace App\Http\Middleware;

use App\Models\Logs;
use App\Models\MonthlyCharge;
use App\Models\SocialLinks;
use App\Models\UserVerificationStatus;
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

        if (!$user || $user->role == 0) {
            return $next($request);
        }

        $isBioSocialVerified = UserVerificationStatus::where('user_id', $user->id)
            ->where('bio_status', 1)
            ->where('social_status', 1)
            ->where('address_status', 1)
            ->exists();

        $hasPaidSubscription = MonthlyCharge::where('user_id', $user->id)
            ->where('status', 'paid')
            ->exists();

        $needsIdentityVerification = $user->role == 1
            && $user->identity_status == 0
            && $user->avatar_approved == 1
            && $isBioSocialVerified
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
