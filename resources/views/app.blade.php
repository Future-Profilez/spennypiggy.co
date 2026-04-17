<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <script data-cfasync="false">
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
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index,follow" />
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    {{-- Critical performance hints --}}
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <link rel="dns-prefetch" href="//widget.trustpilot.com">
    <link rel="dns-prefetch" href="//static.ads-twitter.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    {{-- Basic performance hints --}}
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    {!! \App\SeoMeta::render() !!}

    {{-- PWA and App metadata --}}
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="Spenny Piggy">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#05EFB8">
    <meta name="application-name" content="Spenny Piggy">
    
    {{-- Prevent rubber-banding and zooming for native app feel --}}
    <style>
        html, body {
            background-color: #000000 !important;
        }
        @media all and (display-mode: standalone) {
            html, body {
                background-color: #05EFB8 !important;
            }
            body {
                overscroll-behavior-y: none;
                -webkit-user-select: none;
                user-select: none;
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
            }
            input, textarea, [contenteditable] {
                -webkit-user-select: auto;
                user-select: auto;
            }
            a, button {
                -webkit-tap-highlight-color: transparent;
            }
        }
    </style>
    
    {{-- Optimized favicon loading --}}
    <link rel="icon" href="{{ URL::asset('/favicon.ico') }}" sizes="any">
    <link rel="icon" href="{{ URL::asset('/favicon.svg') }}" type="image/svg+xml">
    <link rel="apple-touch-icon" href="{{ URL::asset('/apple-touch-icon.png') }}">
    <link rel="mask-icon" href="{{ URL::asset('/favicon.svg') }}" color="#05EFB8">
    
    <meta name="msapplication-TileColor" content="#05EFB8" />
    <meta name="msapplication-TileImage" content="{{ URL::asset('/siteicon.png') }}">
    <meta name="description" content="Join Memberships, adopt bills & more. Safe for all Creators who receive 100% payouts!" />
    <meta name="keywords" content="Exclusive Content, Memberships & More!, Join Memberships, adopt bills & more. Safe for all Creators who receive 100% payouts!, Create Wishlist, Share Wishlist, Add Wishlist, Recieve Gifts, Send Gifts, Fans Funding. The Best Alternative to Amazon Wishlist" />
    
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
    <meta property="og:title" content="Exclusive Content, Memberships & More!" />
    <meta property="og:type" content="video.movie" />
    <meta property="og:url" content="spennypiggy.co" />
    <meta property="og:image" content="{{ URL::asset('/siteicon.png') }}" />
    <meta property="og:site_name" content="spennypiggy.co" />
    <meta property="og:description" content="Join Memberships, adopt bills & more. Safe for all Creators who receive 100% payouts!" />

    <link rel="manifest" href="{{ url('/manifest.json')}}" />


    {{-- iOS splash screens for different devices --}}
    <link rel="apple-touch-startup-image" href="/apple-touch-icon.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">
    <link rel="apple-touch-startup-image" href="/apple-touch-icon.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">
    <link rel="apple-touch-startup-image" href="/apple-touch-icon.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)">
    <link rel="apple-touch-startup-image" href="/apple-touch-icon.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">
    <link rel="apple-touch-startup-image" href="/apple-touch-icon.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)">

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
            
            // Add PWA class to body for styling
            if (isStandalone) {
                document.addEventListener('DOMContentLoaded', function() {
                    document.body.classList.add('pwa-mode');
                    
                    // Add safe area padding specifically for header if not already handled
                    const style = document.createElement('style');
                    style.textContent = `
                        @supports (padding-top: env(safe-area-inset-top)) {
                            body.pwa-mode {
                                padding-top: env(safe-area-inset-top) !important;
                                padding-bottom: env(safe-area-inset-bottom) !important;
                            }
                            
                            /* Adjust header if it's fixed */
                            body.pwa-mode header, body.pwa-mode .header, body.pwa-mode nav {
                                padding-top: env(safe-area-inset-top) !important;
                            }
                            
                            /* Fix for bottom bar */
                            body.pwa-mode .retro-bottom-bar, body.pwa-mode .bottom-navigation {
                                position: fixed !important;
                                bottom: 0 !important;
                                left: 0 !important;
                                padding-bottom: env(safe-area-inset-bottom) !important;
                                box-sizing: content-box !important;
                                display: flex !important;
                                z-index: 999999 !important;
                                height: 60px !important;
                                width: 100vw !important;
                                margin: 0 !important;
                                transform: none !important;
                            }
                            
                            /* Ensure main content doesn't push bottom bar */
                            body.pwa-mode {
                                min-height: 100vh;
                                min-height: -webkit-fill-available;
                                display: block;
                            }
                            
                            body.pwa-mode main {
                                padding-bottom: calc(60px + env(safe-area-inset-bottom));
                            }
                        }
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
                    const viewport = document.querySelector('meta[name="viewport"]');
                    if (viewport) {
                        viewport.content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
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

    <script nonce="{{ $cspNonce ?? '' }}" async type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Spenny Piggy",
      "alternateName": "Exclusive Content, Memberships & More!",
      "url": "https://spennypiggy.co/",
      "logo": "https://d36ape3u423eoo.cloudfront.net/329a3236-4b42-40ed-abf7-61da55dbcb22/build/assets/logo-164abf9b.png",
      "sameAs": [
        "https://www.facebook.com/spennypiggy",
        "https://twitter.com/spennypiggy",
        "https://www.instagram.com/spennypiggy/",
        "https://blog.spennypiggy.co/"
      ]
    }
    </script>
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
    <script async type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "What is Spenny Piggy?",
                    "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Spenny Piggy is your one-stop party platform for every type of creator out there! Get those financial love taps, whip up a wishlist, dish out free and exclusive goodies, and even roll out bespoke memberships and custom commissions. It's the ultimate creator playground! 🚀"
                    }
                }, 
                {
                    "@type": "Question",
                    "name": "How do I get paid?",
                    "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Bag those bucks effortlessly with automatic Stripe payments! Your payment dashboard lets you be the money maestro, changing payout details on a whim. Initial payouts may take 7-14 days but are usually quick. In the United States/Aus, it's a snappy 2-day roll—charge Monday, party Wednesday. UK/European pals, enjoy a slick 7-day roll—the Monday magic. Keep in mind, payout dates may change based on your account status. If in doubt, reach out to Stripe and us for help! 💰"
                    }
                },
                {
                    "@type": "Question",
                    "name": "How much does it cost?",
                    "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Creators, listen up! The best part? It won't cost you a dime! You pocket the whole 100%. Sure, there might be some tiny conversion costs, but fear not—US, CAD, and UK creators, you're in the clear! Now, here's the scoop for Supporters: there's a service fee, starting at just 8%. But, for those creators craving extra perks, drop £29.99 per month for exclusive features and no service fees for supporters. They just handle the processing fees, making each transaction way cheaper. More money in your pocket, less in fees—win-win! 💸"
                    }
                },
                {
                    "@type": "Question",
                    "name": "What currencies do you offer?",
                    "acceptedAnswer": {
                    "@type": "Answer",
                        "text": "Pick your currency! Creators, you've got the choice between USD or GBP. If you're based in the UK, GBP; for the rest of the world, USD is the go-to. Customize your display currency, and supporters can do the same when making payments. Keeping it simple for everyone! 💲"
                    }
                }
            ]
        }
    </script>

    <script nonce="{{ $cspNonce ?? '' }}" async defer src="https://app.termly.io/resource-blocker/1f6672bd-7b65-47a4-8a75-d02946c93b2e?autoBlock=on"></script>
    
    {{-- @laravelPWA --}}
    @viteReactRefresh
    
    {{-- Critical CSS - Inline above-the-fold styles --}}
    {{-- @criticalCss($pageComponent) --}}
    
    {{-- Optimized Font Loading --}}
    {{-- @optimizeFonts --}}
    
    {{-- Self-hosted fonts are now preloaded via ResourcePreloadService --}}
    
    {{-- Standard Vite asset loading for both development and production --}}
    @vite(['resources/js/app.jsx'])
        
    <style>
        @media (max-width:991px){
            html body .intercom-lightweight-app-launcher{ margin-bottom:90px !important;}
        }
    </style>
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @php
        $isMarketingRoute = request()->is('/') || request()->is('creators') || request()->is('creators/*');
    @endphp
    @unless($isMarketingRoute)
    <!-- Initial loading screen for PWA (excluded on marketing pages) -->
    <div id="initial-loading-screen" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background: #000000;
        display: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        opacity: 1;
        transition: opacity 0.5s ease-out;
    ">
        <div style="display: flex; flex-direction: column; align-items: center; animation: fadeInUp 0.8s ease-out;">
            <img 
                src="{{ URL::asset('/siteicon.png') }}" 
                alt="Spenny Piggy Logo" 
                style="
                    width: 120px; 
                    height: 120px; 
                    border-radius: 20px; 
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); 
                    margin-bottom: 24px; 
                    animation: pulse 2s ease-in-out infinite; 
            "/>
            <h1 style="
                font-family: 'Anton', sans-serif;
                font-size: 28px;
                color: #ffffff;
                margin: 0 0 12px 0;
                text-align: center;
                font-weight: 400;
                letter-spacing: 1px;
            ">Spenny Piggy</h1>
            <div style="
                width: 40px;
                height: 4px;
                margin: 0 auto; width: 100%;
                padding: 20px;
                background: linear-gradient(90deg, #F94F96, #5D25FD);
                border-radius: 2px;
                margin-bottom: 20px;
                animation: loadingBar 1.5s ease-in-out infinite;
            "></div>
            <p style="
                font-family: 'Poppins', sans-serif;
                font-size: 14px;
                color: #ffffff;
                margin: 0 auto; width: 100%;
                padding: 20px;
                text-align: center;
            ">Loading your experience...</p>
        </div>
    </div>

    <style>
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
        }
        
        @keyframes loadingBar {
            0% {
                transform: scaleX(0.3);
                opacity: 0.5;
            }
            50% {
                transform: scaleX(1);
                opacity: 1;
            }
            100% {
                transform: scaleX(0.3);
                opacity: 0.5;
            }
        }
        
        /* Hide loading screen when app is ready */
        .app-loaded #initial-loading-screen {
            opacity: 0;
            pointer-events: none;
            display: none !important;
        }
    </style>

    <script nonce="{{ $cspNonce ?? '' }}">
        // Show loading screen only in PWA mode
        function isPWA() {
            return window.matchMedia('(display-mode: standalone)').matches ||
                   window.navigator.standalone === true ||
                   document.referrer.includes('android-app://');
        }

        if (!@json($isMarketingRoute) && isPWA()) {
            document.getElementById('initial-loading-screen').style.display = 'flex';
        }
        
        // Failsafe: hide loading screen after 5 seconds no matter what
        setTimeout(() => {
            const ls = document.getElementById('initial-loading-screen');
            if (ls) ls.style.display = 'none';
        }, 5000);
    </script>
    @endunless
    <script nonce="{{ $cspNonce ?? '' }}" type="speculationrules">
    {
    "prerender": [{ "source": "document", "eagerness": "moderate" }]
    }
</script>
    @inertia
</body>

</html>
