<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    {{-- EMERGENCY: React Children patch must load before ANY other JavaScript --}}
    <script src="{{ asset('react-emergency-patch.js') }}"></script>
    
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index,follow" />
    
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
    <meta name="mobile-web-app-capable" content="yes"/>
    <meta name="theme-color" content="#05EFB8" />
    
    {{-- Optimized favicon loading --}}
    <link rel="icon" href="{{ URL::asset('/favicon.ico') }}" sizes="any">
    <link rel="icon" href="{{ URL::asset('/favicon.svg') }}" type="image/svg+xml">
    <link rel="apple-touch-icon" href="{{ URL::asset('/apple-touch-icon.png') }}">
    <link rel="mask-icon" href="{{ URL::asset('/favicon.svg') }}" color="#05EFB8">
    
    <meta name="msapplication-TileColor" content="#05EFB8" />
    <meta name="msapplication-TileImage" content="{{ URL::asset('/siteicon.png') }}">
    <meta name="description" content="Join Memberships, adopt bills & more. Safe for all Creators who receive 100% payouts!" />
    <meta name="keywords" content="Exclusive Content, Memberships & More!, Join Memberships, adopt bills & more. Safe for all Creators who receive 100% payouts!, Create Wishlist, Share Wishlist, Add Wishlist, Recieve Gifts, Send Gifts, Fans Funding. The Best Alternative to Amazon Wishlist" />
<<<<<<< HEAD
    {{-- Comprehensive Resource Preloading & Prefetching --}}
    @php
        $pageComponent = 'home';
        if (isset($page) && is_array($page) && isset($page['component'])) {
            $pageComponent = $page['component'];
        }
    @endphp
    {{-- @resourceOptimization($pageComponent) --}}
    
    {{-- Critical Hero Image Preloading for LCP Optimization --}}
    @if($pageComponent === 'home' || $pageComponent === 'Welcome')
        {{-- Preload hero background images in order of format efficiency --}}
        <link rel="preload" as="image" href="{{ Vite::asset('resources/assets/new/HeroBg.avif') }}" type="image/avif" fetchpriority="high">
        <link rel="preload" as="image" href="{{ Vite::asset('resources/assets/new/HeroBg.webp') }}" type="image/webp" fetchpriority="high">
        <link rel="preload" as="image" href="{{ Vite::asset('resources/assets/new/HeroBg.png') }}" type="image/png" fetchpriority="high">
        
        {{-- Mobile-specific preloads for smaller screens --}}
        <link rel="preload" as="image" href="{{ Vite::asset('resources/assets/new/HeroBg-mobile.avif') }}" type="image/avif" media="(max-width: 480px)" fetchpriority="high">
        <link rel="preload" as="image" href="{{ Vite::asset('resources/assets/new/HeroBg-mobile.webp') }}" type="image/webp" media="(max-width: 480px)" fetchpriority="high">
        
        {{-- Preload other critical above-the-fold images --}}
        <link rel="preload" as="image" href="{{ Vite::asset('resources/assets/img/itsfree.png') }}" type="image/png" fetchpriority="high">
        <link rel="preload" as="image" href="{{ Vite::asset('resources/assets/img/itsfree-mob.png') }}" type="image/png" media="(max-width: 768px)" fetchpriority="high">
    @endif
    
    <!-- Google Fonts - will be loaded asynchronously below -->
=======
    
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
>>>>>>> 65802cfe9cf3eb1ab0f86ad06cde649a00c91259
    <meta property="og:title" content="Exclusive Content, Memberships & More!" />
    <meta property="og:type" content="video.movie" />
    <meta property="og:url" content="spennypiggy.co" />
    <meta property="og:image" content="{{ URL::asset('/siteicon.png') }}" />
    <meta property="og:site_name" content="spennypiggy.co" />
    <meta property="og:description" content="Join Memberships, adopt bills & more. Safe for all Creators who receive 100% payouts!" />

<<<<<<< HEAD
    {{-- Defer Trustpilot widget loading --}}
    <script>
        // Lazy load Trustpilot widget after user interaction or idle time
        function loadTrustpilot() {
            if (!window.trustpilotLoaded) {
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.async = true;
                script.src = '//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
                script.importance = 'low';
                document.head.appendChild(script);
                window.trustpilotLoaded = true;
            }
        }
        
        // Load after user interaction or idle time
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                setTimeout(loadTrustpilot, 3000);
            });
        } else {
            setTimeout(loadTrustpilot, 3000);
        }
        
        // Also load on user interaction
        ['mousedown', 'touchstart', 'keydown', 'scroll'].forEach(event => {
            document.addEventListener(event, loadTrustpilot, { once: true, passive: true });
        });
    </script>

    <link rel="manifest" href="{{ url('/manifest.json')}}" />
    <script>
        // Defer service worker registration
        if ('serviceWorker' in navigator) {
            function registerSW() {
                navigator.serviceWorker.register('/new-service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
            }
            
            if ('requestIdleCallback' in window) {
                requestIdleCallback(registerSW);
            } else {
                setTimeout(registerSW, 100);
            }
        }
    </script>
    
    {{-- Defer Twitter ads tracking --}}
    <script>
        // Lazy load Twitter ads after user interaction or idle time
        function loadTwitterAds() {
            if (!window.twitterAdsLoaded) {
                !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
                },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.importance='low',u.src='https://static.ads-twitter.com/uwt.js',
                a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
                twq('config','ozu4h');
                window.twitterAdsLoaded = true;
            }
        }
        
        // Load after user interaction or idle time
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                setTimeout(loadTwitterAds, 5000);
            });
        } else {
            setTimeout(loadTwitterAds, 5000);
        }
        
        // Also load on meaningful user interaction
        ['click', 'scroll', 'keydown', 'touchstart'].forEach(event => {
            document.addEventListener(event, loadTwitterAds, { once: true, passive: true });
        });
    </script>
=======
    <link rel="manifest" href="{{ url('/manifest.json')}}" />
>>>>>>> 65802cfe9cf3eb1ab0f86ad06cde649a00c91259


    <link rel="apple-touch-startup-image"
      href="/splash-640x1136.png"
      media="(device-width: 320px) and (device-height: 568px)
             and (-webkit-device-pixel-ratio: 2)
             and (orientation: portrait)">

    <script>
        const css1 = [
            "font-size: 15px",
            "display:block",
            "color:#37e1ad",
            "width: 100%",
            "padding:30px 30px",
        ];
    </script>
    <script type="application/ld+json">
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

    <script async type="application/ld+json">
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
    <script async type="application/ld+json">
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
                }, {
                    "@type": "Question",
                    "name": "How do I get paid?",
                    "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Bag those bucks effortlessly with automatic Stripe payments! Your payment dashboard lets you be the money maestro, changing payout details on a whim. Initial payouts may take 7-14 days but are usually quick. In the United States/Aus, it's a snappy 2-day roll—charge Monday, party Wednesday. UK/European pals, enjoy a slick 7-day roll—the Monday magic. Keep in mind, payout dates may change based on your account status. If in doubt, reach out to Stripe and us for help! 💰"
                    }
                }, {
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

    {{-- @laravelPWA --}}
    @routes
    @viteReactRefresh
    
    {{-- Critical CSS - Inline above-the-fold styles --}}
    {{-- @criticalCss($pageComponent) --}}
    
    {{-- Optimized Font Loading --}}
    {{-- @optimizeFonts --}}
    
    {{-- Self-hosted fonts are now preloaded via ResourcePreloadService --}}
    
    {{-- Standard Vite asset loading for both development and production --}}
    @vite(['resources/js/app.jsx'])
    
    @inertiaHead
</head>

<body className="font-sans antialiased">
    @inertia
</body>

</html>
