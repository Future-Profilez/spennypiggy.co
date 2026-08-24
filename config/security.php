<?php

/*
|--------------------------------------------------------------------------
| Security response headers
|--------------------------------------------------------------------------
|
| Read by App\Http\Middleware\SecurityHeaders, which is registered on the `web`
| middleware group in App\Http\Kernel. The POLICY itself lives in that class
| (it needs comments explaining why each host is on the list); this file holds
| only the switches a human flips without touching code.
|
| 🚨 THE CSP SHIPS IN REPORT-ONLY MODE. This app loads Stripe, Uploadcare,
| Intercom, MagicBell, Sentry, Termly, Google Fonts and gtag. A directive that is
| one host short does not warn — it silently breaks checkout, uploads or support
| chat for whoever hits that path. Watch the reports for a full billing cycle
| (see `report_uri` below), fix what they name, and only then set
| SECURITY_CSP_ENFORCE=true.
|
*/

/*
 * Sentry doubles as a CSP report collector, so report-only mode produces data on
 * day one instead of writing to a console nobody is watching. Derived from the
 * DSN that is already configured rather than a second env var to keep in step.
 *
 * A DSN is `https://<public_key>@<host>/<project_id>`; the security endpoint is
 * `https://<host>/api/<project_id>/security/?sentry_key=<public_key>`.
 *
 * ⚠️ Values only — never a closure. A closure in a config file makes
 * `php artisan config:cache` fail, and Vapor runs it on every deploy.
 */
$sentryCspEndpoint = null;
$sentryDsn = env('SENTRY_LARAVEL_DSN', env('SENTRY_DSN'));

if (is_string($sentryDsn) && $sentryDsn !== '') {
    $parts = parse_url($sentryDsn);
    $publicKey = $parts['user'] ?? null;
    $host = $parts['host'] ?? null;
    $projectId = trim((string) ($parts['path'] ?? ''), '/');

    if ($publicKey && $host && $projectId !== '') {
        $sentryCspEndpoint = sprintf(
            'https://%s/api/%s/security/?sentry_key=%s',
            $host,
            $projectId,
            $publicKey
        );
    }
}

return [

    /*
     * HTTP Strict Transport Security.
     *
     * ⚠️ Only ever sent over HTTPS — a browser ignores it on http, and sending it
     * from a local http host is noise.
     *
     * ⚠️ `include_subdomains` defaults to FALSE deliberately. spennypiggy.co has
     * live subdomains (admin., uk., dev.admin.) and this header would force every
     * one of them onto HTTPS in every visitor's browser for a year — including any
     * that is not ready. Turn it on once someone has confirmed all of them serve
     * valid HTTPS.
     *
     * ⚠️ There is no `preload` option on purpose. Submitting to the HSTS preload
     * list is effectively irreversible for months and is a decision for a human,
     * not a config default.
     */
    'hsts' => [
        'max_age' => (int) env('SECURITY_HSTS_MAX_AGE', 31536000),
        'include_subdomains' => (bool) env('SECURITY_HSTS_INCLUDE_SUBDOMAINS', false),
    ],

    'csp' => [
        /*
         * false  → Content-Security-Policy-Report-Only (nothing is blocked)
         * true   → Content-Security-Policy (violations are blocked)
         *
         * 🚨 Do not flip this without reading the reports first. See the header
         * comment on this file.
         */
        'enforce' => (bool) env('SECURITY_CSP_ENFORCE', false),

        /*
         * Where violation reports are POSTed. Falls back to the Sentry project
         * already configured for this app. Set SECURITY_CSP_REPORT_URI to send
         * them somewhere else, or to an empty string to send them nowhere.
         */
        'report_uri' => env('SECURITY_CSP_REPORT_URI', $sentryCspEndpoint),

        /*
         * The CSP is skipped entirely in these environments so a local dev server,
         * Vite's HMR websocket and `php artisan serve` are not fighting it.
         */
        'skip_environments' => ['local', 'testing'],
    ],

];
