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

];
