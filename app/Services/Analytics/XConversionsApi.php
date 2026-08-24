<?php

namespace App\Services\Analytics;

use App\Jobs\SendXConversion;
use App\Services\VisitTracker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Conversions sent straight to X (Twitter) Ads from the server.
 *
 * The counterpart of `MeasurementProtocol`, and it exists for the same reason:
 * `begin_checkout` and `stripe_connect_started` both redirect the visitor OUT
 * to Stripe, so the browser pixel can never fire for them — and the visitor who
 * abandons never comes back, which is the number being measured.
 *
 * 🚨 ONE EVENT, ONE ROUTE. X deduplicates a pixel event against an API event
 * only when both carry the same `conversion_id`. Rather than rely on that, the
 * two routes are given disjoint sets of events: the pixel reports `sign_up` and
 * `purchase`, this reports the two the pixel cannot see. A `conversion_id` is
 * still sent, so that if the split is ever changed the deduplication has
 * something to work with.
 *
 * Same three properties as every other observation path here: it can never
 * break a checkout, it sends no personal data, and it is silent when
 * unconfigured.
 */
class XConversionsApi
{
    /**
     * Report one conversion.
     *
     * @param  string  $name  OUR event name; mapped to X's event id through
     *                        `config('analytics.x.events')`.
     * @param  array<string, mixed>  $params  `value` and `currency` are read;
     *                                        anything else is ignored — X's schema is fixed,
     *                                        unlike GA4's.
     * @param  string|null  $conversionId  A stable id for THIS conversion, used
     *                                     for deduplication against a pixel event.
     */
    public static function send(string $name, array $params = [], ?string $conversionId = null): void
    {
        try {
            if (! config('analytics.enabled')) {
                return;
            }

            $pixelId = config('analytics.x.pixel_id');
            $token = config('analytics.x.api_token');
            $eventId = config('analytics.x.events.'.$name);

            // A missing event id is a deliberate "do not report this one", not
            // a misconfiguration to warn about — the map is how the split
            // between pixel and API is expressed.
            if (blank($pixelId) || blank($token) || blank($eventId)) {
                return;
            }

            $twclid = self::clickId();

            // 🚨 No click id, no conversion. X accepts a hashed email or an
            // IP + user-agent pair instead, and both are personal data sent to
            // a third party — a decision for the client and their legal advice,
            // not a default this code should quietly make. A conversion with no
            // identifier cannot be attributed to an advert anyway, so the only
            // thing skipping it costs is a number nobody could have used.
            if (blank($twclid)) {
                return;
            }

            SendXConversion::dispatch(
                $eventId,
                $twclid,
                (float) ($params['value'] ?? 0),
                strtoupper((string) ($params['currency'] ?? 'GBP')),
                $conversionId ?: (string) Str::uuid(),
                // Recorded now, not when the job runs: a backed-up queue must
                // not move a conversion an hour later into the wrong day or
                // outside its attribution window.
                now()->toIso8601ZuluString('millisecond')
            );
        } catch (\Throwable $e) {
            Log::warning('XConversionsApi::send failed', [
                'event' => $name,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * The visitor's X click id, from the first-touch cookie `TrackSiteVisit`
     * wrote when they arrived from an advert.
     *
     * ⚠️ Read raw off the request rather than through Laravel's cookie helper:
     * it is queued unencrypted so the value X sees is the value X issued.
     */
    public static function clickId(): ?string
    {
        try {
            $request = request();
        } catch (\Throwable $e) {
            return null;
        }

        if (! $request instanceof Request) {
            return null;
        }

        $raw = $request->cookies->get(VisitTracker::TWCLID_COOKIE);

        return is_string($raw) && $raw !== '' ? $raw : null;
    }
}
