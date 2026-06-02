<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckSuspendedUser
{
    public function handle(Request $request, Closure $next)
    {
        // Only check if user is logged in
        if (Auth::check()) {

            $user = Auth::user();

            // If suspended → logout immediately
            if ((int) $user->suspended_account === 1) {

                Auth::logout();

                // invalidate session safely
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                // Redirect to login with message
                return redirect()->route('login')->withErrors(['account' => 'Your account has been suspended due to a policy violation or payout configuration issue. Please contact support.']);
            }
        }

        return $next($request);
    }
}
