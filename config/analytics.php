<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Master switch
    |--------------------------------------------------------------------------
    |
    | 🚨 OFF everywhere except production, by default.
    |
    | Local and dev traffic is not traffic. A developer clicking through a
    | checkout twenty times to test it is not twenty checkouts, and there is no
    | way to tell those events apart from real ones once they are in the
    | property — GA4 cannot delete an event that has been recorded. This is a
    | one-way mistake, so the default is closed and the deployed `development`
    | environment is closed too.
    |
    | When false: `app.blade.php` does not load gtag.js at all (so no page
    | views, no browser events, no Ads conversions), `AnalyticsEvent` queues
    | nothing, and `MeasurementProtocol` sends nothing.
    |
    | ⚠️ This does NOT cover the team browsing the LIVE site — those are real
    | requests to a production server. Filter those in GA4 itself: Admin →
    | Data streams → Configure tag settings → Define internal traffic, then
    | Admin → Data filters → activate "Internal Traffic".
    |
    */

    'enabled' => (bool) env('ANALYTICS_ENABLED', env('APP_ENV') === 'production'),

    /*
    |--------------------------------------------------------------------------
    | GA4 — Measurement Protocol
    |--------------------------------------------------------------------------
    |
    | Server-to-server events, for the moments the browser cannot report.
    |
    | Two milestones leave the app entirely — a checkout redirects to Stripe
    | Checkout, and Connect onboarding redirects to Stripe's hosted form. Both
    | use `Inertia::location`, so there is no next render for a flashed event to
    | ride on, and the visitor who ABANDONS never comes back at all. Since
    | abandonment is the number we are trying to measure, browser-side reporting
    | cannot answer it even in principle.
    |
    | ⚠️ `api_secret` is created in GA4 Admin → Data Streams → your stream →
    | Measurement Protocol API secrets. Without it the sender is disabled and
    | says so once in the log — it never throws and never blocks a checkout.
    |
    */

    'ga4' => [
        'measurement_id' => env('GA4_MEASUREMENT_ID', 'G-EQCXDEV7QV'),
        'api_secret' => env('GA4_API_SECRET'),

        // Google's own debug endpoint. Returns validation messages instead of
        // recording anything, which is the only way to find out that a payload
        // was rejected — the live endpoint answers 204 to everything, valid or
        // not.
        'debug' => (bool) env('GA4_MP_DEBUG', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Google Ads — conversion tracking
    |--------------------------------------------------------------------------
    |
    | 🚨 The Ads tag has been loading on every page while NOTHING has ever sent
    | it a conversion, so the campaigns have been bidding blind: Google has had
    | no way to learn which click produced anything. Confirmed in the account —
    | every conversion action reads 0.00, and the website-sourced `Sign-up`
    | action has been marked **Inactive** for want of a single conversion.
    |
    | ⚠️ A GA4-IMPORTED conversion action has no label and cannot be used here.
    | Only actions whose source is "Website" carry one. In this account that is
    | `Sign-up` today, and a `Purchase` action that still has to be created.
    |
    | Each label comes from Google Ads → Goals → Conversions → the action →
    | Tag setup → "Use Google Tag Manager", which prints a conversion label like
    | `AbC-D_efG-h1i2j3k4l5`.
    |
    | ⚠️ An unset label sends NOTHING for that event, deliberately: a wrong label
    | files the conversion against the wrong action, which is worse than filing
    | none and is invisible once it starts happening.
    |
    | 🚨 The key is the GA4 EVENT NAME. `analytics.js` looks the fired event up
    | in this map, so adding a conversion is a label here and no code at all —
    | and an event with no entry can never be reported by accident.
    |
    */

    'ads' => [
        'conversion_id' => env('GOOGLE_ADS_CONVERSION_ID', 'AW-11395921981'),

        'labels' => array_filter([
            // The creator/supporter signup. The ad campaigns point at the six
            // /creators landing pages, whose whole purpose is this event — so
            // for these campaigns it matters more than purchase does.
            'sign_up' => env('GOOGLE_ADS_SIGNUP_LABEL'),

            // A completed purchase, with its value and currency.
            'purchase' => env('GOOGLE_ADS_PURCHASE_LABEL'),
        ]),
    ],

];
