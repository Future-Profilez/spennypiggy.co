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
        $user_id = Auth::user();

        $user = User::where('id', $user_id->id)
            ->where('role', 0)
            ->whereHas('gifterCardVerification', function ($query) use ($user_id) {
                $query->where('user_id', $user_id->id)->where('status', 'success');
            })
            ->first();
        if ($user_id->role == 0) {
            if (!$user) {
                return Inertia::render('gifter/GifterCardVerification', [
                    'status' => false,
                    // 'data' => Auth::user(),
                    'message' => 'Please complete your card verification payment.',
                ]);
            }
        }

        return $next($request);
    }
}
