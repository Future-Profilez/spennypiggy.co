<?php

return [
    'manifest' => [
        'name' => 'Spenny Piggy',
        'short_name' => 'Spenny Piggy',
        'start_url' => '/',
        // 🚨 background_color is the SPLASH SCREEN, and it was #ffffff — so an
        // installed app whose every screen is dark opened on a full white flash
        // before the first paint. It is the top of the page's own gradient now.
        'background_color' => '#0B0413',
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
        'splash' => [
            '640x1136' => '/siteicon.png',
            '750x1334' => '/siteicon.png',
            '828x1792' => '/siteicon.png',
            '1125x2436' => '/siteicon.png',
            '1242x2208' => '/siteicon.png',
            '1242x2688' => '/siteicon.png',
            '1536x2048' => '/siteicon.png',
            '1668x2224' => '/siteicon.png',
            '1668x2388' => '/siteicon.png',
            '2048x2732' => '/siteicon.png',
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
