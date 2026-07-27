<?php

namespace App\Http\Middleware;

use App\Providers\RouteServiceProvider;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {

        /*
        IMPORTANT:
        skip redirect for webauthn routes
        */

        if ($request->is('webauthn/*')) {

            return $next($request);
        }

        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {

            if (Auth::guard($guard)->check()) {

                $user = Auth::guard($guard)->user();

                if ($user && isset($user->username)) {

                    return redirect(
                        route(
                            'user.show',
                            ['username' => $user->username]
                        )
                    );
                }

                return redirect(
                    RouteServiceProvider::HOME
                );
            }
        }

        return $next($request);
    }
}
