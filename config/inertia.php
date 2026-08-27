<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Server Side Rendering
    |--------------------------------------------------------------------------
    |
    | These options configures if and how Inertia uses Server Side Rendering
    | to pre-render the initial visits made to your application's pages.
    |
    | You can specify a custom SSR bundle path, or omit it to let Inertia
    | try and automatically detect it for you.
    |
    | Do note that enabling these options will NOT automatically make SSR work,
    | as a separate rendering service needs to be available. To learn more,
    | please visit https://inertiajs.com/server-side-rendering
    |
    */

    'ssr' => [

        /*
         * 🚨 ALWAYS FALSE HERE, AND DELIBERATELY NOT READ FROM THE ENVIRONMENT.
         *
         * SSR is turned on PER ROUTE, for guests only, by the `ssr` middleware
         * (App\Http\Middleware\EnableSsr) — Inertia reads this key at dispatch
         * time, so setting it per request is enough. Only the marketing pages
         * under /creators need to exist in view-source; nothing else on this
         * site is crawled.
         *
         * ⚠️ IT USED TO READ `env('INERTIA_SSR_ENABLED', false)`, AND ON
         * 26 Aug 2026 THAT VARIABLE WAS SET TO `true` ON THE DEV ENVIRONMENT.
         * Every page in the app was then server-rendered — dashboards, the
         * basket, checkout, a creator's own profile — which POSTs the page's
         * shared props to the render host on every request. Those props carry
         * the signed-in user's email, identity status and subscription state,
         * so an operator flipping a switch whose name reads like "turn SSR on"
         * silently started sending personal data to a second machine, and put
         * a network round trip in front of every authenticated page. Nothing
         * errored; the pages just got bigger and slower, and every non-/creators
         * page grew a SECOND og:title (see StaticPageSeoMiddleware).
         *
         * There is no legitimate use for the app-wide switch here, so the
         * footgun is removed rather than documented. **The kill switch is
         * `SSR_URL`**: blank it and `EnableSsr::willRender()` answers false, so
         * every route falls back to client-side rendering with no deploy of
         * code. `INERTIA_SSR_ENABLED` is now inert and its Vapor secret should
         * be deleted.
         */
        'enabled' => false,

        'url' => env('SSR_URL', env('INERTIA_SSR_URL', 'http://127.0.0.1:13714')),

        /*
         * 🚨 THE DEFAULT IS A MARKER PATH OUTSIDE `bootstrap/ssr/`, DELIBERATELY.
         *
         * BundleDetector only does file_exists() on this, and Lambda never
         * executes an SSR bundle — the render happens on the EC2 host. Shipping
         * the real 55MB build into the artefact breaks Lambda's 262MB ceiling,
         * so `vapor.yml` writes a small marker instead. It cannot live in
         * `bootstrap/ssr/`, because `.vaporignore` excludes that whole directory
         * to keep the local build out of the upload.
         *
         * ⚠️ Locally this path does not exist, and that is fine: BundleDetector
         * falls through to `bootstrap/ssr/ssr.mjs` and `bootstrap/ssr/ssr.js`,
         * so a real local `npm run ssr:build` is still detected.
         */
        'bundle' => base_path(env('INERTIA_SSR_BUNDLE', 'bootstrap/inertia-ssr.marker')),

        // Read by App\Services\Ssr\TimeoutGateway, which replaces Inertia's own
        // gateway. Stock behaviour is no timeout at all, i.e. the 30-second HTTP
        // default inside a 60-second Lambda. Renders measure 7-20ms warm, so 3
        // seconds is already generous; past that the page is better off
        // rendering client-side than waiting.
        'timeout' => env('INERTIA_SSR_TIMEOUT', 3),

        'connect_timeout' => env('INERTIA_SSR_CONNECT_TIMEOUT', 1),

    ],

    /*
    |--------------------------------------------------------------------------
    | Testing
    |--------------------------------------------------------------------------
    |
    | The values described here are used to locate Inertia components on the
    | filesystem. For instance, when using `assertInertia`, the assertion
    | attempts to locate the component as a file relative to any of the
    | paths AND with any of the extensions specified here.
    |
    */

    'testing' => [

        'ensure_pages_exist' => true,

        'page_paths' => [

            resource_path('js/Pages'),

        ],

        'page_extensions' => [

            'js',
            'jsx',
            'svelte',
            'ts',
            'tsx',
            'vue',
        ],

    ],

];
