<?php

namespace App\Http;

use App\Http\Middleware\Authenticate;
use App\Http\Middleware\CheckGifterCardVerification;
use App\Http\Middleware\CheckStripeIdentityVerification;
use App\Http\Middleware\CheckSuspendedUser;
use App\Http\Middleware\CheckUserBlock;
use App\Http\Middleware\EncryptCookies;
use App\Http\Middleware\EnforceEmulationTimeBox;
use App\Http\Middleware\EnsureCsrfCookie;
use App\Http\Middleware\EnsureIdentityVerifiedForListings;
use App\Http\Middleware\EnsureRyeEnabled;
use App\Http\Middleware\EnsureSiteAvailable;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\HandleCorsForAssets;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\IpTracker;
use App\Http\Middleware\LocalOnly;
use App\Http\Middleware\NormalizeDuplicateSlashes;
use App\Http\Middleware\PreventBackHistory;
use App\Http\Middleware\PreventRequestsDuringMaintenance;
use App\Http\Middleware\RedirectIfAuthenticated;
use App\Http\Middleware\RequireActiveMembership;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\StaticPageSeoMiddleware;
use App\Http\Middleware\TrackDiscoveryVisit;
use App\Http\Middleware\TrackSiteVisit;
use App\Http\Middleware\TrimStrings;
use App\Http\Middleware\TrustProxies;
use App\Http\Middleware\UserEmailVerify;
use App\Http\Middleware\ValidateSignature;
use App\Http\Middleware\VerifyCsrfToken;
use Illuminate\Auth\Middleware\AuthenticateWithBasicAuth;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Auth\Middleware\EnsureEmailIsVerified;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Foundation\Http\Kernel as HttpKernel;
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;
use Illuminate\Foundation\Http\Middleware\ValidatePostSize;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Http\Middleware\SetCacheHeaders;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Session\Middleware\AuthenticateSession;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class Kernel extends HttpKernel
{
    /**
     * The application's global HTTP middleware stack.
     *
     * These middleware are run during every request to your application.
     *
     * @var array<int, class-string|string>
     */
    protected $middleware = [
        // \App\Http\Middleware\TrustHosts::class,
        TrustProxies::class,
        // Must sit AFTER TrustProxies: it issues a redirect, and the URL generator
        // reads the scheme off the request. Before TrustProxies the forwarded
        // X-Forwarded-Proto is not trusted yet, so an https request behind
        // CloudFront would be redirected to http.
        NormalizeDuplicateSlashes::class,
        HandleCors::class,
        HandleCorsForAssets::class,
        PreventRequestsDuringMaintenance::class,
        /*
         * DB-driven maintenance wall, toggled from the admin app.
         *
         * Sits here on purpose: after TrustProxies (the IP allowlist needs the
         * real client address) and before StartSession/Inertia, so a refused
         * request never builds a session or a page of shared props against a
         * database that may be exactly what is being worked on.
         *
         * PreventRequestsDuringMaintenance above is Laravel's file-marker version
         * and is inert on Vapor — Lambda filesystems are ephemeral and
         * per-instance, so `php artisan down` marks one container and not the next.
         */
        EnsureSiteAvailable::class,
        ValidatePostSize::class,
        TrimStrings::class,
        ConvertEmptyStringsToNull::class,
    ];

    /**
     * The application's route middleware groups.
     *
     * @var array<string, array<int, class-string|string>>
     */
    protected $middlewareGroups = [
        'web' => [
            /*
             * 🚨 FIRST in the group, and it must stay first.
             *
             * It sets the response headers on the way OUT, so anything that
             * short-circuits ahead of it (the suspended-user check, an Inertia
             * redirect, a CSRF failure) would answer with no security headers at
             * all. First in, last out — every web response carries them.
             *
             * ⚠️ Registered 20 Aug 2026. This class had existed for months with
             * ZERO references anywhere: no HSTS, no CSP, no X-Frame-Options and no
             * nosniff shipped in production, because `public/.htaccess` — the only
             * other place headers were written — is inert on Vapor (Lambda runs no
             * Apache). Its CSP is REPORT-ONLY; see config/security.php.
             */
            SecurityHeaders::class,
            EncryptCookies::class,
            AddQueuedCookiesToResponse::class,
            StartSession::class,
            EnsureCsrfCookie::class,
            ShareErrorsFromSession::class,
            VerifyCsrfToken::class,
            SubstituteBindings::class,
            StaticPageSeoMiddleware::class,
            HandleInertiaRequests::class,
            // \App\Http\Middleware\PreventBackHistory::class, // Force no-cache headers for all web routes
            // \App\Http\Middleware\CacheInertiaResponse::class,
            AddLinkHeadersForPreloadedAssets::class,
            // \App\Http\Middleware\BlockWordsAndEmojis::class,
            IpTracker::class,
            CheckSuspendedUser::class,
            EnforceEmulationTimeBox::class,
            // Last in the group: it runs after the response exists, counts an
            // anonymous page view, and can never block a page from rendering.
            TrackSiteVisit::class,
            // Discovery Phase 1 attribution. Separate from TrackSiteVisit on
            // purpose — that one is anonymous counters, this one names a
            // creator and a visitor. See both docblocks.
            TrackDiscoveryVisit::class,
        ],

        'api' => [
            // \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            ThrottleRequests::class.':api',
            SubstituteBindings::class,
        ],
    ];

    /**
     * The application's middleware aliases.
     *
     * Aliases may be used instead of class names to conveniently assign middleware to routes and groups.
     *
     * @var array<string, class-string|string>
     */
    protected $middlewareAliases = [
        'auth' => Authenticate::class,
        'auth.basic' => AuthenticateWithBasicAuth::class,
        'auth.session' => AuthenticateSession::class,
        'admin' => EnsureUserIsAdmin::class,
        'localonly' => LocalOnly::class,
        'cache.headers' => SetCacheHeaders::class,
        'can' => Authorize::class,
        'guest' => RedirectIfAuthenticated::class,
        'password.confirm' => RequirePassword::class,
        'precognitive' => HandlePrecognitiveRequests::class,
        'signed' => ValidateSignature::class,
        'throttle' => ThrottleRequests::class,
        'verified' => EnsureEmailIsVerified::class,
        'mustHaveToVerify' => UserEmailVerify::class,
        'mustCompletedStripeIdentity' => CheckStripeIdentityVerification::class,
        'identityBeforeListing' => EnsureIdentityVerifiedForListings::class,
        'mustCompletedCardVerification' => CheckGifterCardVerification::class,
        'rye.enabled' => EnsureRyeEnabled::class,
        'membership' => RequireActiveMembership::class,
        'prevent-back-history' => PreventBackHistory::class,
        'check.block' => CheckUserBlock::class,
        'check.suspended' => CheckSuspendedUser::class,
    ];

    protected $except = [
        // Existing exceptions...
        'webauthn/*', // Add this line
    ];
}
