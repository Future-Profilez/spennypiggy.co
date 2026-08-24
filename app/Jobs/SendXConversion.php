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
 * Posts one conversion to X's Conversions API.
 *
 * Queued because it runs on the checkout path — a slow or unreachable X must
 * never add latency to a payment. ⚠️ Does nothing without `queue:work`.
 */
class SendXConversion implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Analytics is worth one retry, not a retry storm. */
    public $tries = 2;

    public $backoff = 30;

    public function __construct(
        private readonly string $eventId,
        private readonly string $twclid,
        private readonly float $value,
        private readonly string $currency,
        private readonly string $conversionId,
        private readonly string $conversionTime,
    ) {}

    public function handle(): void
    {
        $pixelId = config('analytics.x.pixel_id');
        $token = config('analytics.x.api_token');

        // Re-checked here, not only at dispatch: a job can be queued in one
        // environment and run in another, and this is the last gate before a
        // real HTTP call carrying a live ad-account credential.
        if (! config('analytics.enabled') || blank($pixelId) || blank($token)) {
            return;
        }

        $url = sprintf(
            'https://ads-api.x.com/%s/measurement/conversions/%s',
            config('analytics.x.api_version', '12'),
            $pixelId
        );

        try {
            $response = Http::timeout(5)
                ->withHeaders(['X-Pixel-Token' => $token])
                ->asJson()
                ->post($url, [
                    'conversions' => [[
                        'conversion_time' => $this->conversionTime,
                        'event_id' => $this->eventId,
                        // Deduplicates against a pixel event for the same
                        // conversion. The two routes are disjoint today, so
                        // nothing relies on it — it is here so that changing
                        // the split later cannot silently double-count.
                        'conversion_id' => $this->conversionId,
                        // 🚨 The click id is the ONLY identifier sent. X also
                        // accepts a hashed email or an IP + user-agent pair;
                        // both are personal data going to a third party, and
                        // neither is a decision this code should make quietly.
                        'identifiers' => [[
                            'twclid' => $this->twclid,
                        ]],
                        'value' => $this->value,
                        'currency' => $this->currency,
                    ]],
                ]);

            // X answers 200 with per-conversion errors in the body rather than
            // an HTTP error, so a failed status check alone would report
            // success on a rejected payload.
            if ($response->failed() || filled($response->json('errors'))) {
                Log::warning('XConversionsApi: conversion rejected', [
                    'event_id' => $this->eventId,
                    'status' => $response->status(),
                    'errors' => $response->json('errors'),
                ]);
            }
        } catch (\Throwable $e) {
            // Swallowed, never rethrown: an X outage must not fill
            // `failed_jobs` with analytics. The retry is asked for explicitly,
            // because the realistic failure here is a transient network error.
            // `release()` is a no-op without a queue job, so a sync dispatch
            // and the tests are unaffected.
            if ($this->attempts() < $this->tries) {
                $this->release($this->backoff);
            }

            Log::warning('XConversionsApi: send failed', [
                'event_id' => $this->eventId,
                'attempt' => $this->attempts(),
                'error' => $e->getMessage(),
            ]);
        }
    }
}
