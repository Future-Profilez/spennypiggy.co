<?php

return [
    'manifest' => [
        'name' => 'Spenny Piggy',
        'short_name' => 'Spenny Piggy',
        'start_url' => '/',
        // 🚨 background_color IS the Android splash screen — Chrome paints it
        // flat behind the 512 icon, and it cannot carry a gradient or artwork.
        // It was #ffffff (a full white flash into a dark app), then near-black.
        // It is brand pink now so the OS splash, the iOS launch images and the
        // in-app launch screen in app.blade.php are all one field; changing it
        // here means changing resources/proxy/manifest.json and site.webmanifest
        // in the same commit, since those are the manifests actually served.
        'background_color' => '#FF007F',
        // ⚠️ theme_color tints the system chrome around the app, so it must match
        // the HEADER, not the page. Four different colours were declared across
        // the manifest and the meta tags (#5D25FD here, #A2E4B8 twice in the
        // blade, #05EFB8 on the tile) and none of them was a colour the site
        // actually used. They are all #9E0048 now — the header bar.
        'theme_color' => '#9E0048',
        'display' => 'standalone',
        'orientation' => 'any',
        'status_bar' => '#9E0048',
        'icons' => [
            '72x72' => [
                'path' => '/favicon-32x32.png',
                'purpose' => 'any',
            ],
            '96x96' => [
                'path' => '/favicon-32x32.png',
                'purpose' => 'any',
            ],
            '128x128' => [
                'path' => '/android-chrome-192x192.png',
                'purpose' => 'any',
            ],
            '144x144' => [
                'path' => '/android-chrome-192x192.png',
                'purpose' => 'any',
            ],
            '152x152' => [
                'path' => '/android-chrome-192x192.png',
                'purpose' => 'any',
            ],
            '192x192' => [
                'path' => '/android-chrome-192x192.png',
                'purpose' => 'any',
            ],
            '384x384' => [
                'path' => '/android-chrome-192x192.png',
                'purpose' => 'any',
            ],
            '512x512' => [
                'path' => '/android-chrome-512x512.png',
                'purpose' => 'any',
            ],
        ],
        // ⚠️ DEAD CONFIG — `resources/views/vendor/laravelpwa/meta.blade.php` is
        // included nowhere (`@laravelPWA` is commented out in app.blade.php), so
        // nothing reads this. The live launch images are declared by
        // App\Support\PwaSplash and rendered by app.blade.php.
        //
        // 🚨 Every entry here used to be `/siteicon.png` — a path that answers 404
        // in production (no proxy route) at a size iOS would ignore anyway. Left
        // pointing at the real route so wiring the vendor view back in cannot
        // silently reinstate a broken set.
        'splash' => [
            '640x1136' => '/ios-splash/640x1136.png',
            '750x1334' => '/ios-splash/750x1334.png',
            '828x1792' => '/ios-splash/828x1792.png',
            '1125x2436' => '/ios-splash/1125x2436.png',
            '1242x2208' => '/ios-splash/1242x2208.png',
            '1242x2688' => '/ios-splash/1242x2688.png',
            '1536x2048' => '/ios-splash/1536x2048.png',
            '1668x2224' => '/ios-splash/1668x2224.png',
            '1668x2388' => '/ios-splash/1668x2388.png',
            '2048x2732' => '/ios-splash/2048x2732.png',
        ],
        'shortcuts' => [
            [
                'name' => 'Spenny Piggy - Exclusive Content, Memberships & Custom Requests',
                'description' => 'Join Memberships, adopt bills & more. Safe for all Creators who receive 100% payouts!',
                'url' => '/',
                'icons' => [
                    'src' => '/favicon-32x32.png',
                    'purpose' => 'any',
                ],
            ],
        ],
        'custom' => [],
    ],
];
