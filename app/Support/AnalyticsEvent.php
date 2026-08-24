<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;

/**
 * Server-emitted GA4 events.
 *
 * The funnel moments this platform cares about — signup, email verification,
 * Stripe connection, publishing, a purchase — all finish with a **redirect**,
 * so there is no moment in a page component at which a `gtag()` call could
 * honestly say "this just happened". The controller knows; the browser does
 * not. This class carries that fact across the redirect: the controller pushes
 * an event, `HandleInertiaRequests` shares it once on the next render, and
 * `resources/js/lib/analytics.js` forwards it to gtag and drops it.
 *
 * Three properties this class exists to guarantee — the same three as
 * `VisitTracker`, for the same reasons:
 *
 *  1. **No personal data leaves the server.** Names, e-mails and ids are never
 *     event parameters. GA4 is a third party and its retention is not ours to
 *     promise; a funnel needs counts, not people.
 *  2. **It can never break a request.** Every entry point is wrapped. If
 *     analytics throws, the user still gets their signup / their purchase.
 *  3. **It never fires where there is no browser.** A queue worker, an Artisan
 *     command and a Stripe webhook all run without the buyer present. Flashing
 *     an event into a webhook's throwaway session would be invisible at best;
 *     the guards below make it explicit instead of accidental.
 */
class AnalyticsEvent
{
    /** Session key the events queue under. */
    private const KEY = '_analytics_events';

    /**
     * Hard cap on queued events.
     *
     * A request that somehow pushes in a loop must not grow the session
     * payload without bound — the session is a cookie or a row on the hot path
     * of every request.
     */
    private const MAX = 5;

    /**
     * Request path prefixes that are machine-to-machine, never a person.
     *
     * ⚠️ `webhook/payment` is the Stripe endpoint, and it creates the same
     * `Deliverable` rows the browser redirect does (the redirect-vs-webhook
     * parity contract). Without this guard, whichever of the two won the race
     * decided whether the event was recorded — and a webhook win would flash
     * an event into a session nobody ever renders.
     */
    private const MACHINE_PREFIXES = ['webhook', 'api', 'stripe/webhook'];

    /**
     * Queue a GA4 event for the next page the browser renders.
     *
     * @param  string  $name  GA4 event name — snake_case, and the four
     *                        standard ones (`sign_up`, `login`, `purchase`,
     *                        `select_content`) keep their standard meaning so
     *                        GA4's own reports light up rather than needing a
     *                        custom exploration for everything.
     * @param  array<string, mixed>  $params  Event parameters. Scalars only —
     *                                        see `scrub()`.
     */
    public static function push(string $name, array $params = []): void
    {
        try {
            // 🚨 Off outside production. Without this, a developer's twenty test
            // checkouts are twenty checkouts in the live property, and GA4
            // cannot delete an event it has recorded.
            if (! config('analytics.enabled')) {
                return;
            }

            $request = request();

            // ⚠️ The guard is "is there a session", NOT `runningInConsole()`.
            // A queue worker, an Artisan command and a Stripe webhook all fail
            // this check for the right reason — nobody is holding a browser —
            // while `runningInConsole()` would also be true under PHPUnit and
            // would make every test of this class silently pass by doing
            // nothing.
            if (! $request || ! $request->hasSession()) {
                return;
            }

            foreach (self::MACHINE_PREFIXES as $prefix) {
                if ($request->is($prefix, $prefix.'/*')) {
                    return;
                }
            }

            $session = $request->session();

            $events = $session->get(self::KEY, []);

            if (! is_array($events) || count($events) >= self::MAX) {
                $events = is_array($events) ? array_slice($events, -(self::MAX - 1)) : [];
            }

            $events[] = [
                // Lets the client drop a repeat if the same payload is rendered
                // twice (a back-navigation restoring a cached page, a partial
                // reload). Without it, one signup can be counted twice.
                'id' => uniqid('ae_', true),
                'name' => $name,
                'params' => self::scrub($params),
            ];

            $session->flash(self::KEY, $events);
        } catch (\Throwable $e) {
            Log::warning('AnalyticsEvent::push failed', [
                'event' => $name,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Take the queued events, leaving the session empty.
     *
     * Called once per render from `HandleInertiaRequests::share`.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function pull(): array
    {
        try {
            $request = request();

            if (! $request || ! $request->hasSession()) {
                return [];
            }

            $events = $request->session()->pull(self::KEY, []);

            return is_array($events) ? array_values($events) : [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Strip anything that must not reach a third party.
     *
     * 🚨 Delegated to `AnalyticsParams` because the Measurement Protocol sender
     * has to apply the identical rule, and two copies of a privacy filter is
     * one copy that gets a rule added and one that does not.
     *
     * @param  array<string, mixed>  $params
     * @return array<string, string|int|float|bool>
     */
    private static function scrub(array $params): array
    {
        return AnalyticsParams::scrub($params);
    }
}
