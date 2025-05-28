<?php

namespace App\Http\Middleware;

use App\Models\MonthlyCharge;
use App\Models\UserVerificationStatus;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Closure;

class ProfileStatusLock
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (!$user) {
            return $next($request);
        }

        $isSocialVerified = UserVerificationStatus::where('user_id', $user->id)
            ->where('user_profile_status', 2)
            ->exists();

        $needsVerification = $user->profile_status_lock == 0
            && $isSocialVerified;
        // dd($isSocialVerified, $user->profile_status_lock);
        if ($needsVerification) {
            return Inertia::render('Auth/RejectedProfile', [
                'status' => false,
                'data' => $user,
                'message' => 'Please complete your Stripe identity verification.',
            ]);
        }

        return $next($request);
    }
}
