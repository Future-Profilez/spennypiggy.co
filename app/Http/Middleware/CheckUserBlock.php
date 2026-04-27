<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Inertia\Inertia;

class CheckUserBlock
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $username = $request->route('username') ?: $request->route('creator');

        if ($username && Auth::check()) {
            $creator = User::where('username', $username)->first();

            if ($creator && Auth::user()->isBlockedBy($creator->id)) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'status' => false,
                        'message' => 'You have been blocked by this user.'
                    ], 403);
                }

                return Inertia::render('Errors/404'); // Or a specific Blocked page
            }
        }

        return $next($request);
    }
}
