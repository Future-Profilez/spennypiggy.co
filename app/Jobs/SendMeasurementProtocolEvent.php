<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Posts one event to GA4's Measurement Protocol.
 *
 * Queued on purpose: this runs on the checkout path, and a slow or unreachable
 * Google must never add latency to a payment. ⚠️ Like every other queued
 * feature here, it does nothing at all unless `queue:work` is running.
 */
class SendMeasurementProtocolEvent implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Analytics is worth one retry, not a retry storm. */
    public $tries = 2;

    public $backoff = 30;

    public function __construct(
        private readonly string $clientId,
        private readonly string $eventName,
        private readonly array $params = [],
    ) {}

    public function handle(): void
    {
        $secret = config('analytics.ga4.api_secret');
        $measurementId = config('analytics.ga4.measurement_id');

        // Checked again here, not only at dispatch: a job can be queued in one
        // environment and run in another, and this is the last gate before a
        // real HTTP call to Google.
        if (! config('analytics.enabled') || blank($secret) || blank($measurementId)) {
            return;
        }

        // The debug endpoint validates and reports instead of recording. The
        // live one answers 204 to a malformed payload exactly as it does to a
        // good one, so without this there is no way to find out you have been
        // sending nothing.
        $host = config('analytics.ga4.debug')
            ? 'https://www.google-analytics.com/debug/mp/collect'
            : 'https://www.google-analytics.com/mp/collect';

        try {
            $response = Http::timeout(5)
                ->asJson()
                ->post($host.'?'.http_build_query([
                    'measurement_id' => $measurementId,
                    'api_secret' => $secret,
                ]), [
                    'client_id' => $this->clientId,
                    // ⚠️ Without this, GA4 files every server event as a fresh
                    // session and the visitor appears to have started a
                    // checkout without ever landing on the site. It is not
                    // optional metadata; it is what joins this event to the
                    // browsing session that produced it.
                    'non_personalized_ads' => false,
                    'events' => [[
                        'name' => $this->eventName,
                        'params' => array_merge($this->params, [
                            // Marks the event as coming from the server, so a
                            // GA4 report can separate it from the browser-side
                            // copy of the same funnel.
                            'transport' => 'server',
                            // GA4 attributes an event with no engagement to a
                            // session it will not count. This is Google's
                            // documented flag for server-sent events.
                            'engagement_time_msec' => 1,
                        ]),
                    ]],
                ]);

            if (config('analytics.ga4.debug')) {
                Log::info('MeasurementProtocol debug response', [
                    'event' => $this->eventName,
                    'body' => $response->json(),
                ]);
            }
        } catch (\Throwable $e) {
            // ⚠️ Swallowed, never rethrown: a GA4 outage must not fill
            // `failed_jobs` with analytics. But `$tries` then means nothing
            // unless the retry is asked for explicitly — which is worth having,
            // because the realistic failure here is a transient network error.
            // `release()` is a no-op when there is no queue job (a sync
            // dispatch), so this is safe in tests and in tinker.
            if ($this->attempts() < $this->tries) {
                $this->release($this->backoff);
            }

            Log::warning('MeasurementProtocol: send failed', [
                'event' => $this->eventName,
                'attempt' => $this->attempts(),
                'error' => $e->getMessage(),
            ]);
        }
    }
}
