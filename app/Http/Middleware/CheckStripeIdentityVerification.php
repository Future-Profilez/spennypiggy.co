<?php

namespace App\Http\Middleware;

use App\Models\Logs;
use App\Models\MonthlyCharge;
use App\Models\SocialLinks;
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
    // public function handle(Request $request, Closure $next)
    // {
    //     $user = Auth::user();

    //     if (!$user || $user->role !== 1 || $user->avatar_approved !== 1) {
    //         return $next($request);
    //     }

    //     // Check for pending about me edits
    //     $hasPendingEdit = Logs::where('edited_about_me_id', $user->id)
    //         ->where('status', 'pending')
    //         ->exists();

    //     if ($hasPendingEdit) {
    //         return $next($request);
    //     }

    //     // Check for at least one filled social link
    //     $hasSocialLinks = SocialLinks::where('user_id', $user->id)
    //         ->where(function ($query) {
    //             $query->whereNotNull('twitter')
    //                 ->orWhereNotNull('instagram')
    //                 ->orWhereNotNull('tumblr')
    //                 ->orWhereNotNull('twitch')
    //                 ->orWhereNotNull('facebook');
    //         })
    //         ->exists();

    //     if (!$hasSocialLinks) {
    //         return $next($request);
    //     }

    //     // Check if user has an active paid subscription
    //     $isSubscribed = MonthlyCharge::where('user_id', $user->id)
    //         ->where('status', 'paid')
    //         ->exists();
    //     // dd($isSubscribed);

    //     if ($isSubscribed) {
    //         return Inertia::render('Auth/StripeIdentity', [
    //             'status' => false,
    //             'data' => $user,
    //             'message' => 'Please complete your Stripe identity verification.',
    //         ]);
    //     }

    //     return $next($request);
    // }

    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (!$user) {
            return $next($request);
        }

        $logs = Logs::where('edited_about_me_id', $user->id)->where('status', 'pending')->exists();

        $socialLink = SocialLinks::where('user_id', $user->id)->where(function ($q) {
            $q->where('twitter', '!=', null)
                ->orWhere('instagram', '!=', '')
                ->orWhere('tumblr', '!=', '')
                ->orWhere('twitch', '!=', '')
                ->orWhere('facebook', '!=', '');
        })->exists();

        if ($user && $user->role == 1 && $user->identity_status == 0 && $user->avatar_approved == 1 && empty($logs) && !empty($socialLink)) {

            $subscriptionCheck = MonthlyCharge::where('user_id', $user->id)
                ->where('status', 'paid')
                ->exists();

            // Check if the user's identity_status is not verified (0)
            if ($subscriptionCheck) {
                // dd($user);
                // Redirect to the Stripe identity verification page
                return Inertia::render('Auth/StripeIdentity', [
                    'status' => false,
                    'data' => $user,
                    'message' => 'Please complete your Stripe identity verification.',
                ]);
            }
        }

        // If verified, allow the request to proceed
        return $next($request);
    }
}
