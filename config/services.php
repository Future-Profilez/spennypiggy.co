<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'aws' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
     * The back office, for the few places the website has to point somebody at
     * it. ⚠️ Unset by default and every caller must cope with an empty value —
     * a guessed admin hostname in an email is worse than no link at all, and
     * this app has never needed to know the address before.
     */
    'admin' => [
        'url' => env('ADMIN_APP_URL', ''),
    ],

    'stripe' => [
        'key' => env('STRIPE_PUBLIC_KEY'),
        'secret' => env('STRIPE_SECRET_KEY'),
        'secret_us' => env('STRIPE_SECRET_KEY_US'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        'webhook_secret_us' => env('STRIPE_WEBHOOK_SECRET_US'),
    ],

    'fraud_notifications' => [
        'admin_email' => 'support@spennypiggy.co',
    ],

    'dispute_notifications' => [
        'admin_email' => 'support@spennypiggy.co',
    ],

    'magicbell' => [
        'key' => env('MAGICBELL_API_KEY'),
        'secret' => env('MAGICBELL_API_SECRET'),
        'url' => env('MAGICBELL_API_URL', 'https://api.magicbell.com'),
    ],

    'uploadcare' => [
        'public' => env('UPLOADCARE_PUBLIC_KEY'),
        'secret' => env('UPLOADCARE_SECRET_KEY'),
        'cdn' => env('UPLOADCARE_CDN', 'https://ucarecdn.com/'),
        'host' => env('UPLOADCARE_HOST', 'https://api.uploadcare.com/'),

        // 🚨 The signing key for SECURE DELIVERY, and it is NOT the API secret
        // above. Uploadcare issues a separate hex CDN secret in the project's
        // Delivery settings; the API secret on this project is 22 non-hex
        // characters and cannot be an HMAC key at all. Read by
        // App\Support\SecureMedia, which fails open (serves unsigned) when
        // this is missing or malformed. See config/media.php → secure.
        'secure_key' => env('UPLOADCARE_SECURE_KEY'),
    ],

    'intercom' => [
        'enabled' => env('INTERCOM_ENABLED', false),
        'app_id' => env('INTERCOM_APP_ID'),
        'identity_secret' => env('INTERCOM_IDENTITY_VERIFICATION_SECRET'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Blocked-payment notice
    |--------------------------------------------------------------------------
    |
    | Emails a supporter when their payment was stopped before it reached
    | Stripe. On-screen only left anyone who navigated away with nothing, and a
    | guest with no account to return to (9 Aug messaging brief, Qs 5 and 9).
    |
    | ⚠️ A guest's address is UNVERIFIED — they typed it into a checkout minutes
    | earlier — so this is send-once per address per state per day. The switch
    | exists so the whole thing can be stopped without a deploy.
    |
    */
    'blocked_payment_notice' => [
        'enabled' => env('BLOCKED_PAYMENT_NOTICE_ENABLED', true),
    ],

    'risk_engine' => [
        'enabled' => env('RISK_ENGINE_ENABLED', true),
    ],

    'turnstile' => [
        'site_key' => env('TRUNSTILE_SITE_KEY') ?: env('TURNSTILE_SITE_KEY'),
        'secret_key' => env('TRUNSTILE_SECRET_KEY') ?: env('TURNSTILE_SECRET_KEY'),
    ],

    'emulation' => [
        'secret' => env('EMULATION_SECRET'),
    ],

    'payout_notifications' => [
        'weekly_job_email' => env('WEEKLY_PAYOUT_JOB_NOTIFY_EMAIL', 'naveen@internetbusinesssolutionsindia.com'),
    ],

    // RYE (physical-goods gifting via retailers). Kill-switch defaults OFF:
    // this feature predates the content-first compliance rebuild and must not
    // be reachable until legal/Stripe sign-off. Set RYE_ENABLED=true to enable.
    'rye' => [
        'enabled' => env('RYE_ENABLED', false),
        'api_url' => env('RYE_API_URL', 'https://graphql.api.rye.com/v1/query'),
        'api_key' => env('RYE_API_KEY'),
        'webhook_secret' => env('RYE_WEBHOOK_SECRET'),
        'payment_token' => env('PAYMENT_TOKEN'),
        'shopper_ip' => env('RYE_SHOPPER_IP'),
    ],

    // Shared secret for the internal financial-sync endpoint (routes/api.php).
    // Read via config() so it survives config:cache; env() would return null.
    'internal_sync' => [
        'token' => env('INTERNAL_SYNC_TOKEN'),
    ],

    // Search Console site verification + GA4. Both are optional and render nothing
    // when unset, so dev/local never pollutes the production property.
    // GOOGLE_SITE_VERIFICATION is the token from the Search Console "HTML tag"
    // method — without it the sitemap cannot be submitted and no ranking or
    // impression data exists at all.
    // `client_id`/`client_secret`/`redirect` are Socialite's own keys and must keep these
    // names. The button only renders when both credentials are present, so an environment
    // without them shows the password form alone rather than a control that cannot work.
    //
    // `redirect` is absolute and built from APP_URL so it matches the URI registered in the
    // Google Cloud console exactly — Google compares the string, and a trailing slash or a
    // http/https mismatch is answered with `redirect_uri_mismatch`, not a warning.
    // `site_verification` is the Search Console "HTML tag" token — an ownership proof that
    // loads no Google script, not a tracking tag. There is deliberately no analytics id:
    // the only Google tag on the site is the Ads gtag.js in app.blade.php (AW-11395921981).
    'google' => [
        'site_verification' => env('GOOGLE_SITE_VERIFICATION'),
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => rtrim((string) env('APP_URL'), '/').'/auth/google/callback',
    ],

];
