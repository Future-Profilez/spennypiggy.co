<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <script data-cfasync="false" nonce="{{ $cspNonce ?? '' }}">
        /**
         * EMERGENCY REACT PATCH: This script MUST run before ANY other JavaScript.
         * It fixes the "Cannot set properties of undefined (setting 'Children')" error
         * by providing a fallback React.Children API and protecting it from being 
         * overwritten by late-loading bundles.
         */
        (function() {
            // Comprehensive Children API implementation
            const createEmergencyChildrenAPI = () => {
                return {
                    map: function(children, fn, thisArg) {
                        if (children == null) return children;
                        const result = [];
                        let index = 0;
                        const traverse = (child) => {
                            if (child == null || typeof child === 'boolean') return;
                            if (Array.isArray(child)) {
                                child.forEach(traverse);
                            } else {
                                result.push(fn.call(thisArg, child, index++));
                            }
                        };
                        traverse(children);
                        return result;
                    },
                    forEach: function(children, fn, thisArg) {
                        if (children == null) return;
                        let index = 0;
                        const traverse = (child) => {
                            if (child == null || typeof child === 'boolean') return;
                            if (Array.isArray(child)) {
                                child.forEach(traverse);
                            } else {
                                fn.call(thisArg, child, index++);
                            }
                        };
                        traverse(children);
                    },
                    count: function(children) {
                        if (children == null) return 0;
                        let count = 0;
                        const traverse = (child) => {
                            if (child == null || typeof child === 'boolean') return;
                            if (Array.isArray(child)) {
                                child.forEach(traverse);
                            } else {
                                count++;
                            }
                        };
                        traverse(children);
                        return count;
                    },
                    only: function(children) {
                        if (Array.isArray(children)) {
                            if (children.length !== 1) throw new Error('React.Children.only expected to receive a single React element child.');
                            return children[0];
                        }
                        return children;
                    },
                    toArray: function(children) {
                        if (children == null) return [];
                        const result = [];
                        const traverse = (child) => {
                            if (child == null || typeof child === 'boolean') return;
                            if (Array.isArray(child)) {
                                child.forEach(traverse);
                            } else {
                                result.push(child);
                            }
                        };
                        traverse(children);
                        return result;
                    }
                };
            };

            const emergency = createEmergencyChildrenAPI();

            const patch = (target) => {
                if (!target || typeof target === 'undefined') return;
                
                // If React doesn't exist, create it with Children
                if (typeof target.React === 'undefined' || target.React === null) {
                    try {
                        Object.defineProperty(target, 'React', {
                            value: { Children: emergency },
                            writable: true,
                            configurable: true
                        });
                    } catch (e) {
                        target.React = { Children: emergency };
                    }
                } 
                // If React exists but Children doesn't, add Children
                else if (typeof target.React === 'object' && target.React !== null && !target.React.Children) {
                    try {
                        Object.defineProperty(target.React, 'Children', {
                            value: emergency,
                            writable: true,
                            configurable: true
                        });
                    } catch (e) {
                        target.React.Children = emergency;
                    }
                }
            };

            // Run immediately
            patch(window);
            patch(globalThis);

            // Run repeatedly for the first 10 seconds to catch late-loading bundles
            const interval = setInterval(() => {
                patch(window);
                patch(globalThis);
            }, 50);
            setTimeout(() => clearInterval(interval), 10000);
        })();

        /**
         * ZIGGY INITIALIZATION: Explicitly initialize Ziggy before Vite assets load.
         * This prevents "Ziggy is not defined" errors.
         */
        @if(isset($ziggy))
            window.Ziggy = @json($ziggy);
        @elseif(function_exists('route'))
            {{-- Fallback for cases where $ziggy is not shared but route() exists --}}
            @php
                try {
                    $ziggyData = app(config('ziggy.register_component', 'Tightenco\Ziggy\Ziggy'))->toArray();
                    echo "window.Ziggy = " . json_encode($ziggyData) . ";";
                } catch (\Exception $e) {}
            @endphp
        @endif
    </script>
    <meta charset="utf-8">
    {{-- maximum-scale/user-scalable=no blocked pinch-zoom, which fails the Lighthouse
         accessibility audit (and the SEO score that reads it) and locks out anyone who
         needs to zoom. viewport-fit=cover is what the PWA safe-area insets need and is
         kept; the zoom lock was never required for it. --}}
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    @inject('preloadService', 'App\Services\ResourcePreloadService')
    @php
        $pageComponent = $page['component'] ?? 'home';
        $template = str_contains(strtolower($pageComponent), 'welcome') ? 'home' : 
                   (str_contains(strtolower($pageComponent), 'dashboard') ? 'dashboard' : 
                   (str_contains(strtolower($pageComponent), 'profile') ? 'profile' : 'default'));
        
        $preloadService->preloadCriticalResources($template);
        
        $criticalCssPath = storage_path("app/critical-css/{$template}.css");
        $criticalCss = file_exists($criticalCssPath) ? file_get_contents($criticalCssPath) : null;
    @endphp
    
    @if($criticalCss)
        <style id="critical-css">{!! $criticalCss !!}</style>
    @endif
    
    {!! $preloadService->renderPreloadTags() !!}

    {{-- Critical performance hints --}}
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <link rel="dns-prefetch" href="//widget.trustpilot.com">
    <link rel="dns-prefetch" href="//static.ads-twitter.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    {{-- Basic performance hints --}}
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    @if(config('services.google.site_verification'))
        <meta name="google-site-verification" content="{{ config('services.google.site_verification') }}">
    @endif

    {!! \App\SeoMeta::render() !!}

    {{-- PWA and App metadata --}}
    <meta name="apple-mobile-web-app-capable" content="yes">
    {{-- ⚠️ black-translucent, not default. `default` paints a WHITE status bar
         strip above a dark app; this lets the header colour run underneath
         it instead. It requires the header to pad for env(safe-area-inset-top)
         — see Header.jsx — or the logo sits under the clock. --}}
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Spenny Piggy">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#9E0048">
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#9E0048">
    <meta name="application-name" content="Spenny Piggy">
    
    {{-- Native-app feel in the installed shell.

         ⚠️ ONE background colour, browser and standalone alike. The standalone
         rule used to repaint html/body bright teal `#05EFB8` while the browser
         rule painted them black, so the same page showed a different overscroll
         gutter depending on how it was opened, and launching the installed app
         jumped from the near-black splash (`background_color` in manifest.json)
         to a teal flash before the page painted. Keep these two in agreement
         with the manifest's `background_color`.

         🚨 `user-select: none` is scoped to CHROME, never to `body`. On `body`
         it killed text selection across the entire installed app — a supporter
         could not copy a payment reference, a creator's URL, an error code or a
         purchased message reward, and every one of those is something support
         asks people to paste. Buttons and nav do not want a selection highlight;
         content does. Inputs are re-enabled below regardless, belt and braces. --}}
    <style>
        html, body {
            background-color: #000000 !important;
        }
        @media all and (display-mode: standalone) {
            body {
                overscroll-behavior-y: none;
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
            }
            a, button, [role="button"], nav, .retro-bottom-bar {
                -webkit-user-select: none;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
            }

            /* 🚨 THE LINE ABOVE REMOVES THE ONLY TOUCH FEEDBACK THE OS GIVES,
               and it does so across the whole interactive surface — in the
               INSTALLED APP ONLY. Nothing replaced it, so a tap in the PWA
               looked identical to a tap that had not registered, and the app
               was reported as laggy when it was merely silent. If you ever drop
               the tap-highlight rule, drop this with it; never the reverse.

               Opacity, because it is the one property that works on any
               background and on any component without touching layout. NOT
               scale — resizing on press is banned sitewide (client direction),
               and on a control under a thumb it reads as a wobble. */
            a:active,
            button:active,
            [role="button"]:active,
            label:active {
                opacity: 0.62;
                /* ⚠️ Instant IN, eased OUT. Inheriting the transition in both
                   directions would delay the acknowledgement by its own
                   duration — which is the exact complaint this fixes. */
                transition-duration: 0s;
            }

            a, button, [role="button"], label {
                transition: opacity 160ms ease-out;
            }

            /* A disabled control must not answer a press: pretending it did is
               worse than the silence this replaces. */
            button:disabled:active,
            [role="button"][aria-disabled="true"]:active {
                opacity: 1;
            }
            input, textarea, [contenteditable] {
                -webkit-user-select: auto;
                user-select: auto;
            }
        }
    </style>
    
    {{-- Favicons.

         Safari has never supported SVG favicons for the tab icon, so it needs a
         raster it can actually read. It also treats `sizes="any"` as "this is
         scalable" and deprioritises the .ico against the SVG it cannot render —
         between the two, Safari found no usable icon and fell back to drawing the
         first letter of the title. The explicit PNG sizes below are what fixes it;
         keep at least the 32x32 PNG whatever else changes here.

         /favicon.svg is NOT a vector — it is a 1.1MB base64 raster wrapped in a
         <pattern> with zero paths, which is also why the old `mask-icon` did
         nothing (that tag requires a monochrome vector). It is left out entirely
         rather than kept as decoration. --}}
    <link rel="icon" href="{{ URL::asset('/favicon.ico') }}" sizes="32x32">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ URL::asset('/favicon-32x32.png') }}">
    <link rel="icon" type="image/png" sizes="16x16" href="{{ URL::asset('/favicon-16x16.png') }}">
    <link rel="icon" type="image/png" sizes="96x96" href="{{ URL::asset('/favicon-96x96.png') }}">
    <link rel="icon" type="image/png" sizes="192x192" href="{{ URL::asset('/favicon-192x192.png') }}">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ URL::asset('/apple-touch-icon.png') }}">
    
    <meta name="msapplication-TileColor" content="#9E0048" />
    {{-- ⚠️ `/siteicon.png` answers 404 in production — it has no proxy route, and a
         file under `public/` is not served on the app domain. Point Windows at a
         routed icon like every other tag here. --}}
    <meta name="msapplication-TileImage" content="{{ url('/android-chrome-192x192.png') }}">
    
    {{-- Minimal critical CSS --}}
    <style>
        body {
            margin: 0;
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        }
    </style>
    
    {{-- Optimized Google Fonts loading --}}
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&family=Anton&family=Fredoka:wght@300..700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&family=Anton&family=Fredoka:wght@300..700&display=swap" rel="stylesheet"></noscript>

    <link rel="manifest" href="{{ url('/manifest.json')}}" />


    {{-- iOS launch images.

         🚨 Every one of these used to point at `apple-touch-icon.png` (512x512).
         iOS matches a startup image on EXACT device pixel dimensions and ignores
         a tag whose image is not that size — it does not scale it and it does not
         fall back — so the whole set was inert and the installed app launched to a
         blank screen. Sizes and files come from App\Support\PwaSplash, which is the
         one definition; never type a size in here.

         ⚠️ Served by the `ios.splash` ROUTE, not from `public/` — a file under
         `public/` is not served on the app domain (see the icon routes in
         routes/web.php). Portrait only: the manifest declares `orientation:
         portrait`, and a landscape set would double what ships in the Lambda. --}}
    @foreach (\App\Support\PwaSplash::LAUNCH_IMAGES as $device)
        <link rel="apple-touch-startup-image"
              href="{{ url('/ios-splash/'.\App\Support\PwaSplash::fileFor($device).'.png') }}"
              media="(device-width: {{ $device['w'] }}px) and (device-height: {{ $device['h'] }}px) and (-webkit-device-pixel-ratio: {{ $device['dpr'] }}) and (orientation: portrait)">
    @endforeach

    <script nonce="{{ $cspNonce ?? '' }}">
        const css1 = [
            "font-size: 15px",
            "display:block",
            "color:#37e1ad",
            "width: 100%",
            "padding:30px 30px",
        ];
        
        (function() {
            // Detect if running as PWA
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                                window.navigator.standalone ||
                                document.referrer.includes('android-app://');

            // ⚠️ Stamped on <html> from HEAD, before <body> is parsed, so the launch
            // screen is gated by CSS rather than by a script that runs after the
            // element has already been laid out. A browser visitor never renders it
            // at all; the installed app renders it with its own first paint.
            if (isStandalone) {
                document.documentElement.className += ' sp-standalone';
            }

            // If running as standalone PWA and user is logged in, redirect directly to profile page
            if (isStandalone && window.location.pathname === '/') {
                try {
                    const pageData = JSON.parse(document.getElementById('app').dataset.page || '{}');
                    const username = pageData?.props?.auth?.user?.username;
                    if (username) {
                        window.location.replace('/' + username);
                        return;
                    }
                } catch(e) {}
            }

            // Add PWA class to body for styling
            if (isStandalone) {
                document.addEventListener('DOMContentLoaded', function() {
                    document.body.classList.add('pwa-mode');
                    
                    // Add safe area padding and native app feel specifically for PWA
                    const style = document.createElement('style');
                    style.textContent = `
                        html, body {
                            overscroll-behavior-y: none;
                            -webkit-tap-highlight-color: transparent;
                        }

                        /* NOTE: never set overflow-x or overscroll-behavior on BODY here —
                           body then becomes its own scroll container and overscroll
                           containment blocks chaining to the viewport, which killed ALL
                           touch scrolling in the installed PWA. Rubber-band prevention
                           lives on html above. */
                        body.pwa-mode {
                            margin: 0 !important;
                            padding: 0 !important;
                            -webkit-user-select: none;
                            user-select: none;
                        }

                        body.pwa-mode input,
                        body.pwa-mode textarea,
                        body.pwa-mode [contenteditable="true"],
                        body.pwa-mode p,
                        body.pwa-mode span,
                        body.pwa-mode article {
                            -webkit-user-select: text;
                            user-select: text;
                        }

                        /* Adjust fixed header for notch safe area */
                        body.pwa-mode header, body.pwa-mode .header, body.pwa-mode nav {
                            padding-top: max(10px, env(safe-area-inset-top, 0px)) !important;
                        }
                        
                        /* Bottom bar styling lives in resources/css/retro-bottombar.css
                           (docked, safe-area aware). Do not override it here — the old
                           floating-pill !important override fought that stylesheet. */
                    `;
                    document.head.appendChild(style);
                    
                    // Prevent context menu (long press popup) except on inputs/images
                    document.addEventListener('contextmenu', function(e) {
                        if (e.target.tagName !== 'INPUT' && 
                            e.target.tagName !== 'TEXTAREA' && 
                            e.target.tagName !== 'IMG' && 
                            !e.target.isContentEditable) {
                            e.preventDefault();
                        }
                    });
                });
            }
            
            // iOS PWA viewport fix
            if (isStandalone && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
                document.addEventListener('DOMContentLoaded', function() {
                    // Fix iOS PWA viewport issues
                    // Re-assert viewport-fit=cover for the iOS standalone shell only.
                    // It must match the tag in <head> — re-adding user-scalable=no here
                    // put the zoom lock straight back on the installed app.
                    const viewport = document.querySelector('meta[name="viewport"]');
                    if (viewport) {
                        viewport.content = 'width=device-width,initial-scale=1,viewport-fit=cover';
                    }
                });
            }
        })();
        
        window.platformFeePercentage = {{ config('app.platform_fee_percentage', 20) }};
    </script>
    <script nonce="{{ $cspNonce ?? '' }}" type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "url": "https://spennypiggy.co/",
            "potentialAction": {
                "@type": "SearchAction",
                "target": "https://spennypiggy.co/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
            }
        }
    </script>

    @if(request()->is('/'))
    <script nonce="{{ $cspNonce ?? '' }}" type="application/ld+json">
    { 
      "@context": "https://schema.org", 
      "@type": "Organization", 
      "name": "Spenny Piggy", 
      "alternateName": "Spenny Piggy by Social Vortex", 
      "url": "https://spennypiggy.co", 
      "logo": "https://spennypiggy.co/logo.png", 
      "description": "A creator monetisation platform combining memberships, wishlists, paid tasks, and tips in one place. Built for creators globally.", 
      "sameAs": [ 
        "https://x.com/spennypiggy", 
        "https://instagram.com/spennypiggy", 
        "https://tiktok.com/@spennypiggy", 
        "https://www.snapchat.com/add/spennypiggy", 
        "https://www.youtube.com/@spennypiggy" 
      ], 
      "contactPoint": { 
        "@type": "ContactPoint", 
        "email": "support@spennypiggy.co", 
        "telephone": "+44 20 335 52057", 
        "contactType": "customer support", 
        "availableLanguage": ["English"] 
      }, 
      "address": { 
        "@type": "PostalAddress", 
        "streetAddress": "55 Colmore Row", 
        "addressLocality": "Birmingham", 
        "postalCode": "B3 2AA", 
        "addressCountry": "GB" 
      } 
    } 
    </script>
    @endif
    <script nonce="{{ $cspNonce ?? '' }}" async type="application/ld+json">
        {
        "@context":"http://schema.org",
        "@type":"SiteNavigationElement",
        "name":["Exclusive Content, Memberships & More!"],
        "url":["https://spennypiggy.co/",
        "https://intercom.help/spenny-piggy/en/",
        "https://spennypiggy.co/login",
        "https://spennypiggy.co/leaderboard",
        "https://spennypiggy.co/discover",
        "https://uk.spennypiggy.co/register"]
        }
    </script>
    <script nonce="{{ $cspNonce ?? '' }}" async type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "What is Spenny Piggy?",
                    "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Spenny Piggy is a creator monetisation platform where supporters can send gifts, join memberships, and purchase creator offerings like wishlists and paid tasks."
                    }
                }, 
                {
                    "@type": "Question",
                    "name": "How do I get paid?",
                    "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Creators get paid via Stripe payouts to their connected account. Payout timing depends on Stripe and account status, and can vary by country and verification."
                    }
                },
                {
                    "@type": "Question",
                    "name": "How much does it cost?",
                    "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Creators set their prices and supporters pay at checkout. Fees may apply depending on the product and plan. See the Pricing page for the latest details."
                    }
                },
                {
                    "@type": "Question",
                    "name": "What currencies do you offer?",
                    "acceptedAnswer": {
                    "@type": "Answer",
                        "text": "Creators can choose supported currencies such as GBP and USD depending on their country and Stripe configuration. Supporters pay in the currency shown at checkout."
                    }
                }
            ]
        }
    </script>

    <script nonce="{{ $cspNonce ?? '' }}" type="text/javascript" src="https://app.termly.io/embed.min.js" data-auto-block="off" data-website-uuid="1f6672bd-7b65-47a4-8a75-d02946c93b2e"></script>

    {{-- @laravelPWA --}}
    @viteReactRefresh
    
    {{-- Critical CSS - Inline above-the-fold styles --}}
    {{-- @criticalCss($pageComponent) --}}
    
    {{-- Optimized Font Loading --}}
    {{-- @optimizeFonts --}}
    
    {{-- Self-hosted fonts are now preloaded via ResourcePreloadService --}}
    
    {{-- Standard Vite asset loading for both development and production --}}
    @vite(['resources/js/app.jsx'])
        
    {{-- 🚨 The Intercom launcher's clearance lives in `resources/css/retro-bottombar.css`,
         derived from `--sp-bottombar-h`, and NOWHERE ELSE. A hardcoded
         `html body .intercom-lightweight-app-launcher { margin-bottom: 90px !important }`
         used to sit here at `max-width: 991px` and was the whole "sometimes high,
         sometimes low" bug: it STACKED on top of that derived offset (90 + 69 = 159px up,
         so the icon floated 102px clear of the bar mid-content), it applied to a breakpoint
         190px wider than the bar's own so it also shifted the launcher on tablets that have
         no bar at all, and it matched ONLY the pre-boot lightweight launcher — so the icon
         dropped 90px the moment the messenger finished booting. Do not reintroduce a
         per-page or per-layout Intercom offset here. --}}
    {{-- Google tag (gtag.js) — GA4 analytics + Google Ads conversion/remarketing.
         ONE loader, TWO configs. That is Google's documented way to run both from a single
         tag; a second gtag.js <script> would re-register dataLayer and double-count, so do
         not add one anywhere else. Loaded async and placed last in <head> so it never
         blocks first paint. --}}
    <script nonce="{{ $cspNonce ?? '' }}" async src="https://www.googletagmanager.com/gtag/js?id=G-EQCXDEV7QV"></script>
    <script nonce="{{ $cspNonce ?? '' }}">
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-EQCXDEV7QV');
        gtag('config', 'AW-11395921981');
    </script>

    @inertiaHead
</head>

<body class="font-sans antialiased">
    {{--
        The installed app's launch screen. It continues the iOS
        `apple-touch-startup-image` (and the Android manifest splash) with the SAME
        artwork, so launch → this → app is one field rather than three, and it
        covers the long part of a cold start: the wait for the JS bundle to boot
        and Inertia to render its first page.

        🚨 It is drawn in CSS with ONE image, deliberately. The generated launch
        PNGs cannot be reused here — a file under `public/` is not served on the
        app domain and the route-served set is per-device, so the in-app copy has
        to be resolution-independent. The one image is the app icon, which comes
        through a proxy route like every other icon.

        ⚠️ NO LONGER EXCLUDED ON MARKETING ROUTES. It used to sit inside an
        `@unless($isMarketingRoute)`, and the manifest's `start_url` IS `/` — so
        the launch screen never rendered on a cold start of the installed app,
        which is the only moment it exists for. Gating is `html.sp-standalone`
        (stamped from HEAD), so a browser visitor still never sees it.

        ⚠️ `siteicon.png` was the old logo here and answers 404 in production (no
        proxy route), so every installed user saw a broken image on every launch.
        Read the icon from a ROUTED path, never from `public/`.

        ⚠️ Geometry mirrors the PNG generator: the base unit is
        `min(100vw, 55vh)`, not viewport width. A width-relative type scale is
        ~27% too large for the height available on a tablet and collides with the
        violet field. Keep the two in step if either changes.

        The id and the `.app-loaded` hide are load-bearing — `app.jsx` and the boot
        watchdog below both address this element by id.
    --}}
    <div id="initial-loading-screen" aria-hidden="true">
        <span class="sp-launch__mint"></span>
        <span class="sp-launch__yellow"></span>
        <span class="sp-launch__field"></span>

        <img class="sp-launch__mark"
             src="{{ url('/android-chrome-192x192.png') }}"
             width="192" height="192" alt="" decoding="async">

        <div class="sp-launch__word">
            <span>Spenny</span>
            <span>Piggy</span>
        </div>
        <p class="sp-launch__tag">Exclusive content · Memberships</p>

        <span class="sp-launch__dots"><i></i><i></i><i></i></span>
        <span class="sp-launch__mintdot"></span>
        <span class="sp-launch__pinkdot"></span>
    </div>

    <style>
        #initial-loading-screen {
            /* U — the same base unit the launch-image generator uses. */
            --u: min(100vw, 55vh);
            /* Wordmark size — the same 0.15 of U the launch-image generator uses,
               measured at ~60% of U for the longer word. Everything below derives
               from it, so the stack cannot fall out of step with the type. */
            --w: calc(var(--u) * 0.15);
            --wblock: calc(var(--w) * 1.84);
            --tag-top: calc(36% + var(--u) * 0.3 + var(--wblock) + var(--u) * 0.05);
            /* Top of the violet field: never above 70%, and always clear of the
               stack above it, which grows with U. */
            --arc: max(70%, calc(var(--tag-top) + var(--u) * 0.146));

            position: fixed;
            inset: 0;
            display: none;
            overflow: hidden;
            z-index: 9999;
            background: #FF007F;
            opacity: 1;
            transition: opacity 380ms ease-out;
        }

        /* Only the installed app renders it. Stamped on <html> from HEAD so this
           is decided before <body> is parsed — no flash for a browser visitor. */
        html.sp-standalone #initial-loading-screen { display: block; }

        /* 🚨 The window's own backdrop is BLACK (the `html, body` rule earlier in
           <head>, which carries !important), so any region the webview has not
           painted yet composites as a black band over the launch screen — reported
           from an installed iPhone as a black strip along the bottom edge. While
           the screen is up, the backdrop is the screen's own pink; `sp-launched`
           is added by app.jsx the moment the app has painted, and by the boot
           watchdog if it never does, so this can never strand a pink window.

           ⚠️ Scoped to `html.sp-standalone`. Painting the body a second colour in
           the installed app is what once produced the teal launch flash and pink
           overscroll gutters — the class is what keeps it to the launch window
           only, and a browser visitor is never touched. */
        html.sp-standalone,
        html.sp-standalone body { background-color: #FF007F !important; }

        html.sp-standalone.sp-launched,
        html.sp-standalone.sp-launched body { background-color: #000000 !important; }

        /* 🚨 Named classes, NEVER `#initial-loading-screen span`. That selector
           carries id specificity, so it beat every later class rule and turned
           the two wordmark lines and the dot row into absolutely-positioned
           black-bordered circles — the wordmark drew both words on the same
           pixels inside an ellipse. A shape list is the only thing that can be
           reset by the rules underneath it. */
        .sp-launch__mint,
        .sp-launch__yellow,
        .sp-launch__field,
        .sp-launch__mintdot,
        .sp-launch__pinkdot {
            position: absolute;
            box-sizing: border-box;
            border-radius: 50%;
            border: max(2px, calc(var(--u) * 0.0085)) solid #000;
        }

        .sp-launch__mint {
            width: calc(var(--u) * 0.6); height: calc(var(--u) * 0.6);
            left: calc(2% - var(--u) * 0.3); top: calc(5.5% - var(--u) * 0.3);
            background: #05EFB8;
        }

        .sp-launch__yellow {
            width: calc(var(--u) * 0.17); height: calc(var(--u) * 0.17);
            left: calc(90% - var(--u) * 0.085); top: calc(17.5% - var(--u) * 0.085);
            background: #E6EA7B;
        }

        /* The violet field is one very large circle, so only its top arc is on
           screen — the same shape the launch PNGs carry. */
        .sp-launch__field {
            width: 280vw; height: 280vw;
            left: 50%; margin-left: -140vw;
            top: var(--arc);
            background: #8C52FF;
        }

        .sp-launch__mintdot {
            width: calc(var(--u) * 0.1); height: calc(var(--u) * 0.1);
            left: calc(15.5% - var(--u) * 0.05);
            top: calc(var(--arc) + (100% - var(--arc)) * 0.6 - var(--u) * 0.05);
            background: #05EFB8;
        }

        .sp-launch__pinkdot {
            width: calc(var(--u) * 0.06); height: calc(var(--u) * 0.06);
            left: calc(85% - var(--u) * 0.03);
            top: calc(var(--arc) + (100% - var(--arc)) * 0.85 - var(--u) * 0.03);
            background: #FF007F;
        }

        .sp-launch__mark {
            position: absolute;
            left: 50%; top: 36%;
            width: calc(var(--u) * 0.4); height: calc(var(--u) * 0.4);
            margin: calc(var(--u) * -0.2) 0 0 calc(var(--u) * -0.2);
            animation: sp-launch-rise 520ms ease-out both, sp-launch-bob 3.2s 520ms ease-in-out infinite;
        }

        /* 🚨 BLACK on brand pink, never white — measured 5.56:1 against white's
           3.78:1, which fails AA at label size. Same rule as every other pink
           surface in the app. */
        .sp-launch__word,
        .sp-launch__tag { position: absolute; left: 0; right: 0; text-align: center; color: #000; margin: 0; }

        .sp-launch__word {
            top: calc(36% + var(--u) * 0.3);
            font-family: 'gulfs', 'Anton', system-ui, sans-serif;
            font-size: var(--w);
            /* A RATIO, never a number — numeric line-heights are remapped to
               PIXELS by this project's Tailwind config, and the same mistake in
               raw CSS reads as text on top of itself. */
            line-height: 0.92;
            text-transform: uppercase;
            letter-spacing: calc(var(--u) * 0.004);
            animation: sp-launch-rise 520ms 90ms ease-out both;
        }

        .sp-launch__word span { display: block; }

        .sp-launch__tag {
            top: var(--tag-top);
            font-family: 'CeraGRMedium', 'Poppins', system-ui, sans-serif;
            font-size: calc(var(--u) * 0.03);
            line-height: 1.2;
            text-transform: uppercase;
            letter-spacing: calc(var(--u) * 0.008);
            /* ⚠️ The line must be allowed to wrap rather than be clipped by the
               screen's own `overflow: hidden` — letter-spacing applies after the
               last character too, so this runs wider than the glyphs suggest. */
            padding: 0 6vw;
            color: rgba(0, 0, 0, 0.72);
            animation: sp-launch-rise 520ms 160ms ease-out both;
        }

        .sp-launch__dots {
            position: absolute;
            display: flex;
            gap: calc(var(--u) * 0.027);
            left: 50%; transform: translateX(-50%);
            top: calc(var(--arc) + (100% - var(--arc)) * 0.3);
        }

        .sp-launch__dots i {
            width: calc(var(--u) * 0.028); height: calc(var(--u) * 0.028);
            border-radius: 50%; background: #000;
            animation: sp-launch-pulse 1.2s ease-in-out infinite;
        }

        .sp-launch__dots i:nth-child(2) { animation-delay: 160ms; }
        .sp-launch__dots i:nth-child(3) { animation-delay: 320ms; }

        @keyframes sp-launch-rise {
            from { opacity: 0; transform: translateY(calc(var(--u) * 0.03)); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* The mark is absolutely placed by margin, so its animation must not
           reintroduce a translate on the same axis as its centring offset. */
        @keyframes sp-launch-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(calc(var(--u) * -0.018)); }
        }

        @keyframes sp-launch-pulse {
            0%, 100% { opacity: 0.28; }
            40% { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
            #initial-loading-screen *,
            #initial-loading-screen { animation: none !important; transition: none !important; }
        }

        /* app.jsx adds `app-loaded` once React has mounted. */
        .app-loaded #initial-loading-screen {
            opacity: 0;
            pointer-events: none;
        }
    </style>

    {{--
        Boot watchdog. Declared OUTSIDE the loading-screen block on purpose: it has
        to run on every route, and it has to run even when the JS bundle never
        executes — which is the whole case it exists for, and the reason it cannot
        live in `app.jsx`.

        The failsafe it replaces hid the black loading screen after 5s "no matter
        what" and did nothing else, so a page whose bundle failed to boot was left
        showing an empty black screen with no way forward. That is the crash
        reported on 14 Aug 2026: take a screenshot in the installed PWA, background
        it, come back, and iOS — which had jettisoned the WKWebView content process
        under the memory pressure — relaunches into a document that boots nothing.

        Reloading alone did not fix it, which is why this needs the cache drop: the
        service worker's HTML route was StaleWhileRevalidate, so every reload was
        answered with the same stale document naming build chunks a later deploy had
        already replaced. That route is NetworkFirst now (see `public/sw.js`); this
        clears any document already stuck in a user's cache from before that change.

        The guard is a timestamp, not a flag, for the reason given in `app.jsx`: a
        one-shot flag reset by a lifecycle event that also fires on first load will
        re-arm itself and reload forever.
    --}}
    <script nonce="{{ $cspNonce ?? '' }}">
        (function () {
            var RECOVER_KEY = 'spenny_boot_recovered_at';
            var RECOVER_COOLDOWN_MS = 60000;
            var BOOT_TIMEOUT_MS = 8000;

            function booted() {
                var root = document.getElementById('app');
                return !!(root && root.children.length);
            }

            function recover() {
                var last = 0;

                try {
                    last = Number(sessionStorage.getItem(RECOVER_KEY)) || 0;
                    if (Date.now() - last < RECOVER_COOLDOWN_MS) return;
                    sessionStorage.setItem(RECOVER_KEY, String(Date.now()));
                } catch (e) {
                    // Private mode / storage blocked. Without a cooldown a reload
                    // cannot be rate-limited, so leave the page alone rather than
                    // risk looping.
                    return;
                }

                var reload = function () { window.location.reload(); };

                if (window.caches && window.caches.delete) {
                    window.caches.delete('pages-v1').then(reload, reload);
                } else {
                    reload();
                }
            }

            function check() {
                var ls = document.getElementById('initial-loading-screen');
                if (ls) ls.style.display = 'none';

                // ⚠️ Must mirror app.jsx's revealApp(). Without it a boot that
                // never happens leaves the installed app on a bare pink window —
                // the launch backdrop with nothing on it — and the recovery
                // cooldown below can legitimately decline to reload.
                document.documentElement.classList.add('sp-launched');

                if (!booted()) recover();
            }

            setTimeout(check, BOOT_TIMEOUT_MS);
        }());
    </script>
    <script nonce="{{ $cspNonce ?? '' }}" type="speculationrules">
    {
    "prerender": [{ "source": "document", "eagerness": "moderate" }]
    }
</script>
    @inertia
</body>

</html>
