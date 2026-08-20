<?php

namespace App\Listeners;

use App\Support\FailedLoginMonitor;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Support\Facades\Log;

/**
 * 🚨 THE CHEAPEST WIN IN THE WHOLE SECURITY CHECKLIST.
 *
 * Both apps already fire `event(new Lockout($this))` from their login request
 * the moment the rate limiter trips — and NEITHER app had a listener registered
 * for it in `EventServiceProvider`. The framework was announcing "this login is
 * being brute-forced" into an empty room, and had been for the life of the
 * platform. All that was missing was this file and one array entry.
 *
 * ⚠️ The event carries the REQUEST, not a user — a lockout means nobody
 * authenticated. Read the IP and the submitted address off it defensively:
 * `Lockout::$request` is typed as a Request in Laravel, but this listener is on
 * a security path and must not be the thing that throws.
 */
class AlertOnLockout
{
    public function handle(Lockout $event): void
    {
        try {
            $request = $event->request ?? null;

            FailedLoginMonitor::lockout(
                $request?->ip(),
                is_string($request?->input('email')) ? $request->input('email') : null,
                (string) config('security_alerts.app', 'website'),
            );
        } catch (\Throwable $e) {
            // Never let observation break a sign-in — even a refused one. The
            // user is already seeing a throttle message; an exception here would
            // turn it into a 500.
            Log::warning('AlertOnLockout failed', ['error' => $e->getMessage()]);
        }
    }
}
