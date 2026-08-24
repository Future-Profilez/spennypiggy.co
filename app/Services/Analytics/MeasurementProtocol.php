<?php

namespace App\Services\Analytics;

use App\Jobs\SendMeasurementProtocolEvent;
use App\Support\AnalyticsParams;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * GA4 events sent straight off the server.
 *
 * The browser-side path (`App\Support\AnalyticsEvent`) reports milestones that
 * end in a redirect BACK INTO the app. This one reports the milestones that
 * redirect AWAY from it — a checkout to Stripe Checkout, Connect onboarding to
 * Stripe's hosted form. Both use `Inertia::location`, so there is no next
 * render to carry a flashed event, and the visitor who abandons never returns.
 *
 * 🚨 Abandonment is the number this exists to measure, so browser-side
 * reporting could not answer it even in principle — not "would be harder".
 *
 * Three properties, same as every other observation path in this app:
 *
 *  1. **It can never break a checkout.** Every entry point is wrapped and the
 *     HTTP call happens on the queue, never in the request. A GA4 outage must
 *     not add latency to a payment.
 *  2. **No personal data.** Parameters go through `AnalyticsParams::scrub`, the
 *     same filter the browser path uses.
 *  3. **It is silent when unconfigured.** No API secret means no send and one
 *     log line, not an exception on the payment path.
 */
class MeasurementProtocol
{
    /**
     * Send an event as the given visitor.
     *
     * @param  string  $name  GA4 event name, snake_case.
     * @param  array<string, mixed>  $params
     * @param  string|null  $clientId  GA4 client id. Defaults to the one in the
     *                                 visitor's `_ga` cookie — see `clientId()`.
     */
    public static function send(string $name, array $params = [], ?string $clientId = null): void
    {
        try {
            // 🚨 Off outside production — see config/analytics.php. Checked
            // before the secret, so a local box that happens to carry a real
            // API secret in its .env still sends nothing.
            if (! config('analytics.enabled')) {
                return;
            }

            if (blank(config('analytics.ga4.api_secret'))) {
                // Once per process, not per event — a missing secret on a busy
                // site would otherwise be thousands of identical lines.
                static $warned = false;

                if (! $warned) {
                    $warned = true;
                    Log::info('MeasurementProtocol: no GA4_API_SECRET set, server-side events are disabled.');
                }

                return;
            }

            $clientId ??= self::clientId();

            // ⚠️ No client id means no session to attach to. GA4 would accept a
            // made-up one and file the event as its own single-event session,
            // which reads as a checkout by a visitor who never had a page view —
            // worse than the gap it was trying to fill.
            if (blank($clientId)) {
                return;
            }

            SendMeasurementProtocolEvent::dispatch(
                $clientId,
                $name,
                AnalyticsParams::scrub($params)
            );
        } catch (\Throwable $e) {
            Log::warning('MeasurementProtocol::send failed', [
                'event' => $name,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * The visitor's GA4 client id, read from the `_ga` cookie.
     *
     * The cookie is `GA1.1.1234567890.1650000000`, and the client id GA4 wants
     * is the last two segments joined — `1234567890.1650000000`. Sending
     * anything else files the event under a visitor who does not exist, so the
     * shape is checked rather than assumed.
     *
     * ⚠️ Read raw off the request, NOT through Laravel's cookie helper: `_ga`
     * is written by Google's JavaScript, so it is not encrypted and
     * `EncryptCookies` would fail to decrypt it and hand back null.
     */
    public static function clientId(): ?string
    {
        try {
            $request = request();
        } catch (\Throwable $e) {
            // ⚠️ Its own guard, not the caller's. Resolving `request` can throw
            // outright in a context that has none, and the catch in `send()`
            // logs — which can itself want the request. On a checkout path the
            // safe answer to "who is this visitor" is "no idea", never an
            // exception.
            return null;
        }

        if (! $request instanceof Request) {
            return null;
        }

        $raw = $request->cookies->get('_ga');

        if (! is_string($raw)) {
            return null;
        }

        if (! preg_match('/^GA\d+\.\d+\.(\d+\.\d+)$/', $raw, $matches)) {
            return null;
        }

        return $matches[1];
    }
}
