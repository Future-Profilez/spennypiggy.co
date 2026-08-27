<?php

namespace App\Services\Ssr;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Ssr\BundleDetector;
use Inertia\Ssr\Gateway;
use Inertia\Ssr\Response;

/**
 * Inertia's own HttpGateway calls Http::post() with no timeout, so it inherits
 * the 30-second default. Production is a 60-second Lambda: an SSR host that
 * stops answering would burn half the request budget on every marketing page
 * before falling back, turning a cosmetic SEO problem into a site-wide stall.
 *
 * This is the same gateway with a bound wait and a log line. Every failure path
 * returns null, which is Inertia's signal to render client-side instead — SSR
 * going down must never take a page down with it.
 */
class TimeoutGateway implements Gateway
{
    /**
     * Render the page through the SSR host, or null to fall back to CSR.
     */
    public function dispatch(array $page): ?Response
    {
        if (! config('inertia.ssr.enabled', true) || ! (new BundleDetector)->detect()) {
            return null;
        }

        $url = str_replace('/render', '', config('inertia.ssr.url')).'/render';

        try {
            $response = Http::connectTimeout((int) config('inertia.ssr.connect_timeout', 1))
                ->timeout((int) config('inertia.ssr.timeout', 3))
                ->post($url, $page)
                ->throw()
                ->json();
        } catch (\Throwable $e) {
            // Warning, not error: the page still renders. An error here would
            // page someone every time the SSR box restarts on a deploy.
            Log::warning('Inertia SSR render failed, falling back to CSR', [
                'component' => $page['component'] ?? null,
                'url' => $page['url'] ?? null,
                'reason' => $e->getMessage(),
            ]);

            return null;
        }

        // A render that threw inside React answers 200 with an empty body.
        // Treat that as a failure rather than serving a blank shell.
        if (! is_array($response) || empty($response['body'])) {
            Log::warning('Inertia SSR returned an empty body, falling back to CSR', [
                'component' => $page['component'] ?? null,
                'url' => $page['url'] ?? null,
            ]);

            return null;
        }

        return new Response(
            implode("\n", $response['head'] ?? []),
            $response['body']
        );
    }
}
