<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class UserEmailVerify
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        if ($request->user() && empty($request->user()->hasVerifiedEmail())) {
            // return redirect()->route('verification.notice');
            // return redirect(route('newnewnew'));
            // return redirect()->to('/frd');
        }
        return $next($request);
    }
}
