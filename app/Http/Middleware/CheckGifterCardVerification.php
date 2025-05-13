<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        // Only apply the logic for gifter users (role = 0) who are not from the UK
        if ($user->role === 0 && $user->is_uk == 0) {
            // Check if the user has a successful gifterCardVerification
            $isVerified = $user->gifterCardVerification()
                ->where('status', 'success')
                ->exists();

            if (!$isVerified) {
                // Attempt to retrieve gifterCardVerification status for messaging
                $gifterCard = $user->gifterCardVerification()->first();

                $status = $gifterCard && $gifterCard->status === 'success';

                return Inertia::render('gifter/GifterCardVerification', [
                    'gifterCardVerification' => $status,
                    'status' => false,
                    'message' => 'Please complete your card verification payment.',
                ]);
            }
        }

        return $next($request);
    }

    // public function handle(Request $request, Closure $next)
    // {
    //     $user_id = Auth::user();

    //     $user = User::where('id', $user_id->id)
    //         ->where('is_uk', 0)
    //         ->where('role', 0)
    //         ->whereHas('gifterCardVerification', function ($query) use ($user_id) {
    //             $query->where('user_id', $user_id->id)->where('status', 'success');
    //         })
    //         ->first();
    //     if ($user_id->role == 0) {
    //         if (!$user) {
    //             $gifterCardVerification = User::where('id', $user_id->id)
    //                 ->where('is_uk', 0)
    //                 ->where('role', 0)
    //                 ->whereHas('gifterCardVerification', function ($query) use ($user_id) {
    //                     $query->where('user_id', $user_id->id);
    //                 })
    //                 ->with('gifterCardVerification') // eager load the related model
    //                 ->first();

    //             $status = false;
    //             if ($gifterCardVerification && $gifterCardVerification->gifterCardVerification) {
    //                 $verificationStatus = $gifterCardVerification->gifterCardVerification->status;
    //                 $status = $verificationStatus === 'success';
    //             }

    //             return Inertia::render('gifter/GifterCardVerification', [
    //                 'gifterCardVerification' => $status,
    //                 'status' => false,
    //                 'message' => 'Please complete your card verification payment.',
    //             ]);
    //         }
    //     }

    //     return $next($request);
    // }
}
