<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        /*
         * Sign-up attempts.
         *
         * 🚨 This limits ATTEMPTS, not accounts. Actual account-creation abuse is
         * already capped in RegisteredUserController::store — 3 accounts per IP
         * plus the `registered_device` cookie — so this only has to stop someone
         * hammering the endpoint. The old flat `throttle:10,60` punished the
         * honest case instead: every validation failure consumed one of ten, so a
         * person who mistyped their e-mail a few times, or a tester walking the
         * form, hit "Too many requests" on a first real submit with nothing in
         * any log to say why. Carrier NAT and office networks share an IP, so on
         * production that ceiling was shared between strangers.
         *
         * ⚠️ Off entirely in local/testing — the deployed `development` host is
         * publicly reachable and is deliberately NOT on that list.
         */
        RateLimiter::for('register', function (Request $request) {
            if (app()->environment('local', 'testing')) {
                return Limit::none();
            }

            return Limit::perHour((int) config('auth.register_attempts_per_hour', 60))
                ->by($request->ip())
                // A raw 429 error page is a dead end on the last screen of a
                // multi-step form: the person loses everything they typed and is
                // told nothing they can act on. Hand it back to the form as a
                // field error instead, which the submit handler already knows how
                // to route to the screen that owns the field.
                ->response(function (Request $request, array $headers) {
                    $message = 'Too many sign-up attempts from this network. Please wait an hour and try again.';

                    if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                        return response()->json(['message' => $message], 429, $headers);
                    }

                    return back()->withErrors(['email' => $message]);
                });
        });

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));

            // Load purchases routes
            Route::middleware('web')
                ->group(base_path('routes/purchases.php'));
        });
    }
}
