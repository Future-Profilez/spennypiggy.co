<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Creator watermark
    |--------------------------------------------------------------------------
    |
    | Stamps the creator's profile URL onto PUBLIC PREVIEW images via the
    | Uploadcare `-/overlay/` operation. Attribution only — the operation lives
    | in the URL, so anyone can strip it and fetch the clean original. Do not
    | rely on this as piracy protection.
    |
    | Ships DISABLED. Each overlay creates a new derived asset per variant, and
    | this platform has already had one runaway Uploadcare bandwidth bill, so
    | turn it on deliberately after a cost check rather than on deploy.
    |
    | Never applies to: video, SVG, PDF/zip/audio/documents, the paid reward
    | file a buyer downloads, avatars, covers, or platform placeholder images.
    |
    */

    'watermark' => [

        'enabled' => env('MEDIA_WATERMARK_ENABLED', false),

        // The three positional arguments of
        // `-/overlay/:uuid/:dimensions/:coordinates/:opacity/`.
        //
        // Each is validated against the exact shape Uploadcare's parser accepts
        // before it reaches a URL (App\Support\MediaUrl::overlayOps) — a typo
        // here yields an unwatermarked image, never a 400.
        //
        // 🚨 `dimensions` MUST be two-dimensional. `34p` alone parses on its own
        // but makes the CDN reject the coordinates that follow it, 400ing the
        // whole image. `34px34p` reads as "fit inside 34% × 34%", so a wide
        // watermark ends up bounded by the width.
        'dimensions' => env('MEDIA_WATERMARK_DIMENSIONS', '34px34p'),
        'coordinates' => env('MEDIA_WATERMARK_COORDINATES', '4p,90p'),
        'opacity' => env('MEDIA_WATERMARK_OPACITY', '45p'),

        // Rendering of the per-creator PNG.
        'font' => resource_path('assets/fonts/legacy/CeraGRMedium.ttf'),
        'font_size' => 44,
        'padding' => 22,

        // The host printed on the watermark. Read from config, never env() —
        // env() returns null once the config is cached on deploy.
        'host' => env('MEDIA_WATERMARK_HOST', 'spennypiggy.co'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Secure delivery for PAID content
    |--------------------------------------------------------------------------
    |
    | Signs the CDN URL of anything a supporter PAID for, so the link expires
    | instead of living for ever. Public marketing media (avatars, covers, item
    | thumbnails, public post images, OG images) is deliberately NEVER signed —
    | a token breaks edge caching and link previews and puts an expiry on things
    | that are meant to be public. App\Support\SecureMedia does the signing;
    | the CALL SITE decides what is paid.
    |
    | 🚨 SHIPS OFF, AND MUST STAY OFF UNTIL A HUMAN DOES TWO THINGS IN THE
    | UPLOADCARE DASHBOARD:
    |
    |   1. Project → Delivery → enable "Secure delivery" / authenticated URLs.
    |   2. Copy the CDN **secret key** it generates into UPLOADCARE_SECURE_KEY.
    |      ⚠️ This is a DIFFERENT value from UPLOADCARE_SECRET_KEY (the API
    |      key). They happen to be the same shape here — the API secret is a
    |      valid 20-char hex string, so SecureMedia falls back to it — but if
    |      the project's CDN secret differs, that fallback signs with the wrong
    |      key and every paid download 403s while looking exactly like a
    |      misconfigured account setting. Set it explicitly.
    |
    | Verify BEFORE flipping the flag:  php artisan media:secure-check
    | It signs a real uuid and reports what the CDN answers, both signed and
    | unsigned. What you want to see once the setting is on is signed → 200 and
    | unsigned → 403. Signed 403 means the key is wrong; unsigned 200 means the
    | account setting is not on yet and turning this flag on buys nothing.
    |
    | With the flag ON but the setting OFF, signing is harmless: the token is an
    | ignored query parameter. With the setting ON but the flag OFF, every paid
    | download 403s — so turn the SETTING on last, or accept a window where the
    | signed URLs are simply not enforced.
    |
    */

    'secure' => [

        'enabled' => env('MEDIA_SECURE_ENABLED', false),

        // Page-lifetime links. 300s (the window the old dead signer used) was
        // rejected: it is short enough to expire mid-download of a large video
        // file, and a supporter whose 4GB download dies at 40% is a support
        // ticket. An hour covers the start, retries and range requests.
        'ttl' => (int) env('MEDIA_SECURE_TTL', 3600),

        // Links that leave the site inside a receipt or delivery e-mail, where
        // the supporter may not open their mail for days.
        // ⚠️ Interim. The right shape is a signed redirect route that re-checks
        // entitlement per click; that needs a route, so it is reported not built.
        'delivery_ttl' => (int) env('MEDIA_SECURE_DELIVERY_TTL', 2592000),
    ],

];
