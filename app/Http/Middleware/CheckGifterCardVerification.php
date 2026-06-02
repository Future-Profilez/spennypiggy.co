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
        if (!empty($user) && $user->role === 0 && $user->is_500_limit_exceeded == 1 && $user->profile_status_lock != 2) {
            $isVerified = $user->gifterCardVerification()
                ->where('status', 'success')
                ->exists();
            if (!$isVerified || $user->profile_status_lock != 2){
                $gifterCard = $user->gifterCardVerification()->first();
                $status = $gifterCard && $gifterCard->status === 'success';
                if ($request->wantsJson() || $request->is('api/*')) {
                    return response()->json([
                        'status' => false,
                        'card_verification_required' => true,
                        'message' => 'Please complete your card verification process.',
                    ]);
                }
                return Inertia::location(route('gifter.card.verification'));
            }
        }
        return $next($request);
    }
}
