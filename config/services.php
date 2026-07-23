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
    ],

    'intercom' => [
        'enabled' => env('INTERCOM_ENABLED', false),
        'app_id' => env('INTERCOM_APP_ID'),
        'identity_secret' => env('INTERCOM_IDENTITY_VERIFICATION_SECRET'),
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

];
