<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckGifterCardVerification
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        if (!$user){
            return $next($request);
        }
        if (!empty($user) && $user->role === 0 && $user->is_uk == 0 && $user->is_500_limit_exceeded == 1 && $user->profile_status_lock != 2) {
            $isVerified = $user->gifterCardVerification()
                ->where('status', 'success')
                ->exists();
            if (!$isVerified || $user->profile_status_lock != 2){
                $gifterCard = $user->gifterCardVerification()->first();
                $status = $gifterCard && $gifterCard->status === 'success';
                return Inertia::render('gifter/GifterCardVerification', [
                    'gifterCardVerification' => $status,
                    'status' => false,
                    'message' => 'Please complete your card verification process.',
                ]);
            }
        }
        return $next($request);
    }
}
