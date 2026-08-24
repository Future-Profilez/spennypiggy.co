<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Vite;

/**
 * Security response headers for every `web` response.
 *
 * 🚨 THIS CLASS EXISTED FOR MONTHS AND WAS REGISTERED NOWHERE. It had zero
 * references outside its own file, and `public/.htaccess` — the other place
 * headers were written — is DEAD on Vapor, because Lambda runs no Apache. So the
 * production site shipped with no HSTS, no CSP, no X-Frame-Options and no
 * nosniff. It is now in the `web` group in App\Http\Kernel. Do not un-register
 * it; if a header here breaks something, narrow that one header.
 *
 * 🚨 THE CSP SHIPS IN REPORT-ONLY MODE (config/security.php → `csp.enforce`).
 * The other headers enforce. A CSP that is one host short does not warn — it
 * silently breaks checkout, uploads or support chat for whichever user happens
 * to hit that path, and this app talks to Stripe, Uploadcare, Intercom,
 * MagicBell, Sentry, Termly, Google Fonts and gtag. Watch the reports before
 * enforcing.
 *
 * ⚠️ Known blockers that must be fixed BEFORE `csp.enforce` is turned on:
 *   - `resources/views/app.blade.php` carries inline <script> blocks with no
 *     nonce (the gtag config block and several JSON-LD blocks). The nonce is
 *     already shared to the view as `$cspNonce` and the Termly tag already uses
 *     it; the rest need the same attribute.
 *   - `style-src` carries 'unsafe-inline' because React inline styles, the
 *     critical-CSS block and the CSS-in-JS that Intercom/MagicBell inject all
 *     need it. ⚠️ Do NOT add a nonce to `style-src`: a nonce makes a browser
 *     IGNORE 'unsafe-inline', which is the opposite of what is wanted here.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $nonce = base64_encode(random_bytes(16));
        View::share('cspNonce', $nonce);

        /*
         * ⚠️ Laravel's Vite helper must be told the nonce too, or it mints its
         * own. It matters in HOT (dev-server) mode, where `@viteReactRefresh`
         * emits an INLINE `<script type="module">` preamble: without this, that
         * block carries no nonce, `CspInlineScriptTest` fails on any machine
         * running `npm run dev`, and the failure looks exactly like a code
         * regression. Built assets are `src=` tags and were never affected.
         */
        Vite::useCspNonce($nonce);

        $response = $next($request);

        if (! isset($response->headers)) {
            return $response;
        }

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');

        /*
         * 🚨 NEVER OVERWRITE A REFERRER-POLICY THE RESPONSE ALREADY CARRIES.
         * This middleware is registered FIRST in the web group, so its "after"
         * work runs LAST — outside everything — and a plain `set()` here
         * silently replaced the stricter policy two controllers set on purpose:
         *
         *   GuestPurchaseController  — a signed URL with the guest's EMAIL in
         *                              the query string
         *   MaintenanceAccessController — a bypass TOKEN in the URL
         *
         * Both send `no-referrer` so that secret cannot leak in a Referer header
         * to anything the page loads. Replacing it with
         * `strict-origin-when-cross-origin` is a downgrade on exactly the two
         * URLs that most need the strict value — a security regression
         * introduced by security hardening, which is why it is guarded rather
         * than left to a reviewer to notice. Caught by `GuestPurchaseLookupTest`
         * on 20 Aug 2026.
         *
         * A route that set this header did so deliberately; the site-wide value
         * is a FLOOR, not a ceiling.
         */
        if (! $response->headers->has('Referrer-Policy')) {
            $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        }

        /*
         * ⚠️ `payment` and `camera` are DELEGATED, not denied.
         *
         * The previous draft of this file denied both outright (`payment=()`,
         * `camera=()`). That would have been a money-path regression:
         *   - `payment=()` disables the Payment Request API, which is how Apple
         *     Pay and Google Pay render inside Stripe's frames. The wallet buttons
         *     simply do not appear — no error, no log.
         *   - `camera=()` breaks Stripe Identity document capture (this app gates
         *     listings on it, see CheckStripeIdentityVerification) and Uploadcare's
         *     camera upload source.
         * `microphone=(self)` is for Uploadcare's video capture, which records
         * audio.
         *
         * ⚠️ `usb=()` is WebUSB only. It does NOT touch WebAuthn, so passkeys and
         * hardware security keys are unaffected. Never add
         * `publickey-credentials-get=()` here — that one would kill passkey login.
         */
        $response->headers->set('Permissions-Policy', implode(', ', [
            'geolocation=()',
            'usb=()',
            'microphone=(self)',
            'camera=(self "https://js.stripe.com" "https://verify.stripe.com")',
            'payment=(self "https://js.stripe.com" "https://checkout.stripe.com" "https://billing.stripe.com")',
        ]));

        /*
         * ⚠️ `same-origin-allow-popups`, NOT `same-origin`.
         *
         * Sign in with Google and the Stripe Connect onboarding flow both open a
         * popup and talk back to it through `window.opener`. A bare `same-origin`
         * severs that reference and the popup completes while the page it came
         * from never hears about it.
         *
         * ⚠️ Cross-Origin-Resource-Policy is deliberately NOT set. Fonts on this
         * domain are served with `Access-Control-Allow-Origin: *` by
         * HandleCorsForAssets precisely so the Vapor asset domain can load them;
         * `CORP: same-origin` would refuse exactly those requests.
         */
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

        // Only meaningful over TLS; a browser ignores it on a plain-http response.
        if ($request->secure()) {
            $hsts = 'max-age='.(int) config('security.hsts.max_age', 31536000);

            if (config('security.hsts.include_subdomains', false)) {
                $hsts .= '; includeSubDomains';
            }

            $response->headers->set('Strict-Transport-Security', $hsts);
        }

        if (! app()->environment(config('security.csp.skip_environments', ['local', 'testing']))) {
            $enforce = (bool) config('security.csp.enforce', false);

            $response->headers->set(
                $enforce ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
                $this->contentSecurityPolicy($nonce)
            );
        }

        return $response;
    }

    /**
     * The policy.
     *
     * Every host below is on the list because something in this app talks to it.
     * When you add a third-party script, add its host here in the same change —
     * a missing host is invisible until a real user hits it.
     */
    private function contentSecurityPolicy(string $nonce): string
    {
        // See assetOrigin(): on Vapor the app's own bundle is NOT same-origin.
        $asset = $this->assetOrigin();

        $stripe = 'https://js.stripe.com https://api.stripe.com https://checkout.stripe.com https://billing.stripe.com https://hooks.stripe.com https://verify.stripe.com https://m.stripe.network https://*.stripe.com';
        $uploadcare = 'https://ucarecdn.com https://upload.uploadcare.com https://api.uploadcare.com https://social.uploadcare.com https://*.uploadcare.com';
        $intercom = 'https://widget.intercom.io https://js.intercomcdn.com https://api-iam.intercom.io https://intercom.help https://*.intercom.io https://*.intercomcdn.com https://*.intercomassets.com';
        $magicbell = 'https://api.magicbell.com https://*.magicbell.com https://*.magicbell.io';
        $sentry = 'https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io';
        $google = 'https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com';

        /*
         * 🚨 Google Ads is a SECOND host family, and report-only mode named every
         * one of them on the first day the CSP shipped: 448 reports for
         * www.google.com alone, plus pagead2.googlesyndication.com,
         * ad.doubleclick.net, stats.g.doubleclick.net, www.googleadservices.com
         * and www.google.co.uk.
         *
         * `gtag('config', 'AW-11395921981')` in app.blade.php is what reaches
         * them — a conversion ping fires to `www.google.<CCTLD>`, chosen from the
         * VISITOR's locale, so the list can never be a fixed set of countries.
         * `https://www.google.com` is listed explicitly because a wildcard does
         * not match a bare host, and the ccTLD tail is covered by pattern.
         *
         * ⚠️ `analytics.google.com` above has the same trap: `*.analytics.google.com`
         * does NOT match the bare host, and the bare host is the one GA4 posts to.
         */
        $googleAds = 'https://www.googleadservices.com https://googleads.g.doubleclick.net https://ad.doubleclick.net https://stats.g.doubleclick.net https://*.doubleclick.net https://pagead2.googlesyndication.com https://*.googlesyndication.com https://www.google.com https://google.com https://www.google.co.uk https://www.google.ie';

        /*
         * ⚠️ Termly's consent API is on its OWN regional subdomain
         * (`us.consent.api.termly.io`), not on `app.termly.io` where the embed
         * script lives. Listing only the script host meant the banner loaded and
         * then could not record a consent decision.
         */
        $termly = 'https://app.termly.io https://*.termly.io';

        $directives = [
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",

            // Clickjacking. Mirrors X-Frame-Options: DENY above — nothing in this
            // app frames itself, and the two headers must not disagree.
            "frame-ancestors 'none'",

            // Stripe Checkout and the Billing portal are reached by redirect, but
            // a form POST to them is listed so a future hosted-form flow does not
            // fail silently.
            "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",

            /*
             * ⚠️ NO 'unsafe-inline' here, on purpose. A nonce makes the browser
             * ignore 'unsafe-inline' anyway, so adding both would be theatre. The
             * un-nonced inline blocks still in app.blade.php are what report-only
             * mode is here to surface.
             */
            "script-src 'self' 'nonce-{$nonce}' {$asset} {$stripe} {$intercom} {$google} {$googleAds} {$termly} https://challenges.cloudflare.com https://cdn.jsdelivr.net",

            // 'unsafe-inline' is required and not removable today — see the class
            // docblock.
            "style-src 'self' 'unsafe-inline' {$asset} https://fonts.googleapis.com https://fonts.cdnfonts.com https://cdn.jsdelivr.net {$intercom}",

            "font-src 'self' data: {$asset} https://fonts.gstatic.com https://fonts.cdnfonts.com https://cdn.jsdelivr.net {$intercom}",

            /*
             * ⚠️ `img-src` keeps a blanket `https:` deliberately. Creator avatars,
             * covers, Google profile pictures, e-mail-embedded art and a long tail
             * of icon hosts all land here, and an image is the lowest-value thing
             * an injection can reach. Tightening this is worth doing later, off a
             * report, not by guessing the list now.
             */
            "img-src 'self' data: blob: https:",

            "media-src 'self' data: blob: {$asset} {$uploadcare} https://player.vimeo.com",

            "connect-src 'self' {$asset} {$stripe} {$uploadcare} {$intercom} {$magicbell} {$sentry} {$google} {$googleAds} {$termly} https://ipapi.co https://api.ipify.org https://api64.ipify.org wss://*.intercom.io wss://*.magicbell.com wss://*.magicbell.io",

            "frame-src 'self' {$stripe} {$uploadcare} {$intercom} {$googleAds} {$termly} https://challenges.cloudflare.com https://player.vimeo.com",

            // The PWA service worker, and Uploadcare's upload workers.
            "worker-src 'self' blob: {$asset}",

            "manifest-src 'self' {$asset}",
        ];

        $reportUri = (string) config('security.csp.report_uri', '');

        if ($reportUri !== '') {
            $directives[] = 'report-uri '.$reportUri;
        }

        // ⚠️ An empty $asset leaves stray whitespace inside a directive. Harmless
        // to a parser, but it makes the header hard to read in a violation report,
        // so normalise it away.
        return trim(preg_replace(
            ['/\s+/', '/ ;/'],
            [' ', ';'],
            implode('; ', $directives)
        ));
    }

    /*
     * 🚨 ON VAPOR THE APP'S OWN JS AND CSS ARE NOT `'self'`.
     *
     * Vapor uploads `public/build` to S3/CloudFront and sets ASSET_URL to that
     * domain, so `@vite` emits `https://<asset-host>/build/assets/app-*.js`. A
     * policy that lists only `'self'` therefore blocks THE ENTIRE APPLICATION
     * BUNDLE the moment it is enforced — a blank page, in production, for
     * everybody. It cannot be reproduced locally, where ASSET_URL is empty and
     * everything genuinely is same-origin.
     *
     * Derived from config rather than hardcoded so it follows the environment,
     * and returns '' when there is no asset host (local, and any non-Vapor host).
     */
    private function assetOrigin(): string
    {
        $assetUrl = (string) config('app.asset_url', '');

        if ($assetUrl === '') {
            return '';
        }

        $parts = parse_url($assetUrl);

        if (empty($parts['host'])) {
            return '';
        }

        return ($parts['scheme'] ?? 'https').'://'.$parts['host']
            .(isset($parts['port']) ? ':'.$parts['port'] : '');
    }
}
